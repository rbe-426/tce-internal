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
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import { API_URL } from '../../config';

export default function InterDepotAuthorization() {
  const [loading, setLoading] = useState(true);
  const [lignes, setLignes] = useState([]);
  const [depots, setDepots] = useState([]);
  const [authorizations, setAuthorizations] = useState([]);
  const [selectedLigne, setSelectedLigne] = useState('');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Form state
  const [formData, setFormData] = useState({
    ligneId: '',
    depotSourceId: '',
    depotExploitantId: '',
    canTakeOver: true,
    maxCourses: null,
    periodicite: 'PERMANENT',
    dateFin: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lignesRes, depotsRes] = await Promise.all([
        fetch(`${API_URL}/api/lignes`),
        fetch(`${API_URL}/api/etablissements`)
      ]);

      const lignesData = await lignesRes.json();
      const depotsData = await depotsRes.json();

      setLignes(lignesData);
      setDepots(depotsData.filter(d => d.type === 'Dépôt'));
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAuth = async (e) => {
    e.preventDefault();

    if (!formData.ligneId || !formData.depotSourceId || !formData.depotExploitantId) {
      toast({
        title: 'Erreur',
        description: 'Tous les champs requis doivent être remplis',
        status: 'error',
        duration: 3000
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/lignes/${formData.ligneId}/inter-depot-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Erreur création autorisation');

      const newAuth = await response.json();
      setAuthorizations([...authorizations, newAuth]);
      setFormData({
        ligneId: '',
        depotSourceId: '',
        depotExploitantId: '',
        canTakeOver: true,
        maxCourses: null,
        periodicite: 'PERMANENT',
        dateFin: ''
      });
      onClose();

      toast({
        title: 'Succès',
        description: 'Autorisation créée',
        status: 'success',
        duration: 3000
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    }
  };

  const handleDeleteAuth = async (authId) => {
    if (!window.confirm('Êtes-vous sûr?')) return;

    try {
      const auth = authorizations.find(a => a.id === authId);
      await fetch(`${API_URL}/api/lignes/${auth.ligneId}/inter-depot-auth/${authId}`, {
        method: 'DELETE'
      });

      setAuthorizations(authorizations.filter(a => a.id !== authId));
      toast({
        title: 'Succès',
        description: 'Autorisation supprimée',
        status: 'success',
        duration: 3000
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    }
  };

  const getDepotName = (depotId) => {
    return depots.find(d => d.id === depotId)?.nom || depotId;
  };

  const getLigneName = (ligneId) => {
    return lignes.find(l => l.id === ligneId)?.numero || ligneId;
  };

  if (loading) return <Spinner />;

  return (
    <Box p={6}>
      <Heading mb={6}>Autorisations Inter-Dépôts</Heading>

      <Button colorScheme="blue" mb={6} onClick={onOpen}>
        + Créer une autorisation
      </Button>

      <Tabs>
        <TabList>
          <Tab>Lignes que nous exploitons</Tab>
          <Tab>Lignes que nous pouvons reprendre</Tab>
          <Tab>Tous les transferts</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <VStack align="stretch" spacing={4}>
              <Heading size="md">Lignes propriétaires</Heading>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Ligne</Th>
                    <Th>Dépôt autorisé</Th>
                    <Th>Statut</Th>
                    <Th>Max courses/jour</Th>
                    <Th>Périodicité</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {authorizations
                    .filter(a => a.statut === 'ACTIVE')
                    .map(auth => (
                      <Tr key={auth.id}>
                        <Td>{getLigneName(auth.ligneId)}</Td>
                        <Td>{getDepotName(auth.depotExploitantId)}</Td>
                        <Td><Badge colorScheme="green">{auth.statut}</Badge></Td>
                        <Td>{auth.maxCourses || 'Illimité'}</Td>
                        <Td>{auth.periodicite}</Td>
                        <Td>
                          <Button size="sm" colorScheme="red" onClick={() => handleDeleteAuth(auth.id)}>
                            Révoquer
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                </Tbody>
              </Table>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack align="stretch" spacing={4}>
              <Heading size="md">Lignes que nous pouvons reprendre</Heading>
              <Alert status="info">
                <AlertIcon />
                Les lignes où vous êtes autorisés à reprendre des courses d'un autre dépôt
              </Alert>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Ligne</Th>
                    <Th>Dépôt propriétaire</Th>
                    <Th>Max courses/jour</Th>
                    <Th>Valide jusqu'au</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {authorizations
                    .filter(a => a.statut === 'ACTIVE' && a.canTakeOver)
                    .map(auth => (
                      <Tr key={auth.id}>
                        <Td>{getLigneName(auth.ligneId)}</Td>
                        <Td>{getDepotName(auth.depotSourceId)}</Td>
                        <Td>{auth.maxCourses || 'Illimité'}</Td>
                        <Td>{auth.dateFin ? new Date(auth.dateFin).toLocaleDateString() : 'Permanent'}</Td>
                      </Tr>
                    ))}
                </Tbody>
              </Table>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack align="stretch" spacing={4}>
              <Heading size="md">Tous les transferts de services</Heading>
              {/* À implémenter: affichage des transferts réalisés */}
              <Alert status="info">
                <AlertIcon />
                L'historique des services transférés inter-dépôts
              </Alert>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Modal de création */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Créer une autorisation inter-dépôt</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Ligne</FormLabel>
                <Select
                  value={formData.ligneId}
                  onChange={(e) => setFormData({ ...formData, ligneId: e.target.value })}
                >
                  <option value="">Sélectionner une ligne</option>
                  {lignes.map(l => (
                    <option key={l.id} value={l.id}>{l.numero} - {l.nom}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Dépôt propriétaire</FormLabel>
                <Select
                  value={formData.depotSourceId}
                  onChange={(e) => setFormData({ ...formData, depotSourceId: e.target.value })}
                >
                  <option value="">Sélectionner</option>
                  {depots.map(d => (
                    <option key={d.id} value={d.id}>{d.nom}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Dépôt autorisé</FormLabel>
                <Select
                  value={formData.depotExploitantId}
                  onChange={(e) => setFormData({ ...formData, depotExploitantId: e.target.value })}
                >
                  <option value="">Sélectionner</option>
                  {depots.map(d => (
                    <option key={d.id} value={d.id}>{d.nom}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <Checkbox
                  isChecked={formData.canTakeOver}
                  onChange={(e) => setFormData({ ...formData, canTakeOver: e.target.checked })}
                >
                  Autoriser la reprise de courses
                </Checkbox>
              </FormControl>

              <FormControl>
                <FormLabel>Max courses/jour</FormLabel>
                <Input
                  type="number"
                  value={formData.maxCourses || ''}
                  onChange={(e) => setFormData({ ...formData, maxCourses: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Laisser vide pour illimité"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Périodicité</FormLabel>
                <Select
                  value={formData.periodicite}
                  onChange={(e) => setFormData({ ...formData, periodicite: e.target.value })}
                >
                  <option value="PERMANENT">Permanent</option>
                  <option value="SAISONNIER">Saisonnier</option>
                  <option value="TEMPORAIRE">Temporaire</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Date de fin (optionnel)</FormLabel>
                <Input
                  type="date"
                  value={formData.dateFin}
                  onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={handleCreateAuth}>
              Créer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
