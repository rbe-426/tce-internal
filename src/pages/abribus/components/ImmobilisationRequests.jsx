import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
  HStack,
  Badge,
  Input,
  Textarea,
  Heading,
  Select,
  Alert,
  AlertIcon,
  Spinner,
} from '@chakra-ui/react';
import { API_URL } from '../../config';
import { UserContext } from '../../context/UserContext';

const ImmobilisationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterStatus, setFilterStatus] = useState('EN_ATTENTE');
  const { user } = useContext(UserContext);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rejectionReason, setRejectionReason] = useState('');

  // Charger les demandes
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/immobilisations?statut=${filterStatus}`);
        if (response.ok) {
          const data = await response.json();
          setRequests(data.immobilisations || []);
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les demandes',
          status: 'error',
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [filterStatus, toast]);

  const handleApprove = async (requestId) => {
    try {
      const response = await fetch(`${API_URL}/api/immobilisations/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: 'APPROUVÉ',
          approvedById: user?.id,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'approbation');

      // Actualiser
      setRequests(requests.filter(r => r.id !== requestId));
      onClose();

      toast({
        title: 'Succès',
        description: 'Demande approuvée',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez fournir une raison de rejet',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/immobilisations/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: 'REJETÉ',
          raison_rejet: rejectionReason,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors du rejet');

      // Actualiser
      setRequests(requests.filter(r => r.id !== requestId));
      setRejectionReason('');
      onClose();

      toast({
        title: 'Succès',
        description: 'Demande rejetée',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'EN_ATTENTE': return 'orange';
      case 'APPROUVÉ': return 'green';
      case 'REJETÉ': return 'red';
      case 'COMPLÉTÉ': return 'gray';
      default: return 'blue';
    }
  };

  const openRequestDetail = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    onOpen();
  };

  if (loading) {
    return (
      <Card>
        <CardBody>
          <VStack justify="center" py={8}>
            <Spinner size="lg" color="blue.500" />
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <HStack mb={4} justify="space-between">
          <Heading size="md">Demandes d'immobilisation</Heading>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            maxW="200px"
          >
            <option value="EN_ATTENTE">En attente</option>
            <option value="APPROUVÉ">Approuvées</option>
            <option value="REJETÉ">Rejetées</option>
            <option value="COMPLÉTÉ">Complétées</option>
          </Select>
        </HStack>

        {requests.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            Aucune demande {filterStatus === 'EN_ATTENTE' ? 'en attente' : filterStatus.toLowerCase()}
          </Alert>
        ) : (
          <Box overflowX="auto">
            <Table size="sm" variant="striped">
              <Thead>
                <Tr>
                  <Th>Véhicule</Th>
                  <Th>Motif</Th>
                  <Th>Demandé par</Th>
                  <Th>Date début</Th>
                  <Th>Poste</Th>
                  <Th>Statut</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {requests.map(request => (
                  <Tr key={request.id}>
                    <Td fontWeight="bold">{request.vehicleParc}</Td>
                    <Td>{request.motif}</Td>
                    <Td>
                      {request.createdBy.nom} {request.createdBy.prenom}
                      <br />
                      <small style={{ opacity: 0.7 }}>({request.createdBy.poste})</small>
                    </Td>
                    <Td>{formatDate(request.dateDebut)}</Td>
                    <Td>{request.demandeurPoste}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(request.statut)}>
                        {request.statut === 'EN_ATTENTE' ? 'En attente' :
                         request.statut === 'APPROUVÉ' ? 'Approuvé' :
                         request.statut === 'REJETÉ' ? 'Rejeté' : 'Complété'}
                      </Badge>
                    </Td>
                    <Td>
                      {filterStatus === 'EN_ATTENTE' && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => openRequestDetail(request)}
                        >
                          Examiner
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Modal détail */}
      {selectedRequest && (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Demande d'immobilisation - {selectedRequest.vehicleParc}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <strong>Véhicule:</strong> {selectedRequest.vehicleParc}
                </Box>
                <Box>
                  <strong>Type:</strong> {selectedRequest.vehicle?.type}
                </Box>
                <Box>
                  <strong>Modèle:</strong> {selectedRequest.vehicle?.modele}
                </Box>
                <Box>
                  <strong>Demandé par:</strong> {selectedRequest.createdBy.nom} {selectedRequest.createdBy.prenom}
                </Box>
                <Box>
                  <strong>Poste:</strong> {selectedRequest.demandeurPoste}
                </Box>
                <Box>
                  <strong>Motif:</strong> {selectedRequest.motif}
                </Box>
                <Box>
                  <strong>Date de début:</strong> {formatDate(selectedRequest.dateDebut)}
                </Box>
                {selectedRequest.dateFin && (
                  <Box>
                    <strong>Date de fin prévue:</strong> {formatDate(selectedRequest.dateFin)}
                  </Box>
                )}
                <Box>
                  <strong>Description:</strong>
                  <Box
                    p={2}
                    bg="gray.50"
                    borderRadius="md"
                    mt={2}
                    whiteSpace="pre-wrap"
                  >
                    {selectedRequest.description}
                  </Box>
                </Box>

                {/* Formulaire de rejet */}
                {filterStatus === 'EN_ATTENTE' && (
                  <FormControl>
                    <FormLabel>Raison du rejet (si applicable)</FormLabel>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explicitez pourquoi vous rejetez cette demande..."
                      rows={3}
                    />
                  </FormControl>
                )}
              </VStack>
            </ModalBody>

            <ModalFooter>
              <HStack spacing={3}>
                <Button variant="ghost" onClick={onClose}>
                  Fermer
                </Button>
                {filterStatus === 'EN_ATTENTE' && (
                  <>
                    <Button
                      colorScheme="red"
                      onClick={() => handleReject(selectedRequest.id)}
                    >
                      Rejeter
                    </Button>
                    <Button
                      colorScheme="green"
                      onClick={() => handleApprove(selectedRequest.id)}
                    >
                      Approuver
                    </Button>
                  </>
                )}
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </VStack>
  );
};

export default ImmobilisationRequests;
