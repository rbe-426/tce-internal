import React, { useState, useEffect, useContext } from 'react';
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
import { UserContext } from '../../context/UserContext';

const STATUT_COLORS = {
  EN_ATTENTE: 'yellow',
  APPROUVÉ: 'blue',
  TRANSPORTÉ: 'green',
  REJETÉ: 'red'
};

export default function CampagnesMercatos() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useContext(UserContext);
  const userRole = user?.role || null;
  
  // Data
  const [mercatos, setMercatos] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [depots, setDepots] = useState([]);
  
  // Form
  const [formData, setFormData] = useState({
    type: 'VEHICULE',
    vehicleId: '',
    ligneId: '',
    agentId: '',
    depotSourceId: '',
    depotDestinationId: '',
    description: ''
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, []);

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
    // Validation basée sur le type
    if (formData.type === 'VEHICULE' && (!formData.vehicleId || !formData.depotDestinationId)) {
      toast({
        title: 'Données manquantes',
        description: 'Veuillez sélectionner un véhicule et un dépôt destination',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    if (formData.type === 'LIGNE' && (!formData.ligneId || !formData.depotDestinationId)) {
      toast({
        title: 'Données manquantes',
        description: 'Veuillez sélectionner une ligne et un dépôt destination',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    if (formData.type === 'PERSONNEL' && (!formData.agentId || !formData.depotDestinationId)) {
      toast({
        title: 'Données manquantes',
        description: 'Veuillez sélectionner un agent et un dépôt destination',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    try {
      const body = {
        type: formData.type,
        depotDestinationId: formData.depotDestinationId,
        description: formData.description,
        dateProposee: new Date().toISOString()
      };

      if (formData.type === 'VEHICULE') {
        body.vehicleId = formData.vehicleId;
        body.depotSourceId = depots[0]?.id;
      } else if (formData.type === 'LIGNE') {
        body.ligneId = formData.ligneId;
      } else if (formData.type === 'PERSONNEL') {
        body.agentId = formData.agentId;
      }

      const res = await fetch(`${API_URL}/api/mercatos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast({
          title: 'Succès',
          description: `Mercato ${formData.type === 'VEHICULE' ? 'véhicule' : formData.type === 'LIGNE' ? 'ligne' : 'personnel'} proposé`,
          status: 'success',
          duration: 3000
        });
        setFormData({
          type: 'VEHICULE',
          vehicleId: '',
          ligneId: '',
          agentId: '',
          depotSourceId: '',
          depotDestinationId: '',
          description: ''
        });
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
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Proposer un Mercato</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {/* Type de Mercato */}
              <FormControl isRequired>
                <FormLabel>Type de Mercato</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      type: e.target.value,
                      vehicleId: '',
                      ligneId: '',
                      agentId: '',
                      depotSourceId: '',
                      depotDestinationId: '',
                      description: ''
                    })
                  }
                >
                  <option value="VEHICULE">🚌 Véhicule</option>
                  <option value="LIGNE">🛣️ Ligne/Service</option>
                  <option value="PERSONNEL">👥 Personnel</option>
                </Select>
              </FormControl>

              {/* Champs dynamiques selon le type */}
              {formData.type === 'VEHICULE' && (
                <>
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
                </>
              )}

              {formData.type === 'LIGNE' && (
                <>
                  <FormControl isRequired>
                    <FormLabel>Ligne/Service</FormLabel>
                    <Select
                      placeholder="Sélectionner une ligne"
                      value={formData.ligneId}
                      onChange={(e) =>
                        setFormData({ ...formData, ligneId: e.target.value })
                      }
                    >
                      {lignes.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.numero} - {l.nom}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}

              {formData.type === 'PERSONNEL' && (
                <>
                  <FormControl isRequired>
                    <FormLabel>Agent</FormLabel>
                    <Select
                      placeholder="Sélectionner un agent"
                      value={formData.agentId}
                      onChange={(e) =>
                        setFormData({ ...formData, agentId: e.target.value })
                      }
                    >
                      {personnel.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom} {p.prenom} - {p.poste}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}

              {/* Dépôt Destination (commun à tous) */}
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

              {/* Description/Raison */}
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  placeholder="Décrivez la raison et les détails du mercato"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
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
            <PropositionsLignesTab mercatos={mercatos} lignes={lignes} depots={depots} onPropose={onPropose} />
          </TabPanel>

          {/* Propositions Personnel */}
          <TabPanel>
            <PropositionsPersonnelTab mercatos={mercatos} personnel={personnel} depots={depots} onPropose={onPropose} />
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

function PropositionsLignesTab({ mercatos, lignes, depots, onPropose }) {
  const lignesMercatos = mercatos.filter((m) => m.type === 'LIGNE');

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Box>
          <Heading size="md" mb={4}>
            🛣️ Propositions de Mercatos pour Lignes/Services
          </Heading>
          <Text color="gray.600" fontSize="sm" mb={4}>
            Proposez des modifications sur les lignes ou services de transport
          </Text>
        </Box>
        <Button colorScheme="blue" onClick={onPropose}>
          + Proposer
        </Button>
      </HStack>

      <Alert status="info">
        <AlertIcon />
        {lignesMercatos.length} proposition(s) pour les lignes en cours
      </Alert>

      {lignesMercatos.length > 0 ? (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Ligne</Th>
              <Th>Type de modification</Th>
              <Th>Statut</Th>
              <Th>Date</Th>
            </Tr>
          </Thead>
          <Tbody>
            {lignesMercatos.map((mercato) => (
              <Tr key={mercato.id}>
                <Td fontWeight="bold">{mercato.ligneId || 'N/A'}</Td>
                <Td>{mercato.description || 'Modification'}</Td>
                <Td>
                  <Badge colorScheme={mercato.statut === 'APPROUVÉ' ? 'green' : 'yellow'}>
                    {mercato.statut || 'PROPOSÉ'}
                  </Badge>
                </Td>
                <Td fontSize="sm" color="gray.500">{new Date(mercato.dateProposition).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Alert status="info">
          <AlertIcon />
          Aucune proposition pour les lignes actuellement
        </Alert>
      )}
    </VStack>
  );
}

function PropositionsPersonnelTab({ mercatos, personnel, depots, onPropose }) {
  const personnelMercatos = mercatos.filter((m) => m.type === 'PERSONNEL');

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Box>
          <Heading size="md" mb={4}>
            👥 Propositions de Mercatos pour Personnel
          </Heading>
          <Text color="gray.600" fontSize="sm" mb={4}>
            Proposez des réaffectations ou modifications de personnel
          </Text>
        </Box>
        <Button colorScheme="blue" onClick={onPropose}>
          + Proposer
        </Button>
      </HStack>

      <Alert status="info">
        <AlertIcon />
        {personnelMercatos.length} proposition(s) pour le personnel en cours
      </Alert>

      {personnelMercatos.length > 0 ? (
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Agent</Th>
              <Th>Type de changement</Th>
              <Th>Dépôt cible</Th>
              <Th>Statut</Th>
            </Tr>
          </Thead>
          <Tbody>
            {personnelMercatos.map((mercato) => {
              const depot = depots.find((d) => d.id === mercato.depotId);
              return (
                <Tr key={mercato.id}>
                  <Td fontWeight="bold">{mercato.agentId || 'Agent N/A'}</Td>
                  <Td>{mercato.description || 'Réaffectation'}</Td>
                  <Td>{depot?.nom || 'Dépôt inconnu'}</Td>
                  <Td>
                    <Badge colorScheme={mercato.statut === 'APPROUVÉ' ? 'green' : 'yellow'}>
                      {mercato.statut || 'PROPOSÉ'}
                    </Badge>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      ) : (
        <Alert status="info">
          <AlertIcon />
          Aucune proposition pour le personnel actuellement
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

