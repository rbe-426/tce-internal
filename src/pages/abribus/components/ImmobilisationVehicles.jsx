import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
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
  useDisclosure,
  useToast,
  VStack,
  HStack,
  Badge,
  Textarea,
  Spinner,
  Alert,
  AlertIcon,
  Heading,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { API_URL } from '../../../config';
import { UserContext } from '../../../context/UserContext';

const ImmobilisationVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [immobilisations, setImmobilisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useContext(UserContext);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [formData, setFormData] = useState({
    vehicleParc: '',
    dateDebut: '',
    dateFin: '',
    motif: 'Maintenance',
    description: '',
  });

  const motifs = ['Maintenance', 'Réparation', 'Révision', 'Contrôle technique', 'Autre'];

  // Charger les véhicules et immobilisations
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

        // Charger les immobilisations
        const immobilisationsRes = await fetch(`${API_URL}/api/immobilisations?poste=SAEIV`);
        if (immobilisationsRes.ok) {
          const data = await immobilisationsRes.json();
          setImmobilisations(data.immobilisations || []);
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
  }, [toast]);

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
          demandeurPoste: 'SAEIV',
          createdById: user?.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création');
      }

      const created = await response.json();
      
      // Actualiser les immobilisations
      const immobilisationsRes = await fetch(`${API_URL}/api/immobilisations?poste=SAEIV`);
      if (immobilisationsRes.ok) {
        const data = await immobilisationsRes.json();
        setImmobilisations(data.immobilisations || []);
      }

      // Réinitialiser le formulaire
      setFormData({
        vehicleParc: '',
        dateDebut: '',
        dateFin: '',
        motif: 'Maintenance',
        description: '',
      });
      onClose();

      toast({
        title: 'Succès',
        description: `Véhicule ${formData.vehicleParc} immobilisé`,
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

  const handleCompleteImmobilisation = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/immobilisations/${id}/complete`, {
        method: 'PUT',
      });

      if (!response.ok) throw new Error('Erreur lors de la finalisation');

      // Actualiser les immobilisations
      const immobilisationsRes = await fetch(`${API_URL}/api/immobilisations?poste=SAEIV`);
      if (immobilisationsRes.ok) {
        const data = await immobilisationsRes.json();
        setImmobilisations(data.immobilisations || []);
      }

      toast({
        title: 'Succès',
        description: 'Immobilisation complétée',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de finaliser l\'immobilisation',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'APPROUVÉ': return 'green';
      case 'EN_ATTENTE': return 'orange';
      case 'REJETÉ': return 'red';
      case 'COMPLÉTÉ': return 'gray';
      default: return 'blue';
    }
  };

  const getStatusLabel = (statut) => {
    switch (statut) {
      case 'APPROUVÉ': return 'Approuvé';
      case 'EN_ATTENTE': return 'En attente';
      case 'REJETÉ': return 'Rejeté';
      case 'COMPLÉTÉ': return 'Complété';
      default: return statut;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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

  // Actives et en attente
  const activeImmobilisations = immobilisations.filter(i => 
    ['APPROUVÉ', 'EN_ATTENTE'].includes(i.statut)
  );

  // Complétées
  const completedImmobilisations = immobilisations.filter(i => 
    i.statut === 'COMPLÉTÉ'
  );

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading size="md">Immobilisation de véhicules</Heading>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onOpen}>
            Nouvelle demande
          </Button>
        </HStack>

        {/* Demandes actives */}
        <Card mb={6}>
          <CardBody>
            <Heading size="sm" mb={4}>Immobilisations en cours</Heading>
            {activeImmobilisations.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                Aucune immobilisation active
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
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {activeImmobilisations.map(immo => (
                      <Tr key={immo.id}>
                        <Td fontWeight="bold">{immo.vehicleParc}</Td>
                        <Td>{immo.motif}</Td>
                        <Td>{formatDate(immo.dateDebut)}</Td>
                        <Td>{immo.dateFin ? formatDate(immo.dateFin) : '-'}</Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(immo.statut)}>
                            {getStatusLabel(immo.statut)}
                          </Badge>
                        </Td>
                        <Td>
                          {immo.statut === 'APPROUVÉ' && (
                            <Button
                              size="sm"
                              colorScheme="green"
                              onClick={() => handleCompleteImmobilisation(immo.id)}
                            >
                              Finaliser
                            </Button>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>

        {/* Historique complété */}
        {completedImmobilisations.length > 0 && (
          <Card>
            <CardBody>
              <Heading size="sm" mb={4}>Historique complété</Heading>
              <Box overflowX="auto">
                <Table size="sm" variant="striped">
                  <Thead>
                    <Tr>
                      <Th>Véhicule</Th>
                      <Th>Motif</Th>
                      <Th>Date début</Th>
                      <Th>Date fin</Th>
                      <Th>Statut</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {completedImmobilisations.map(immo => (
                      <Tr key={immo.id} opacity={0.7}>
                        <Td>{immo.vehicleParc}</Td>
                        <Td>{immo.motif}</Td>
                        <Td>{formatDate(immo.dateDebut)}</Td>
                        <Td>{immo.dateFin ? formatDate(immo.dateFin) : '-'}</Td>
                        <Td>
                          <Badge colorScheme="gray">Complété</Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
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
                <FormLabel>Date de fin (optionnel)</FormLabel>
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
                  placeholder="Décrivez l'opération à effectuer..."
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
              Demander l'immobilisation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default ImmobilisationVehicles;
