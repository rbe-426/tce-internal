import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  FormControl,
  FormLabel,
  Select,
  Spinner,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Text,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { FiDownload, FiUpload } from 'react-icons/fi';
import { API_URL } from '../config';

// Formatage des types de dossier
const formatDossierType = (type) => {
  const mapping = {
    'ACHAT_IMPORT': 'Achat pour Import',
    'ACHAT_EXPORT': 'Achat pour Export',
    'LOCATION_LONGUE_DUREE': 'Location Longue Durée',
    'LOCATION_PONCTUELLE': 'Location Ponctuelle'
  };
  return mapping[type] || type;
};

const FRAISE = () => {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [dossiers, setDossiers] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  
  const { isOpen: isClientOpen, onOpen: onClientOpen, onClose: onClientClose } = useDisclosure();
  const { isOpen: isDossierOpen, onOpen: onDossierOpen, onClose: onDossierClose } = useDisclosure();
  const { isOpen: isDemandeOpen, onOpen: onDemandeOpen, onClose: onDemandeClose } = useDisclosure();
  const { isOpen: isVehiculeOpen, onOpen: onVehiculeOpen, onClose: onVehiculeClose } = useDisclosure();
  const { isOpen: isTransactionOpen, onOpen: onTransactionOpen, onClose: onTransactionClose } = useDisclosure();
  
  const toast = useToast();

  const [clientForm, setClientForm] = useState({ nom: '', prenom: '', email: '', telephone: '', typeClient: 'Particulier' });
  const [dossierForm, setDossierForm] = useState({ clientId: '', titre: '', type: 'ACHAT_IMPORT', montantTotal: 0 });
  const [demandeForm, setDemandeForm] = useState({ dossierId: '', titre: '', type: 'Devis', montant: 0 });
  const [vehiculeForm, setVehiculeForm] = useState({ dossierId: '', immatriculation: '', marque: '', modele: '', annee: 0, kilometre: 0, carburant: 'Diesel', boite: 'Automatique', couleur: '', etat: 'Bon' });
  const [transactionForm, setTransactionForm] = useState({ dossierId: '', clientId: '', type: 'Paiement', montant: 0, methode: 'Virement' });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [clientRes, dossierRes, demandeRes, vehiculeRes, transactionRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/fraise/clients`),
        fetch(`${API_URL}/api/fraise/dossiers`),
        fetch(`${API_URL}/api/fraise/demandes`),
        fetch(`${API_URL}/api/fraise/vehicules`),
        fetch(`${API_URL}/api/fraise/transactions`),
        fetch(`${API_URL}/api/fraise/stats`),
      ]);

      if (clientRes.ok) setClients(await clientRes.json());
      if (dossierRes.ok) setDossiers(await dossierRes.json());
      if (demandeRes.ok) setDemandes(await demandeRes.json());
      if (vehiculeRes.ok) setVehicules(await vehiculeRes.json());
      if (transactionRes.ok) setTransactions(await transactionRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    try {
      const res = await fetch(`${API_URL}/api/fraise/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientForm),
      });
      if (res.ok) {
        const newClient = await res.json();
        setClients([...clients, newClient]);
        setClientForm({ nom: '', prenom: '', email: '', telephone: '', typeClient: 'Particulier' });
        onClientClose();
        toast({ title: 'Client ajouté', status: 'success' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, status: 'error' });
    }
  };

  const handleAddDossier = async () => {
    try {
      const res = await fetch(`${API_URL}/api/fraise/dossiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dossierForm),
      });
      if (res.ok) {
        const newDossier = await res.json();
        setDossiers([...dossiers, newDossier]);
        setDossierForm({ clientId: '', titre: '', type: 'ACHAT_IMPORT', montantTotal: 0 });
        onDossierClose();
        toast({ title: 'Dossier créé', status: 'success' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, status: 'error' });
    }
  };

  const handleAddDemande = async () => {
    try {
      const res = await fetch(`${API_URL}/api/fraise/demandes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demandeForm),
      });
      if (res.ok) {
        const newDemande = await res.json();
        setDemandes([...demandes, newDemande]);
        setDemandeForm({ dossierId: '', titre: '', type: 'Devis', montant: 0 });
        onDemandeClose();
        toast({ title: 'Demande créée', status: 'success' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, status: 'error' });
    }
  };

  const handleAddVehicule = async () => {
    // Validation
    if (!vehiculeForm.dossierId) {
      toast({ title: 'Erreur', description: 'Veuillez sélectionner un dossier', status: 'error' });
      return;
    }
    if (!vehiculeForm.immatriculation) {
      toast({ title: 'Erreur', description: 'Veuillez entrer une immatriculation', status: 'error' });
      return;
    }
    if (!vehiculeForm.marque) {
      toast({ title: 'Erreur', description: 'Veuillez entrer une marque', status: 'error' });
      return;
    }
    if (!vehiculeForm.modele) {
      toast({ title: 'Erreur', description: 'Veuillez entrer un modèle', status: 'error' });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/fraise/vehicules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vehiculeForm,
          annee: vehiculeForm.annee || 0,
          kilometre: vehiculeForm.kilometre || 0
        }),
      });
      if (res.ok) {
        const newVehicule = await res.json();
        setVehicules([...vehicules, newVehicule]);
        setVehiculeForm({ dossierId: '', immatriculation: '', marque: '', modele: '', annee: 0, kilometre: 0, carburant: 'Diesel', boite: 'Automatique', couleur: '', etat: 'Bon' });
        onVehiculeClose();
        toast({ title: 'Véhicule ajouté', status: 'success' });
      } else {
        const errorData = await res.json();
        toast({ title: 'Erreur', description: errorData.error || 'Erreur lors de la création', status: 'error' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, status: 'error' });
    }
  };

  const handleAddTransaction = async () => {
    try {
      const res = await fetch(`${API_URL}/api/fraise/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionForm),
      });
      if (res.ok) {
        const newTransaction = await res.json();
        setTransactions([...transactions, newTransaction]);
        setTransactionForm({ dossierId: '', clientId: '', type: 'Paiement', montant: 0, methode: 'Virement' });
        onTransactionClose();
        toast({ title: 'Transaction enregistrée', status: 'success' });
      }
    } catch (err) {
      toast({ title: 'Erreur', description: err.message, status: 'error' });
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="blue.500" />
          <Text>Chargement du portail FRAISE...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" variant="pageTitle">
            Portail FRAISE
          </Heading>
          <Text fontSize="lg" color="gray.600" textAlign="center">
            Gestion d'import/export de véhicules - Clients, Dossiers, Demandes, Véhicules & Finances
          </Text>
        </Box>

        {stats && (
          <SimpleGrid columns={{ base: 2, md: 6 }} spacing={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Clients</StatLabel>
                  <StatNumber>{stats.totalClients}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Dossiers Ouverts</StatLabel>
                  <StatNumber>{stats.dossierOuverts}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Dossiers</StatLabel>
                  <StatNumber>{stats.totalDossiers}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Véhicules</StatLabel>
                  <StatNumber>{stats.totalVehicules}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Montant Total</StatLabel>
                  <StatNumber>{stats.montantTotal.toFixed(2)} €</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>En Attente</StatLabel>
                  <StatNumber>{stats.transactionsEnAttente}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        <Card>
          <CardBody>
            <Tabs index={tab} onChange={setTab}>
              <TabList>
                <Tab>Clients</Tab>
                <Tab>Dossiers</Tab>
                <Tab>Demandes</Tab>
                <Tab>Véhicules</Tab>
                <Tab>Finances</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Gestion des Clients</Heading>
                      <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onClientOpen}>
                        Ajouter Client
                      </Button>
                    </HStack>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Nom</Th>
                          <Th>Email</Th>
                          <Th>Téléphone</Th>
                          <Th>Type</Th>
                          <Th>Dossiers</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {clients.map((client) => (
                          <Tr key={client.id}>
                            <Td fontWeight="bold">{client.prenom} {client.nom}</Td>
                            <Td>{client.email}</Td>
                            <Td>{client.telephone}</Td>
                            <Td><Badge>{client.typeClient}</Badge></Td>
                            <Td>{client._count?.dossiers || 0}</Td>
                            <Td>
                              <HStack spacing={2}>
                                <Button size="sm" colorScheme="blue" variant="outline" leftIcon={<EditIcon />}>
                                  Modifier
                                </Button>
                                <Button size="sm" colorScheme="red" variant="outline" leftIcon={<DeleteIcon />}>
                                  Supprimer
                                </Button>
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </VStack>
                </TabPanel>

                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Gestion des Dossiers</Heading>
                      <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onDossierOpen}>
                        Créer Dossier
                      </Button>
                    </HStack>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Numéro</Th>
                          <Th>Client</Th>
                          <Th>Titre</Th>
                          <Th>Type</Th>
                          <Th>Statut</Th>
                          <Th>Montant</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {dossiers.map((dossier) => (
                          <Tr key={dossier.id}>
                            <Td fontWeight="bold">{dossier.numero}</Td>
                            <Td>{dossier.client?.prenom} {dossier.client?.nom}</Td>
                            <Td>{dossier.titre}</Td>
                            <Td><Badge colorScheme="purple">{formatDossierType(dossier.type)}</Badge></Td>
                            <Td>
                              <Badge colorScheme={dossier.statut === 'Ouvert' ? 'green' : 'gray'}>
                                {dossier.statut}
                              </Badge>
                            </Td>
                            <Td>{dossier.montantTotal?.toFixed(2)} €</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </VStack>
                </TabPanel>

                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Gestion des Demandes</Heading>
                      <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onDemandeOpen}>
                        Créer Demande
                      </Button>
                    </HStack>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Référence</Th>
                          <Th>Type</Th>
                          <Th>Montant</Th>
                          <Th>Statut</Th>
                          <Th>Client</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {demandes.map((demande) => (
                          <Tr key={demande.id}>
                            <Td fontWeight="bold">{demande.reference}</Td>
                            <Td><Badge>{demande.type}</Badge></Td>
                            <Td>{demande.montant.toFixed(2)} €</Td>
                            <Td>
                              <Badge colorScheme={demande.statut === 'Accepté' ? 'green' : 'yellow'}>
                                {demande.statut}
                              </Badge>
                            </Td>
                            <Td>{demande.dossier?.client?.prenom} {demande.dossier?.client?.nom}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </VStack>
                </TabPanel>

                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Gestion des Véhicules</Heading>
                      <HStack>
                        <Button leftIcon={<FiUpload />} colorScheme="green" variant="outline">
                          Importer
                        </Button>
                        <Button leftIcon={<FiDownload />} colorScheme="green" variant="outline">
                          Exporter
                        </Button>
                        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onVehiculeOpen}>
                          Ajouter Véhicule
                        </Button>
                      </HStack>
                    </HStack>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Immatriculation</Th>
                          <Th>Marque/Modèle</Th>
                          <Th>Année</Th>
                          <Th>Kilométrage</Th>
                          <Th>État</Th>
                          <Th>Statut</Th>
                          <Th>Prix Vente</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {vehicules.map((vehicule) => (
                          <Tr key={vehicule.id}>
                            <Td fontWeight="bold">{vehicule.immatriculation}</Td>
                            <Td>{vehicule.marque} {vehicule.modele}</Td>
                            <Td>{vehicule.annee}</Td>
                            <Td>{vehicule.kilometre} km</Td>
                            <Td><Badge>{vehicule.etat}</Badge></Td>
                            <Td>
                              <Badge colorScheme={vehicule.statut === 'Vendu' ? 'green' : 'orange'}>
                                {vehicule.statut}
                              </Badge>
                            </Td>
                            <Td>{vehicule.prixVente?.toFixed(2)} €</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </VStack>
                </TabPanel>

                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Heading size="md">Gestion Financière</Heading>
                      <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onTransactionOpen}>
                        Enregistrer Transaction
                      </Button>
                    </HStack>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Date</Th>
                          <Th>Type</Th>
                          <Th>Client</Th>
                          <Th>Dossier</Th>
                          <Th>Montant</Th>
                          <Th>Méthode</Th>
                          <Th>Statut</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {transactions.map((trans) => (
                          <Tr key={trans.id}>
                            <Td>{new Date(trans.createdAt).toLocaleDateString('fr-FR')}</Td>
                            <Td><Badge>{trans.type}</Badge></Td>
                            <Td>{trans.client?.prenom} {trans.client?.nom}</Td>
                            <Td>{trans.dossier?.numero}</Td>
                            <Td fontWeight="bold">{trans.montant.toFixed(2)} €</Td>
                            <Td>{trans.methode}</Td>
                            <Td>
                              <Badge colorScheme={trans.statut === 'Effectué' ? 'green' : 'yellow'}>
                                {trans.statut}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>

      <Modal isOpen={isClientOpen} onClose={onClientClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ajouter un Client</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Nom</FormLabel>
                <Input value={clientForm.nom} onChange={(e) => setClientForm({ ...clientForm, nom: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Prénom</FormLabel>
                <Input value={clientForm.prenom} onChange={(e) => setClientForm({ ...clientForm, prenom: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Téléphone</FormLabel>
                <Input value={clientForm.telephone} onChange={(e) => setClientForm({ ...clientForm, telephone: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Type Client</FormLabel>
                <Select value={clientForm.typeClient} onChange={(e) => setClientForm({ ...clientForm, typeClient: e.target.value })}>
                  <option>Particulier</option>
                  <option>Entreprise</option>
                  <option>Concessionnaire</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClientClose}>Annuler</Button>
            <Button colorScheme="blue" onClick={handleAddClient}>Ajouter</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDossierOpen} onClose={onDossierClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Créer un Dossier</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Client</FormLabel>
                <Select value={dossierForm.clientId} onChange={(e) => setDossierForm({ ...dossierForm, clientId: e.target.value })}>
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Titre</FormLabel>
                <Input value={dossierForm.titre} onChange={(e) => setDossierForm({ ...dossierForm, titre: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Type</FormLabel>
                <Select value={dossierForm.type} onChange={(e) => setDossierForm({ ...dossierForm, type: e.target.value })}>
                  <option value="ACHAT_IMPORT">Achat pour Import</option>
                  <option value="ACHAT_EXPORT">Achat pour Export</option>
                  <option value="LOCATION_LONGUE_DUREE">Location Longue Durée / Exploitation</option>
                  <option value="LOCATION_PONCTUELLE">Location Ponctuelle</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Montant Total</FormLabel>
                <Input type="number" value={dossierForm.montantTotal} onChange={(e) => setDossierForm({ ...dossierForm, montantTotal: parseFloat(e.target.value) })} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDossierClose}>Annuler</Button>
            <Button colorScheme="blue" onClick={handleAddDossier}>Créer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isDemandeOpen} onClose={onDemandeClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Créer une Demande</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Dossier</FormLabel>
                <Select value={demandeForm.dossierId} onChange={(e) => setDemandeForm({ ...demandeForm, dossierId: e.target.value })}>
                  <option value="">Sélectionner un dossier</option>
                  {dossiers.map((d) => (
                    <option key={d.id} value={d.id}>{d.numero} - {d.titre}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Titre</FormLabel>
                <Input value={demandeForm.titre} onChange={(e) => setDemandeForm({ ...demandeForm, titre: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Type</FormLabel>
                <Select value={demandeForm.type} onChange={(e) => setDemandeForm({ ...demandeForm, type: e.target.value })}>
                  <option>Devis</option>
                  <option>Facture</option>
                  <option>Bon de commande</option>
                  <option>Bordereau</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Montant</FormLabel>
                <Input type="number" value={demandeForm.montant} onChange={(e) => setDemandeForm({ ...demandeForm, montant: parseFloat(e.target.value) })} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDemandeClose}>Annuler</Button>
            <Button colorScheme="blue" onClick={handleAddDemande}>Créer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isVehiculeOpen} onClose={onVehiculeClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ajouter un Véhicule</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Dossier</FormLabel>
                <Select value={vehiculeForm.dossierId} onChange={(e) => setVehiculeForm({ ...vehiculeForm, dossierId: e.target.value })}>
                  <option value="">Sélectionner un dossier</option>
                  {dossiers.map((d) => (
                    <option key={d.id} value={d.id}>{d.numero}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Immatriculation</FormLabel>
                <Input value={vehiculeForm.immatriculation} onChange={(e) => setVehiculeForm({ ...vehiculeForm, immatriculation: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Marque</FormLabel>
                <Input value={vehiculeForm.marque} onChange={(e) => setVehiculeForm({ ...vehiculeForm, marque: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Modèle</FormLabel>
                <Input value={vehiculeForm.modele} onChange={(e) => setVehiculeForm({ ...vehiculeForm, modele: e.target.value })} />
              </FormControl>
              <FormControl>
                <FormLabel>Année</FormLabel>
                <Input type="number" value={vehiculeForm.annee || ''} onChange={(e) => setVehiculeForm({ ...vehiculeForm, annee: e.target.value ? parseInt(e.target.value) : 0 })} />
              </FormControl>
              <FormControl>
                <FormLabel>Kilométrage</FormLabel>
                <Input type="number" value={vehiculeForm.kilometre || ''} onChange={(e) => setVehiculeForm({ ...vehiculeForm, kilometre: e.target.value ? parseInt(e.target.value) : 0 })} />
              </FormControl>
              <FormControl>
                <FormLabel>Carburant</FormLabel>
                <Select value={vehiculeForm.carburant} onChange={(e) => setVehiculeForm({ ...vehiculeForm, carburant: e.target.value })}>
                  <option value="Essence">Essence</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybride">Hybride</option>
                  <option value="Électrique">Électrique</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Boîte de vitesses</FormLabel>
                <Select value={vehiculeForm.boite} onChange={(e) => setVehiculeForm({ ...vehiculeForm, boite: e.target.value })}>
                  <option value="Manuelle">Manuelle</option>
                  <option value="Automatique">Automatique</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Couleur</FormLabel>
                <Input value={vehiculeForm.couleur} onChange={(e) => setVehiculeForm({ ...vehiculeForm, couleur: e.target.value })} placeholder="Ex: Blanc, Noir..." />
              </FormControl>
              <FormControl>
                <FormLabel>État</FormLabel>
                <Select value={vehiculeForm.etat} onChange={(e) => setVehiculeForm({ ...vehiculeForm, etat: e.target.value })}>
                  <option value="Excellent">Excellent</option>
                  <option value="Bon">Bon</option>
                  <option value="Passable">Passable</option>
                  <option value="Mauvais">Mauvais</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onVehiculeClose}>Annuler</Button>
            <Button colorScheme="blue" onClick={handleAddVehicule}>Ajouter</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isTransactionOpen} onClose={onTransactionClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enregistrer une Transaction</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Dossier</FormLabel>
                <Select value={transactionForm.dossierId} onChange={(e) => setTransactionForm({ ...transactionForm, dossierId: e.target.value })}>
                  <option value="">Sélectionner un dossier</option>
                  {dossiers.map((d) => (
                    <option key={d.id} value={d.id}>{d.numero}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Client</FormLabel>
                <Select value={transactionForm.clientId} onChange={(e) => setTransactionForm({ ...transactionForm, clientId: e.target.value })}>
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Type</FormLabel>
                <Select value={transactionForm.type} onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}>
                  <option>Paiement</option>
                  <option>Remboursement</option>
                  <option>Frais</option>
                  <option>Commission</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Montant</FormLabel>
                <Input type="number" value={transactionForm.montant} onChange={(e) => setTransactionForm({ ...transactionForm, montant: parseFloat(e.target.value) })} />
              </FormControl>
              <FormControl>
                <FormLabel>Méthode</FormLabel>
                <Select value={transactionForm.methode} onChange={(e) => setTransactionForm({ ...transactionForm, methode: e.target.value })}>
                  <option>Virement</option>
                  <option>Carte</option>
                  <option>Chèque</option>
                  <option>Espèces</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onTransactionClose}>Annuler</Button>
            <Button colorScheme="blue" onClick={handleAddTransaction}>Enregistrer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default FRAISE;
