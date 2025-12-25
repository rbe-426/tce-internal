import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Select,
  Input,
  Checkbox,
  Textarea,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { API_URL } from '../../config';

export default function VehicleNeeds({ depotId }) {
  const [loading, setLoading] = useState(true);
  const [needs, setNeeds] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [formData, setFormData] = useState({
    vehicleTypeId: '',
    quantityNeeded: 1,
    isUrgent: false,
    reason: ''
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, [depotId]);

  async function loadData() {
    try {
      setLoading(true);

      // Charger les besoins
      const needsRes = await fetch(`${API_URL}/api/depots/${depotId}/vehicle-needs`);
      if (needsRes.ok) {
        const data = await needsRes.json();
        setNeeds(data.needs || []);
      }

      // Charger les types de véhicules
      const typesRes = await fetch(`${API_URL}/api/vehicle-types`);
      if (typesRes.ok) {
        const data = await typesRes.json();
        setVehicleTypes(data.vehicleTypes || []);
      }

      // Charger les suggestions de mercatos
      const sugRes = await fetch(`${API_URL}/api/vehicle-needs/mercato-suggestions?depotId=${depotId}`);
      if (sugRes.ok) {
        const data = await sugRes.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  }

  async function setNeed() {
    if (!formData.vehicleTypeId || !formData.quantityNeeded) {
      toast({
        title: 'Données manquantes',
        description: 'Veuillez remplir les champs requis',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/depots/${depotId}/vehicle-needs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast({
          title: 'Succès',
          description: 'Besoin créé/mis à jour',
          status: 'success',
          duration: 3000
        });
        setFormData({
          vehicleTypeId: '',
          quantityNeeded: 1,
          isUrgent: false,
          reason: ''
        });
        onClose();
        loadData();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    }
  }

  async function deleteNeed(needId) {
    if (!window.confirm('Supprimer ce besoin?')) return;

    try {
      const res = await fetch(`${API_URL}/api/vehicle-needs/${needId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast({
          title: 'Succès',
          description: 'Besoin supprimé',
          status: 'success',
          duration: 3000
        });
        loadData();
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    }
  }

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>
        Besoins en Véhicules
      </Heading>

      <Tabs>
        <TabList mb="1em">
          <Tab>Besoins</Tab>
          <Tab>Suggestions de Mercatos</Tab>
          <Tab>Vue Critique</Tab>
        </TabList>

        <TabPanels>
          {/* Besoins */}
          <TabPanel>
            <VStack align="stretch" spacing={4}>
              <Button colorScheme="blue" onClick={onOpen} width="fit-content">
                + Nouveau Besoin
              </Button>

              {needs.length > 0 ? (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Type de Véhicule</Th>
                      <Th>Nécessaire</Th>
                      <Th>Disponible</Th>
                      <Th>Total</Th>
                      <Th>Manque</Th>
                      <Th>Urgent</Th>
                      <Th>Statut</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {needs.map((need) => (
                      <Tr key={need.id}>
                        <Td fontWeight="bold">{need.vehicleType}</Td>
                        <Td>{need.quantityNeeded}</Td>
                        <Td>{need.quantityAvailable}</Td>
                        <Td>{need.quantityTotal}</Td>
                        <Td>
                          <Badge
                            colorScheme={
                              need.shortfall > 0
                                ? 'red'
                                : 'green'
                            }
                          >
                            {need.shortfall}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={need.isUrgent ? 'orange' : 'gray'}>
                            {need.isUrgent ? 'OUI' : 'NON'}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme="blue">{need.statut}</Badge>
                        </Td>
                        <Td>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => deleteNeed(need.id)}
                          >
                            Supprimer
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Alert status="info">
                  <AlertIcon />
                  Aucun besoin enregistré
                </Alert>
              )}
            </VStack>
          </TabPanel>

          {/* Suggestions */}
          <TabPanel>
            <VStack align="stretch" spacing={4}>
              {suggestions.length > 0 ? (
                suggestions.map((sugg, idx) => (
                  <Box key={idx} p={4} border="1px" borderColor="gray.200" rounded="md">
                    <Heading size="sm" mb={3}>
                      {sugg.need.vehicleType}
                    </Heading>
                    <HStack spacing={4} mb={3}>
                      <Box>
                        Besoin: <Badge>{sugg.need.quantityNeeded}</Badge>
                      </Box>
                      <Box>
                        Disponible: <Badge colorScheme="green">{sugg.need.quantityAvailable}</Badge>
                      </Box>
                      <Box>
                        Manque: <Badge colorScheme="red">{sugg.need.shortfall}</Badge>
                      </Box>
                    </HStack>

                    <Box mb={3}>
                      <Heading size="xs" mb={2}>
                        Mercatos Possibles:
                      </Heading>
                      {sugg.potentialMercatos.map((mercato) => (
                        <Box key={mercato.vehicleId} p={2} bg="gray.50" mb={2} rounded="md">
                          <HStack justify="space-between">
                            <VStack align="start" spacing={0}>
                              <Box fontSize="sm" fontWeight="bold">
                                Véhicule: {mercato.vehicleNumber}
                              </Box>
                              <Box fontSize="xs" color="gray.600">
                                De: {mercato.sourceDepot}
                              </Box>
                            </VStack>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              onClick={() => {
                                toast({
                                  title: 'Info',
                                  description: `Mercato pour ${mercato.vehicleNumber} vers ce dépôt`,
                                  status: 'info'
                                });
                              }}
                            >
                              Proposer Mercato
                            </Button>
                          </HStack>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))
              ) : (
                <Alert status="success">
                  <AlertIcon />
                  Tous les besoins sont couverts!
                </Alert>
              )}
            </VStack>
          </TabPanel>

          {/* Vue Critique */}
          <TabPanel>
            <VStack align="stretch" spacing={4}>
              {needs.filter((n) => n.shortfall > 0 || n.isUrgent).length > 0 ? (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Type</Th>
                      <Th>Manque</Th>
                      <Th>Urgent</Th>
                      <Th>Raison</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {needs
                      .filter((n) => n.shortfall > 0 || n.isUrgent)
                      .map((need) => (
                        <Tr
                          key={need.id}
                          bg={need.isUrgent ? 'red.50' : 'yellow.50'}
                        >
                          <Td fontWeight="bold">{need.vehicleType}</Td>
                          <Td>
                            <Badge colorScheme="red">
                              -{need.shortfall}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme={need.isUrgent ? 'red' : 'gray'}>
                              {need.isUrgent ? 'URGENT' : ''}
                            </Badge>
                          </Td>
                          <Td fontSize="sm">{need.reason || '-'}</Td>
                        </Tr>
                      ))}
                  </Tbody>
                </Table>
              ) : (
                <Alert status="success">
                  <AlertIcon />
                  Aucun besoin critique
                </Alert>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Créer un Besoin en Véhicules</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Type de Véhicule</FormLabel>
                <Select
                  placeholder="Sélectionner"
                  value={formData.vehicleTypeId}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleTypeId: e.target.value })
                  }
                >
                  {vehicleTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.nom}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Quantité Nécessaire</FormLabel>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantityNeeded}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantityNeeded: parseInt(e.target.value)
                    })
                  }
                />
              </FormControl>

              <FormControl>
                <Checkbox
                  isChecked={formData.isUrgent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isUrgent: e.target.checked
                    })
                  }
                >
                  Urgent
                </Checkbox>
              </FormControl>

              <FormControl>
                <FormLabel>Raison</FormLabel>
                <Textarea
                  placeholder="Raison du besoin"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reason: e.target.value
                    })
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={setNeed}>
              Créer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
