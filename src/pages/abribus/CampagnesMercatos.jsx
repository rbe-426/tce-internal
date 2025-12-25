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
          <Tab fontWeight="bold">� Propositions de Mercatos</Tab>
          {isManager && <Tab fontWeight="bold">📋 Gérer les Propositions</Tab>}
        </TabList>

        <TabPanels>
          {/* TAB 1: Propositions */}
          <TabPanel>
            <PropositionsTab
              mercatos={mercatos}
              vehicles={vehicles}
              lignes={lignes}
              personnel={personnel}
              depots={depots}
              onPropose={onOpen}
              onUpdateStatus={updateMercatoStatus}
            />
          </TabPanel>

          {/* TAB 2: Gérer les Propositions (Manager only) */}
          {isManager && (
            <TabPanel>
              <GererPropositionsTab
                mercatos={mercatos}
                vehicles={vehicles}
                depots={depots}
                onUpdateStatus={updateMercatoStatus}
              />
            </TabPanel>
          )}
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

function PropositionsTab({ mercatos, vehicles, lignes, personnel, depots, onPropose, onUpdateStatus }) {
  return (
    <VStack align="stretch" spacing={6}>
      {/* Sous-onglets pour les propositions */}
      <Tabs variant="soft-rounded" colorScheme="blue">
        <TabList>
          <Tab>🚌 Véhicules</Tab>
          <Tab>🛣️ Lignes/Services</Tab>
          <Tab>👥 Personnel</Tab>
          <Tab>📊 Situation Actuelle</Tab>
        </TabList>

        <TabPanels>
          {/* Propositions Véhicules */}
          <TabPanel>
            <PropositionsVehiculesTab
              mercatos={mercatos}
              vehicles={vehicles}
              depots={depots}
              onPropose={onPropose}
              onUpdateStatus={onUpdateStatus}
            />
          </TabPanel>

          {/* Propositions Lignes */}
          <TabPanel>
            <PropositionsLignesTab mercatos={mercatos} lignes={lignes} depots={depots} />
          </TabPanel>

          {/* Propositions Personnel */}
          <TabPanel>
            <PropositionsPersonnelTab mercatos={mercatos} personnel={personnel} depots={depots} />
          </TabPanel>

          {/* Situation Actuelle */}
          <TabPanel>
            <SituationActuelleTab depots={depots} vehicles={vehicles} lignes={lignes} personnel={personnel} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}

function GererPropositionsTab({ mercatos, vehicles, depots, onUpdateStatus }) {
  return (
    <VStack align="stretch" spacing={6}>
      <Alert status="warning" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Gestion des propositions de mercatos</Text>
          <Text fontSize="sm">Vous avez accès à l'approbation et au rejet des mercatos proposés</Text>
        </Box>
      </Alert>

      {/* Sous-onglets pour la gestion */}
      <Tabs variant="soft-rounded" colorScheme="green">
        <TabList>
          <Tab>⏳ En Attente</Tab>
          <Tab>✅ Approuvés</Tab>
          <Tab>✕ Rejetés</Tab>
          <Tab>📈 Simulation</Tab>
        </TabList>

        <TabPanels>
          {/* En Attente */}
          <TabPanel>
            <GestionEnAttenteTab mercatos={mercatos} vehicles={vehicles} depots={depots} onUpdateStatus={onUpdateStatus} />
          </TabPanel>

          {/* Approuvés */}
          <TabPanel>
            <GestionApprouveTab mercatos={mercatos} vehicles={vehicles} depots={depots} onUpdateStatus={onUpdateStatus} />
          </TabPanel>

          {/* Rejetés */}
          <TabPanel>
            <GestionRejeteTab mercatos={mercatos} vehicles={vehicles} depots={depots} />
          </TabPanel>

          {/* Simulation */}
          <TabPanel>
            <SimulationProbabilitesTab mercatos={mercatos} vehicles={vehicles} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}

function PropositionsVehiculesTab({ mercatos, vehicles, depots, onPropose, onUpdateStatus }) {
  const vehiculeMercatos = mercatos.filter((m) => m.type === 'VEHICULE' || !m.type);
  const myPropositions = vehiculeMercatos.filter((m) => m.statut === 'EN_ATTENTE');

  return (
    <VStack align="stretch" spacing={4}>
      <Button colorScheme="blue" onClick={onPropose} width="fit-content">
        + Proposer un Mercato Véhicule
      </Button>

      <Box>
        <Heading size="sm" mb={3}>Mes propositions en attente</Heading>
        {myPropositions.length > 0 ? (
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Véhicule</Th>
                <Th>De</Th>
                <Th>Vers</Th>
                <Th>Raison</Th>
                <Th>Statut</Th>
              </Tr>
            </Thead>
            <Tbody>
              {myPropositions.map((m) => (
                <Tr key={m.id}>
                  <Td fontWeight="bold">{m.vehicleNumber || 'N/A'}</Td>
                  <Td>{m.depotSourceName}</Td>
                  <Td>{m.depotDestinationName}</Td>
                  <Td>{m.raison || '-'}</Td>
                  <Td>
                    <Badge colorScheme="yellow">EN ATTENTE</Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Alert status="info">
            <AlertIcon />
            Aucune proposition en attente
          </Alert>
        )}
      </Box>

      <Divider />

      <Box>
        <Heading size="sm" mb={3}>Tous les mercatos véhicules</Heading>
        {vehiculeMercatos.length > 0 ? (
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Véhicule</Th>
                <Th>De</Th>
                <Th>Vers</Th>
                <Th>Statut</Th>
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
      </Box>
    </VStack>
  );
}

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

function GestionEnAttenteTab({ mercatos, vehicles, depots, onUpdateStatus }) {
  const enAttenteList = mercatos.filter((m) => m.statut === 'EN_ATTENTE');

  return (
    <VStack align="stretch" spacing={4}>
      <Alert status="warning">
        <AlertIcon />
        {enAttenteList.length} mercato(s) en attente de votre décision
      </Alert>

      {enAttenteList.length > 0 ? (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Véhicule</Th>
              <Th>De</Th>
              <Th>Vers</Th>
              <Th>Raison</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {enAttenteList.map((m) => (
              <Tr key={m.id}>
                <Td fontWeight="bold">{m.vehicleNumber || 'N/A'}</Td>
                <Td>{m.depotSourceName}</Td>
                <Td>{m.depotDestinationName}</Td>
                <Td>{m.raison || '-'}</Td>
                <Td>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={() => onUpdateStatus(m.id, 'approve')}
                    >
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => onUpdateStatus(m.id, 'reject')}
                    >
                      Refuser
                    </Button>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Alert status="success">
          <AlertIcon />
          Aucun mercato en attente
        </Alert>
      )}
    </VStack>
  );
}

function GestionApprouveTab({ mercatos, vehicles, depots, onUpdateStatus }) {
  const approuveList = mercatos.filter((m) => m.statut === 'APPROUVÉ');

  return (
    <VStack align="stretch" spacing={4}>
      <Alert status="success">
        <AlertIcon />
        {approuveList.length} mercato(s) approuvé(s)
      </Alert>

      {approuveList.length > 0 ? (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Véhicule</Th>
              <Th>De</Th>
              <Th>Vers</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {approuveList.map((m) => (
              <Tr key={m.id}>
                <Td fontWeight="bold">{m.vehicleNumber || 'N/A'}</Td>
                <Td>{m.depotSourceName}</Td>
                <Td>{m.depotDestinationName}</Td>
                <Td>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => onUpdateStatus(m.id, 'complete')}
                  >
                    Marquer Transporté
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Alert status="info">
          <AlertIcon />
          Aucun mercato approuvé
        </Alert>
      )}
    </VStack>
  );
}

function GestionRejeteTab({ mercatos, vehicles, depots }) {
  const rejeteList = mercatos.filter((m) => m.statut === 'REJETÉ');

  return (
    <VStack align="stretch" spacing={4}>
      <Alert status="error">
        <AlertIcon />
        {rejeteList.length} mercato(s) rejeté(s)
      </Alert>

      {rejeteList.length > 0 ? (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Véhicule</Th>
              <Th>De</Th>
              <Th>Vers</Th>
              <Th>Raison du rejet</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rejeteList.map((m) => (
              <Tr key={m.id}>
                <Td fontWeight="bold">{m.vehicleNumber || 'N/A'}</Td>
                <Td>{m.depotSourceName}</Td>
                <Td>{m.depotDestinationName}</Td>
                <Td>{m.rejectionReason || '-'}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Alert status="info">
          <AlertIcon />
          Aucun mercato rejeté
        </Alert>
      )}
    </VStack>
  );
}

function SimulationProbabilitesTab({ mercatos, vehicles }) {
  const totalMercatos = mercatos.length;
  const enAttente = mercatos.filter((m) => m.statut === 'EN_ATTENTE').length;
  const approuves = mercatos.filter((m) => m.statut === 'APPROUVÉ').length;
  const rejetes = mercatos.filter((m) => m.statut === 'REJETÉ').length;
  const tauxAcceptation = totalMercatos > 0 ? ((approuves / totalMercatos) * 100).toFixed(1) : 0;

  return (
    <VStack align="stretch" spacing={6}>
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Taux d'Acceptation</StatLabel>
              <StatNumber>{tauxAcceptation}%</StatNumber>
            </Stat>
            <Progress value={tauxAcceptation} mt={4} colorScheme="green" />
          </CardBody>
        </Card>

        <Card bg="yellow.50">
          <CardBody>
            <Stat>
              <StatLabel>En Attente</StatLabel>
              <StatNumber color="yellow.600">{enAttente}</StatNumber>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="green.50">
          <CardBody>
            <Stat>
              <StatLabel>Approuvés</StatLabel>
              <StatNumber color="green.600">{approuves}</StatNumber>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="red.50">
          <CardBody>
            <Stat>
              <StatLabel>Rejetés</StatLabel>
              <StatNumber color="red.600">{rejetes}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Divider />

      <Box>
        <Heading size="md" mb={4}>
          Analyse des Propositions
        </Heading>
        <Text fontSize="sm" color="gray.600" mb={4}>
          Basée sur {totalMercatos} mercato(s) proposé(s)
        </Text>
        <VStack align="start" spacing={2}>
          <Text>📊 Taux d'acceptation estimé: <strong>{tauxAcceptation}%</strong></Text>
          <Text>⏳ Mercatos en attente de décision: <strong>{enAttente}</strong></Text>
          <Text>✅ Mercatos susceptibles d'être approuvés: <strong>{approuves + enAttente}</strong></Text>
        </VStack>
      </Box>
    </VStack>
  );
}

