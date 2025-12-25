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
  Textarea,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  Progress,
  Divider,
  Text
} from '@chakra-ui/react';
import { API_URL } from '../../config';

const STATUT_COLORS = {
  EN_ATTENTE: 'yellow',
  APPROUVÉ: 'blue',
  TRANSPORTÉ: 'green',
  REJETÉ: 'red'
};

export default function CampagnesMercatos() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [userRole, setUserRole] = useState(null);
  
  // Data
  const [mercatos, setMercatos] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [depots, setDepots] = useState([]);
  
  // Form
  const [formData, setFormData] = useState({
    vehicleId: '',
    depotDestinationId: '',
    raison: ''
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    loadData();
    loadUserRole();
  }, []);

  async function loadUserRole() {
    try {
      const response = await fetch(`${API_URL}/api/user`, {
        credentials: 'include'
      });
      if (response.ok) {
        const user = await response.json();
        setUserRole(user.role);
      }
    } catch (error) {
      console.log('Could not load user role');
    }
  }

  const isManager = ['DIRECTEUR_EXPLOITATION', 'RESPONSABLE_EXPLOITATION', 'DG_ENTREPRISE'].includes(userRole);

  async function loadData() {
    try {
      setLoading(true);

      // Mercatos
      const mercRes = await fetch(`${API_URL}/api/mercatos`);
      if (mercRes.ok) {
        setMercatos(await mercRes.json());
      }

      // Véhicules
      const vehRes = await fetch(`${API_URL}/api/vehicles`);
      if (vehRes.ok) {
        setVehicles(await vehRes.json());
      }

      // Lignes
      const ligRes = await fetch(`${API_URL}/api/lignes`);
      if (ligRes.ok) {
        setLignes(await ligRes.json());
      }

      // Personnel
      const persRes = await fetch(`${API_URL}/api/employes`);
      if (persRes.ok) {
        setPersonnel(await persRes.json());
      }

      // Dépôts
      const depRes = await fetch(`${API_URL}/api/etablissements`);
      if (depRes.ok) {
        setDepots(await depRes.json());
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

  async function proposeMercato() {
    if (!formData.vehicleId || !formData.depotDestinationId) {
      toast({
        title: 'Données manquantes',
        description: 'Veuillez sélectionner un véhicule et un dépôt destination',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/mercatos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: formData.vehicleId,
          depotSourceId: depots[0]?.id,
          depotDestinationId: formData.depotDestinationId,
          raison: formData.raison
        })
      });

      if (res.ok) {
        toast({
          title: 'Succès',
          description: 'Mercato proposé',
          status: 'success',
          duration: 3000
        });
        setFormData({ vehicleId: '', depotDestinationId: '', raison: '' });
        onClose();
        loadData();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la création');
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

  async function updateMercatoStatus(mercatoId, action, rejectionReason = '') {
    try {
      const endpoint =
        action === 'approve'
          ? `/api/mercatos/${mercatoId}/approve`
          : action === 'reject'
            ? `/api/mercatos/${mercatoId}/reject`
            : `/api/mercatos/${mercatoId}/complete`;

      const body = action === 'reject' ? { raison: rejectionReason } : {};

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast({
          title: 'Succès',
          description: `Mercato ${action}`,
          status: 'success',
          duration: 3000
        });
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

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={6} p={6}>
      <Box>
        <Heading size="xl" mb={2}>
          🗺️ Campagnes de Mercatos
        </Heading>
        <Text color="gray.600" mb={6}>
          Gestion complète des mercatos véhicules, lignes, et personnel
        </Text>
      </Box>

      <Tabs 
        isFitted 
        variant="enclosed" 
        colorScheme="blue"
        index={activeTab}
        onChange={setActiveTab}
      >
        <TabList mb="1em" borderBottomWidth="2px">
          <Tab fontWeight="bold">📊 Situation Actuelle</Tab>
          <Tab fontWeight="bold">🚌 Mercatos Véhicules</Tab>
          <Tab fontWeight="bold">🛣️ Mercatos Lignes/Services</Tab>
          <Tab fontWeight="bold">👥 Mercatos Personnel</Tab>
          <Tab fontWeight="bold">📈 Simulation Probabilités</Tab>
        </TabList>

        <TabPanels>
          {/* TAB 1: Situation Actuelle */}
          <TabPanel>
            <SituationActuelleTab depots={depots} vehicles={vehicles} lignes={lignes} personnel={personnel} />
          </TabPanel>

          {/* TAB 2: Mercatos Véhicules */}
          <TabPanel>
            <MercatosVehiculesTab
              mercatos={mercatos}
              vehicles={vehicles}
              depots={depots}
              onPropose={onOpen}
              onUpdateStatus={updateMercatoStatus}
            />
          </TabPanel>

          {/* TAB 3: Mercatos Lignes */}
          <TabPanel>
            <MercatosLignesTab mercatos={mercatos} lignes={lignes} depots={depots} />
          </TabPanel>

          {/* TAB 4: Mercatos Personnel */}
          <TabPanel>
            <MercatosPersonnelTab mercatos={mercatos} personnel={personnel} depots={depots} />
          </TabPanel>

          {/* TAB 5: Simulation */}
          <TabPanel>
            <SimulationProbabilitesTab mercatos={mercatos} vehicles={vehicles} personnel={personnel} />
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal Proposer Mercato */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Proposer un Mercato Véhicule</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Véhicule</FormLabel>
                <Select
                  placeholder="Sélectionner un véhicule"
                  value={formData.vehicleId}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleId: e.target.value })
                  }
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.numero} - {v.type}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Dépôt Destination</FormLabel>
                <Select
                  placeholder="Sélectionner un dépôt"
                  value={formData.depotDestinationId}
                  onChange={(e) =>
                    setFormData({ ...formData, depotDestinationId: e.target.value })
                  }
                >
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nom}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Raison</FormLabel>
                <Textarea
                  placeholder="Raison du mercato"
                  value={formData.raison}
                  onChange={(e) =>
                    setFormData({ ...formData, raison: e.target.value })
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={proposeMercato}>
              Proposer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

// ==================== COMPOSANTS ONGLETS ====================

function SituationActuelleTab({ depots, vehicles, lignes, personnel }) {
  return (
    <VStack align="stretch" spacing={6}>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <StatCard title="Véhicules Totaux" value={vehicles.length} color="blue" />
        <StatCard title="Lignes Actives" value={lignes.length} color="green" />
        <StatCard title="Personnel" value={personnel.length} color="purple" />
        <StatCard title="Dépôts" value={depots.length} color="orange" />
      </SimpleGrid>

      {depots.map((depot) => {
        const depotVehicles = vehicles.filter((v) => v.etablissementId === depot.id);
        const depotPersonnel = personnel.filter((p) => p.etablissementId === depot.id);
        
        return (
          <Card key={depot.id}>
            <CardHeader bg="blue.50" fontWeight="bold">
              {depot.nom}
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Stat>
                  <StatLabel>Véhicules</StatLabel>
                  <StatNumber>{depotVehicles.length}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Personnel</StatLabel>
                  <StatNumber>{depotPersonnel.length}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Adresse</StatLabel>
                  <StatNumber fontSize="sm">{depot.adresse || '-'}</StatNumber>
                </Stat>
              </SimpleGrid>
            </CardBody>
          </Card>
        );
      })}
    </VStack>
  );
}

function StatCard({ title, value, color }) {
  return (
    <Card>
      <CardBody>
        <Stat>
          <StatLabel color="gray.600">{title}</StatLabel>
          <StatNumber fontSize="2xl" color={`${color}.600`}>
            {value}
          </StatNumber>
        </Stat>
      </CardBody>
    </Card>
  );
}

function MercatosVehiculesTab({ mercatos, vehicles, depots, onPropose, onUpdateStatus }) {
  const vehiculeMercatos = mercatos.filter((m) => m.type === 'VEHICULE' || !m.type);

  return (
    <VStack align="stretch" spacing={4}>
      <Button colorScheme="blue" onClick={onPropose} width="fit-content">
        + Proposer un Mercato Véhicule
      </Button>

      {vehiculeMercatos.length > 0 ? (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Véhicule</Th>
              <Th>De</Th>
              <Th>Vers</Th>
              <Th>Statut</Th>
              <Th>Raison</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {vehiculeMercatos.map((m) => (
              <Tr key={m.id}>
                <Td fontWeight="bold">{m.vehicleNumber || 'N/A'}</Td>
                <Td>{m.depotSourceName}</Td>
                <Td>{m.depotDestinationName}</Td>
                <Td>
                  <Badge colorScheme={STATUT_COLORS[m.statut]}>
                    {m.statut}
                  </Badge>
                </Td>
                <Td>{m.raison || '-'}</Td>
                <Td>
                  <HStack spacing={1}>
                    {m.statut === 'EN_ATTENTE' && (
                      <>
                        <Button
                          size="xs"
                          colorScheme="green"
                          onClick={() => onUpdateStatus(m.id, 'approve')}
                        >
                          ✓
                        </Button>
                        <Button
                          size="xs"
                          colorScheme="red"
                          onClick={() => onUpdateStatus(m.id, 'reject')}
                        >
                          ✕
                        </Button>
                      </>
                    )}
                    {m.statut === 'APPROUVÉ' && (
                      <Button
                        size="xs"
                        colorScheme="blue"
                        onClick={() => onUpdateStatus(m.id, 'complete')}
                      >
                        Transport
                      </Button>
                    )}
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Alert status="info">
          <AlertIcon />
          Aucun mercato véhicule
        </Alert>
      )}
    </VStack>
  );
}

function MercatosLignesTab({ mercatos, lignes, depots }) {
  return (
    <VStack align="stretch" spacing={4}>
      <Alert status="info">
        <AlertIcon />
        Gestion des mercatos de lignes et services (à configurer)
      </Alert>
      <Text fontSize="sm" color="gray.600">
        Mercatos disponibles: {mercatos.filter((m) => m.type === 'LIGNE').length}
      </Text>
    </VStack>
  );
}

function MercatosPersonnelTab({ mercatos, personnel, depots }) {
  return (
    <VStack align="stretch" spacing={4}>
      <Alert status="info">
        <AlertIcon />
        Gestion des mercatos de personnel (à configurer)
      </Alert>
      <Text fontSize="sm" color="gray.600">
        Personnel disponible: {personnel.length}
      </Text>
    </VStack>
  );
}

function SimulationProbabilitesTab({ mercatos, vehicles, personnel }) {
  const totalMercatos = mercatos.length;
  const acceptedMercatos = mercatos.filter((m) => m.statut === 'APPROUVÉ').length;
  const tauxAcceptation = totalMercatos > 0 ? ((acceptedMercatos / totalMercatos) * 100).toFixed(1) : 0;

  return (
    <VStack align="stretch" spacing={6}>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Taux d'Acceptation</StatLabel>
              <StatNumber>{tauxAcceptation}%</StatNumber>
            </Stat>
            <Progress value={tauxAcceptation} mt={4} colorScheme="green" />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Mercatos en Attente</StatLabel>
              <StatNumber>{mercatos.filter((m) => m.statut === 'EN_ATTENTE').length}</StatNumber>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Mercatos Rejetés</StatLabel>
              <StatNumber>{mercatos.filter((m) => m.statut === 'REJETÉ').length}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Divider />

      <Box>
        <Heading size="md" mb={4}>
          Prédictions
        </Heading>
        <Text fontSize="sm" color="gray.600">
          Basées sur les données actuelles de {totalMercatos} mercatos proposés
        </Text>
      </Box>
    </VStack>
  );
}
