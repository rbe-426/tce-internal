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
  Select,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
  HStack,
  Badge,
  Heading,
  Alert,
  AlertIcon,
  Spinner,
  Input,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { API_URL } from '../../../config';
import { UserContext } from '../../../context/UserContext';

const ImmobilisationByOthers = ({ poste = 'Autre' }) => {
  const [vehicles, setVehicles] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useContext(UserContext);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [formData, setFormData] = useState({
    vehicleParc: '',
    dateDebut: '',
    dateFin: '',
    motif: 'Autre',
    description: '',
  });

  const motifs = ['Maintenance', 'Réparation', 'Révision', 'Contrôle technique', 'Autre'];

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Charger les véhicules
        const vehiclesRes = await fetch(`${API_URL}/api/vehicles`);
        if (vehiclesRes.ok) {
          const vehiclesData = await vehiclesRes.json();
          setVehicles(vehiclesData.vehicles || vehiclesData || []);
        }

        // Charger les demandes de cet utilisateur
        if (user?.id) {
          const requestsRes = await fetch(`${API_URL}/api/immobilisations`);
          if (requestsRes.ok) {
            const data = await requestsRes.json();
            const userRequests = (data.immobilisations || []).filter(
              r => r.createdById === user.id && r.demandeurPoste !== 'SAEIV'
            );
            setMyRequests(userRequests);
          }
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données',
          status: 'error',
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.vehicleParc || !formData.dateDebut || !formData.motif || !formData.description) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_URL}/api/immobilisations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleParc: formData.vehicleParc,
          dateDebut: new Date(formData.dateDebut).toISOString(),
          dateFin: formData.dateFin ? new Date(formData.dateFin).toISOString() : null,
          motif: formData.motif,
          description: formData.description,
          demandeurPoste: poste,
          createdById: user?.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création');
      }

      // Actualiser les demandes
      const requestsRes = await fetch(`${API_URL}/api/immobilisations`);
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        const userRequests = (data.immobilisations || []).filter(
          r => r.createdById === user.id && r.demandeurPoste !== 'SAEIV'
        );
        setMyRequests(userRequests);
      }

      // Réinitialiser
      setFormData({
        vehicleParc: '',
        dateDebut: '',
        dateFin: '',
        motif: 'Autre',
        description: '',
      });
      onClose();

      toast({
        title: 'Succès',
        description: `Demande d'immobilisation pour ${formData.vehicleParc} envoyée au responsable de dépôt`,
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
    } finally {
      setSubmitting(false);
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

  const getStatusLabel = (statut) => {
    switch (statut) {
      case 'EN_ATTENTE': return 'En attente d\'approbation';
      case 'APPROUVÉ': return 'Approuvé';
      case 'REJETÉ': return 'Rejeté';
      case 'COMPLÉTÉ': return 'Complété';
      default: return statut;
    }
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
        <HStack justify="space-between" mb={4}>
          <Heading size="md">Demandes d'immobilisation de véhicules</Heading>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
            Nouvelle demande
          </Button>
        </HStack>

        <Alert status="info" mb={4}>
          <AlertIcon />
          Vos demandes d'immobilisation doivent être approuvées par le responsable de dépôt avant de prendre effet.
        </Alert>

        {myRequests.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            Vous n'avez pas de demandes d'immobilisation
          </Alert>
        ) : (
          <Box overflowX="auto">
            <Table size="sm" variant="striped">
              <Thead>
                <Tr>
                  <Th>Véhicule</Th>
                  <Th>Motif</Th>
                  <Th>Date début</Th>
                  <Th>Date fin</Th>
                  <Th>Statut</Th>
                  <Th>Détails</Th>
                </Tr>
              </Thead>
              <Tbody>
                {myRequests.map(request => (
                  <Tr key={request.id}>
                    <Td fontWeight="bold">{request.vehicleParc}</Td>
                    <Td>{request.motif}</Td>
                    <Td>{formatDate(request.dateDebut)}</Td>
                    <Td>{request.dateFin ? formatDate(request.dateFin) : '-'}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(request.statut)}>
                        {getStatusLabel(request.statut)}
                      </Badge>
                    </Td>
                    <Td>
                      {request.raison_rejet && (
                        <Box fontSize="sm" color="red.500">
                          <strong>Raison du rejet:</strong> {request.raison_rejet}
                        </Box>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Modal de création */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Demander l'immobilisation d'un véhicule</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="warning">
                <AlertIcon />
                Cette demande devra être approuvée par le responsable de dépôt.
              </Alert>

              <FormControl isRequired>
                <FormLabel>Véhicule</FormLabel>
                <Select
                  name="vehicleParc"
                  value={formData.vehicleParc}
                  onChange={handleInputChange}
                  placeholder="Sélectionner un véhicule"
                >
                  {vehicles.map(v => (
                    <option key={v.parc} value={v.parc}>
                      {v.parc} - {v.type} ({v.modele})
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Motif</FormLabel>
                <Select
                  name="motif"
                  value={formData.motif}
                  onChange={handleInputChange}
                >
                  {motifs.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Date de début</FormLabel>
                <Input
                  type="date"
                  name="dateDebut"
                  value={formData.dateDebut}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Date de fin prévue (optionnel)</FormLabel>
                <Input
                  type="date"
                  name="dateFin"
                  value={formData.dateFin}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Décrivez l'opération à effectuer et justifiez votre demande..."
                  rows={4}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={submitting}
            >
              Envoyer la demande
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default ImmobilisationByOthers;
