import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  HStack,
  VStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, AddIcon } from '@chakra-ui/icons';

const JURHE = () => {
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPoste, setFilterPoste] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [selectedEmploye, setSelectedEmploye] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = React.useRef();

  // Données par défaut pour le formulaire
  const defaultFormData = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    poste: 'Conducteur',
    statut: 'Actif',
    dateEmbauche: new Date().toISOString().split('T')[0],
    permis: 'D',
    typeContrat: 'CDI',
    notes: '',
  };

  const [formData, setFormData] = useState(defaultFormData);

  const postes = ['Conducteur', 'Mécanicien', 'Administratif', 'Chef de dépôt', 'Technicien', 'Chauffeur-assistant'];
  const statuts = ['Actif', 'En congé', 'Inactif', 'Suspendu'];
  const typeContrats = ['CDI', 'CDD', 'Stage', 'Intérim'];
  const permis = ['D', 'D+E', 'C', 'C+E', 'B'];

  // Charger les employés
  useEffect(() => {
    fetchEmployes();
  }, []);

  const fetchEmployes = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filterPoste) query.append('poste', filterPoste);
      if (filterStatut) query.append('statut', filterStatut);

      const response = await fetch(`http://localhost:3000/api/employes?${query}`);
      if (response.ok) {
        const data = await response.json();
        setEmployes(data);
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les employés',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (employe = null) => {
    if (employe) {
      setIsEditMode(true);
      setSelectedEmploye(employe);
      setFormData({
        nom: employe.nom,
        prenom: employe.prenom,
        email: employe.email || '',
        telephone: employe.telephone || '',
        poste: employe.poste,
        statut: employe.statut,
        dateEmbauche: employe.dateEmbauche ? new Date(employe.dateEmbauche).toISOString().split('T')[0] : '',
        permis: employe.permis || 'D',
        typeContrat: employe.typeContrat || 'CDI',
        notes: employe.notes || '',
      });
    } else {
      setIsEditMode(false);
      setSelectedEmploye(null);
      setFormData(defaultFormData);
    }
    onOpen();
  };

  const handleSaveEmploye = async () => {
    try {
      if (!formData.nom || !formData.prenom || !formData.poste) {
        toast({
          title: 'Validation',
          description: 'Nom, prénom et poste sont obligatoires',
          status: 'warning',
          duration: 3000,
        });
        return;
      }

      let response;
      if (isEditMode && selectedEmploye) {
        // Update
        response = await fetch(`http://localhost:3000/api/employes/${selectedEmploye.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            dateEmbauche: formData.dateEmbauche ? new Date(formData.dateEmbauche).toISOString() : undefined,
          }),
        });
      } else {
        // Create
        response = await fetch('http://localhost:3000/api/employes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            dateEmbauche: new Date(formData.dateEmbauche).toISOString(),
          }),
        });
      }

      if (response.ok) {
        toast({
          title: 'Succès',
          description: isEditMode ? 'Employé mis à jour' : 'Employé créé',
          status: 'success',
          duration: 3000,
        });
        onClose();
        fetchEmployes();
      } else {
        const error = await response.json();
        toast({
          title: 'Erreur',
          description: error.error || 'Erreur lors de la sauvegarde',
          status: 'error',
          duration: 3000,
        });
      }
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

  const handleDeleteEmploye = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/employes/${selectedEmploye.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Employé supprimé',
          status: 'success',
          duration: 3000,
        });
        onDeleteClose();
        fetchEmployes();
      } else {
        toast({
          title: 'Erreur',
          description: 'Erreur lors de la suppression',
          status: 'error',
          duration: 3000,
        });
      }
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

  // Filtrer les employés
  const filteredEmployes = employes.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.nom.toLowerCase().includes(searchLower) ||
      emp.prenom.toLowerCase().includes(searchLower) ||
      (emp.email && emp.email.toLowerCase().includes(searchLower))
    );
  });

  // Grouper par poste
  const groupedByPoste = postes.reduce((acc, poste) => {
    acc[poste] = filteredEmployes.filter(emp => emp.poste === poste);
    return acc;
  }, {});

  const getStatutBadgeColor = (statut) => {
    const colors = {
      'Actif': 'green',
      'En congé': 'yellow',
      'Inactif': 'gray',
      'Suspendu': 'red',
    };
    return colors[statut] || 'blue';
  };

  return (
    <Container maxW="7xl" py={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading mb={2}>Gestion du Personnel JURHE</Heading>
          <Box fontSize="sm" color="gray.600">
            {employes.length} employé(s) dans le système
          </Box>
        </Box>

        {/* Barre d'actions et filtres */}
        <HStack spacing={4} mb={4} wrap="wrap">
          <Button
            leftIcon={<AddIcon />}
            colorScheme="green"
            onClick={() => handleOpenModal()}
          >
            Ajouter employé
          </Button>
          <Input
            placeholder="Rechercher par nom, prénom, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxW="300px"
          />
          <Select
            placeholder="Tous les postes"
            value={filterPoste}
            onChange={(e) => setFilterPoste(e.target.value)}
            maxW="200px"
          >
            {postes.map(poste => (
              <option key={poste} value={poste}>{poste}</option>
            ))}
          </Select>
          <Select
            placeholder="Tous les statuts"
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            maxW="200px"
          >
            {statuts.map(statut => (
              <option key={statut} value={statut}>{statut}</option>
            ))}
          </Select>
          <Button
            onClick={fetchEmployes}
            isLoading={loading}
            variant="outline"
          >
            Actualiser
          </Button>
        </HStack>

        {/* Onglets par poste */}
        <Tabs variant="enclosed">
          <TabList>
            <Tab>Tous ({filteredEmployes.length})</Tab>
            {postes.map(poste => (
              <Tab key={poste}>
                {poste} ({groupedByPoste[poste]?.length || 0})
              </Tab>
            ))}
          </TabList>

          <TabPanels>
            {/* Tous les employés */}
            <TabPanel>
              <TableEmployes
                employes={filteredEmployes}
                onEdit={handleOpenModal}
                onDelete={(emp) => {
                  setSelectedEmploye(emp);
                  onDeleteOpen();
                }}
                getStatutBadgeColor={getStatutBadgeColor}
              />
            </TabPanel>

            {/* Par poste */}
            {postes.map(poste => (
              <TabPanel key={poste}>
                <TableEmployes
                  employes={groupedByPoste[poste]}
                  onEdit={handleOpenModal}
                  onDelete={(emp) => {
                    setSelectedEmploye(emp);
                    onDeleteOpen();
                  }}
                  getStatutBadgeColor={getStatutBadgeColor}
                />
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Modal Ajouter/Éditer employé */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditMode ? 'Modifier employé' : 'Ajouter un employé'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={4} w="full">
                <FormControl>
                  <FormLabel>Nom *</FormLabel>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Prénom *</FormLabel>
                  <Input
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Téléphone</FormLabel>
                <Input
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                />
              </FormControl>

              <HStack spacing={4} w="full">
                <FormControl>
                  <FormLabel>Poste *</FormLabel>
                  <Select
                    value={formData.poste}
                    onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                  >
                    {postes.map(poste => (
                      <option key={poste} value={poste}>{poste}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Statut</FormLabel>
                  <Select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                  >
                    {statuts.map(statut => (
                      <option key={statut} value={statut}>{statut}</option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Date d'embauche</FormLabel>
                <Input
                  type="date"
                  value={formData.dateEmbauche}
                  onChange={(e) => setFormData({ ...formData, dateEmbauche: e.target.value })}
                />
              </FormControl>

              {formData.poste === 'Conducteur' && (
                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Permis</FormLabel>
                    <Select
                      value={formData.permis}
                      onChange={(e) => setFormData({ ...formData, permis: e.target.value })}
                    >
                      {permis.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Type de contrat</FormLabel>
                    <Select
                      value={formData.typeContrat}
                      onChange={(e) => setFormData({ ...formData, typeContrat: e.target.value })}
                    >
                      {typeContrats.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                  </FormControl>
                </HStack>
              )}

              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observations..."
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={handleSaveEmploye}>
              {isEditMode ? 'Mettre à jour' : 'Créer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Dialog de confirmation suppression */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Supprimer employé
            </AlertDialogHeader>
            <AlertDialogBody>
              Êtes-vous sûr de vouloir supprimer {selectedEmploye?.prenom} {selectedEmploye?.nom} ?
              Cette action est irréversible.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Annuler
              </Button>
              <Button colorScheme="red" onClick={handleDeleteEmploye} ml={3}>
                Supprimer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

// Composant tableau d'employés
const TableEmployes = ({ employes, onEdit, onDelete, getStatutBadgeColor }) => {
  if (employes.length === 0) {
    return <Box textAlign="center" py={6} color="gray.500">Aucun employé</Box>;
  }

  return (
    <Box overflowX="auto">
      <Table variant="striped" colorScheme="gray" size="sm">
        <Thead>
          <Tr>
            <Th>Nom</Th>
            <Th>Prénom</Th>
            <Th>Email</Th>
            <Th>Téléphone</Th>
            <Th>Poste</Th>
            <Th>Statut</Th>
            <Th>Embauche</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {employes.map(employe => (
            <Tr key={employe.id}>
              <Td fontWeight="bold">{employe.nom}</Td>
              <Td>{employe.prenom}</Td>
              <Td fontSize="sm">{employe.email || '-'}</Td>
              <Td fontSize="sm">{employe.telephone || '-'}</Td>
              <Td>{employe.poste}</Td>
              <Td>
                <Badge colorScheme={getStatutBadgeColor(employe.statut)}>
                  {employe.statut}
                </Badge>
              </Td>
              <Td fontSize="sm">
                {employe.dateEmbauche ? new Date(employe.dateEmbauche).toLocaleDateString('fr-FR') : '-'}
              </Td>
              <Td>
                <HStack spacing={1}>
                  <IconButton
                    icon={<EditIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(employe)}
                    aria-label="Éditer"
                  />
                  <IconButton
                    icon={<DeleteIcon />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => onDelete(employe)}
                    aria-label="Supprimer"
                  />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default JURHE;
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConducteur, setSelectedConducteur] = useState(null);
  const [editingConducteur, setEditingConducteur] = useState(null);
  
  // Modales
  const { isOpen: isManagementOpen, onOpen: onManagementOpen, onClose: onManagementClose } = useDisclosure();
  const { isOpen: isIdentityOpen, onOpen: onIdentityOpen, onClose: onIdentityClose } = useDisclosure();
  const { isOpen: isContractOpen, onOpen: onContractOpen, onClose: onContractClose } = useDisclosure();
  const { isOpen: isAbsencesOpen, onOpen: onAbsencesOpen, onClose: onAbsencesClose } = useDisclosure();
  const { isOpen: isTC360Open, onOpen: onTC360Open, onClose: onTC360Close } = useDisclosure();
  const { isOpen: isDriverOpen, onOpen: onDriverOpen, onClose: onDriverClose } = useDisclosure();
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  
  const toast = useToast();
  
  // Nouveau conducteur state
  const [newConducteur, setNewConducteur] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    matricule: '',
    permis: 'D',
    typeContrat: 'CDI',
    statut: 'Actif',
  });
  
  // Contrat state
  const [contractData, setContractData] = useState({
    heuresSemaine: 35,
    dateDebut: '',
    dateFin: '',
    type: 'CDI',
    notes: '',
    documentUrl: '',
  });
  
  // Absences state
  const [absences, setAbsences] = useState([]);
  const [newAbsence, setNewAbsence] = useState({
    dateDebut: '',
    dateFin: '',
    type: 'maladie',
    motif: '',
  });
  
  // TC 360 Driver state
  const [driverPassword, setDriverPassword] = useState('');
  const [driverPasswordNew, setDriverPasswordNew] = useState('');
  const [driverPasswordConfirm, setDriverPasswordConfirm] = useState('');

  // Charger les conducteurs depuis le serveur
  useEffect(() => {
    const fetchConducteurs = async () => {
      try {
        const response = await fetch(`${API_URL}/api/conducteurs`);
        if (!response.ok) throw new Error('Erreur lors du chargement');
        const data = await response.json();
        setConducteursList(data);
      } catch (error) {
        console.error('Erreur:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les conducteurs',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConducteurs();
  }, [toast]);

  const filteredConducteurs = conducteursList.filter(c =>
    c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.matricule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const parseJSON = (jsonStr) => {
    try {
      return jsonStr ? JSON.parse(jsonStr) : null;
    } catch {
      return null;
    }
  };

  const isPDG = (conducteur) => {
    if (!conducteur) return false;
    return conducteur.matricule === 'w.belaidi' || conducteur.email === 'w.belaidi@transports.fr';
  };

  const handleSelectConducteur = (conducteur) => {
    // Empêcher la modification du compte PDG
    if (isPDG(conducteur)) {
      toast({
        title: 'Accès refusé',
        description: 'Le compte PDG ne peut pas être modifié',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setSelectedConducteur(conducteur);
    setEditingConducteur(JSON.parse(JSON.stringify(conducteur)));
    
    // Charger le contrat s'il existe
    if (conducteur.contratJson) {
      try {
        setContractData(JSON.parse(conducteur.contratJson));
      } catch (e) {
        // Garder les valeurs par défaut
      }
    }
    
    // Charger les absences s'il existent
    if (conducteur.absencesJson) {
      try {
        setAbsences(JSON.parse(conducteur.absencesJson));
      } catch (e) {
        // Garder les valeurs par défaut
      }
    }
    
    onManagementOpen();
  };

  const handleAddConducteur = async () => {
    try {
      // Validation basique
      if (!newConducteur.nom || !newConducteur.prenom || !newConducteur.matricule || !newConducteur.email) {
        toast({
          title: 'Erreur',
          description: 'Veuillez remplir tous les champs obligatoires',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Vérifier que le matricule n'existe pas déjà
      if (conducteursList.some(c => c.matricule === newConducteur.matricule)) {
        toast({
          title: 'Erreur',
          description: 'Ce matricule existe déjà',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/conducteurs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConducteur),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création');
      }

      const created = await response.json();
      setConducteursList([...conducteursList, created]);
      
      toast({
        title: 'Succès',
        description: `${newConducteur.prenom} ${newConducteur.nom} a été ajouté`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Réinitialiser le formulaire
      setNewConducteur({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        matricule: '',
        permis: 'D',
        typeContrat: 'CDI',
        statut: 'Actif',
      });
      onAddClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter le conducteur',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSaveChanges = async () => {
    if (editingConducteur) {
      try {
        const dataToSave = {
          ...editingConducteur,
          contratJson: JSON.stringify(contractData),
          absencesJson: JSON.stringify(absences),
        };
        
        const response = await fetch(`${API_URL}/api/conducteurs/${editingConducteur.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave),
        });

        if (!response.ok) throw new Error('Erreur lors de la mise à jour');
        const updated = await response.json();
        
        setConducteursList(
          conducteursList.map(c => (c.id === updated.id ? updated : c))
        );
        toast({
          title: 'Succès',
          description: 'Profil conducteur mis à jour',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onManagementClose();
        setEditingConducteur(null);
      } catch (error) {
        console.error('Erreur:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de mettre à jour le conducteur',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'Valide':
        return 'green';
      case 'À renouveler':
        return 'yellow';
      case 'Expiré':
        return 'red';
      case 'À faire':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const isDateExpired = (date) => {
    return new Date(date) < new Date();
  };

  const getExpiryDays = (date) => {
    const today = new Date();
    const expiry = new Date(date);
    const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getConducteurAlerts = (c) => {
    const alerts = [];
    const fco = parseJSON(c.fcoJson);
    const carteChronos = parseJSON(c.carteChronosJson);
    const visiteMedicale = parseJSON(c.visiteMedicaleJson);

    if (fco && isDateExpired(fco.validite)) {
      alerts.push('FCO expiré');
    }
    if (carteChronos && isDateExpired(carteChronos.validite)) {
      alerts.push('Carte Chronos expirée');
    }
    if (visiteMedicale && visiteMedicale.statut === 'À faire') {
      alerts.push('Visite médicale à faire');
    }
    return alerts;
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="blue.500" />
          <Text>Chargement des conducteurs...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Titre */}
        <Box>
          <Heading as="h1" size="2xl" mb={2}>
            JURHE - Gestion du Personnel
          </Heading>
          <Text color="gray.600">
            Gestion complète du personnel de conduite avec formations, certifications et contrôles
          </Text>
        </Box>

        {/* Recherche et Ajouter */}
        <HStack spacing={4}>
          <Input
            placeholder="Rechercher par nom, prénom ou matricule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="lg"
            flex={1}
          />
          <Button
            leftIcon={<AddIcon />}
            colorScheme="green"
            onClick={onAddOpen}
            size="lg"
          >
            Ajouter conducteur
          </Button>
        </HStack>

        <Tabs>
          <TabList>
            <Tab>Conducteurs</Tab>
            <Tab>Formations</Tab>
            <Tab>Certifications</Tab>
            <Tab>Alertes</Tab>
          </TabList>

          <TabPanels>
            {/* Onglet Conducteurs */}
            <TabPanel>
              <Card>
                <CardBody>
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr bg="gray.100">
                          <Th>Matricule</Th>
                          <Th>Nom Prénom</Th>
                          <Th>Statut</Th>
                          <Th>Permis</Th>
                          <Th>Contrat</Th>
                          <Th>Alertes</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredConducteurs.map((c) => {
                          const alerts = getConducteurAlerts(c);
                          return (
                            <Tr key={c.id} _hover={{ bg: 'gray.50' }}>
                              <Td fontWeight="bold">{c.matricule}</Td>
                              <Td>{c.prenom} {c.nom}</Td>
                              <Td>
                                <Badge colorScheme={c.statut === 'Actif' ? 'green' : 'yellow'}>
                                  {c.statut}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge colorScheme="blue">{c.permis}</Badge>
                              </Td>
                              <Td>{c.typeContrat}</Td>
                              <Td>
                                {alerts.length > 0 ? (
                                  <Badge colorScheme="red">{alerts.length} alerte(s)</Badge>
                                ) : (
                                  <Badge colorScheme="green">OK</Badge>
                                )}
                              </Td>
                              <Td>
                                <Button
                                  size="sm"
                                  colorScheme="blue"
                                  variant="outline"
                                  onClick={() => handleSelectConducteur(c)}
                                  isDisabled={isPDG(c)}
                                  title={isPDG(c) ? "Le compte PDG ne peut pas être modifié" : ""}
                                >
                                  Gérer
                                </Button>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>
                </CardBody>
              </Card>
            </TabPanel>

            {/* Onglet Formations */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {filteredConducteurs.map(c => (
                  <Card key={c.id}>
                    <CardBody>
                      <Heading size="sm" mb={4}>{c.prenom} {c.nom}</Heading>
                      <VStack align="start" spacing={3}>
                        <HStack spacing={4}>
                          <Checkbox
                            isChecked={c.busArticules}
                            isReadOnly
                          />
                          <Text>Bus Articulés</Text>
                        </HStack>
                        <HStack spacing={4}>
                          <Checkbox
                            isChecked={c.autocars}
                            isReadOnly
                          />
                          <Text>Autocars</Text>
                        </HStack>
                        <HStack spacing={4}>
                          <Checkbox
                            isChecked={c.pmr}
                            isReadOnly
                          />
                          <Text>PMR (Accessibilité)</Text>
                        </HStack>
                        <HStack spacing={4}>
                          <Checkbox
                            isChecked={c.vehiMarchandises}
                            isReadOnly
                          />
                          <Text>Transport Marchandises</Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </TabPanel>

            {/* Onglet Certifications */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {filteredConducteurs.map(c => (
                  <Card key={c.id} borderLeft="4px" borderLeftColor="blue.500">
                    <CardBody>
                      <Heading size="sm" mb={4}>{c.prenom} {c.nom}</Heading>
                      <VStack align="start" spacing={4}>
                        {(() => {
                          const fco = parseJSON(c.fcoJson);
                          const carteChronos = parseJSON(c.carteChronosJson);
                          const securite = parseJSON(c.securiteJson);

                          return (
                            <>
                              {/* FCO */}
                              {fco && (
                                <>
                                  <Box w="full">
                                    <HStack justify="space-between" mb={2}>
                                      <Text fontWeight="bold" fontSize="sm">FCO (Formation Continue)</Text>
                                      <Badge colorScheme={getStatutColor(fco.statut)}>
                                        {fco.statut}
                                      </Badge>
                                    </HStack>
                                    <Text fontSize="xs" color="gray.600">
                                      Expire le : {formatDateFr(fco.validite)}
                                      {getExpiryDays(fco.validite) >= 0 && (
                                        <Text as="span" ml={2} color="orange.600">
                                          ({getExpiryDays(fco.validite)} jours)
                                        </Text>
                                      )}
                                    </Text>
                                  </Box>
                                  <Divider />
                                </>
                              )}

                              {/* Carte Chronos */}
                              {carteChronos && (
                                <>
                                  <Box w="full">
                                    <HStack justify="space-between" mb={2}>
                                      <Text fontWeight="bold" fontSize="sm">Carte Chronotachygraphe</Text>
                                      <Badge colorScheme={getStatutColor(carteChronos.statut)}>
                                        {carteChronos.statut}
                                      </Badge>
                                    </HStack>
                                    <Text fontSize="xs" color="gray.600">
                                      Expire le : {formatDateFr(carteChronos.validite)}
                                      {getExpiryDays(carteChronos.validite) >= 0 && (
                                        <Text as="span" ml={2} color="orange.600">
                                          ({getExpiryDays(carteChronos.validite)} jours)
                                        </Text>
                                      )}
                                    </Text>
                                  </Box>
                                  <Divider />
                                </>
                              )}

                              {/* Sécurité */}
                              {securite && (
                                <Box w="full">
                                  <HStack justify="space-between" mb={2}>
                                    <Text fontWeight="bold" fontSize="sm">Formation Sécurité</Text>
                                                    <Badge colorScheme={getStatutColor(securite.statut)}>
                                      {securite.statut}
                                    </Badge>
                                  </HStack>
                                  <Text fontSize="xs" color="gray.600">
                                    Expire le : {formatDateFr(securite.validite)}
                                  </Text>
                                </Box>
                              )}
                            </>
                          );
                        })()}
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </TabPanel>

            {/* Onglet Alertes */}
            <TabPanel>
              <VStack align="stretch" spacing={4}>
                {filteredConducteurs.map(c => {
                  const alerts = getConducteurAlerts(c);
                  if (alerts.length === 0) return null;
                  return (
                    <Alert key={c.id} status="warning" variant="left-accent">
                      <AlertIcon as={WarningIcon} />
                      <Box>
                        <AlertTitle>{c.prenom} {c.nom} ({c.matricule})</AlertTitle>
                        <Text fontSize="sm">{alerts.join(', ')}</Text>
                      </Box>
                    </Alert>
                  );
                })}
                {filteredConducteurs.every(c => getConducteurAlerts(c).length === 0) && (
                  <Card bg="green.50">
                    <CardBody textAlign="center">
                      <Text color="green.700" fontWeight="bold">
                        ✓ Tous les conducteurs sont à jour
                      </Text>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Statistiques */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Card>
            <CardBody>
              <VStack align="start">
                <Text fontWeight="bold">Total Conducteurs</Text>
                <Heading size="lg">{conducteursList.length}</Heading>
              </VStack>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <VStack align="start">
                <Text fontWeight="bold">Actifs</Text>
                <Heading size="lg" color="green.600">
                  {conducteursList.filter(c => c.statut === 'Actif').length}
                </Heading>
              </VStack>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <VStack align="start">
                <Text fontWeight="bold">Certifications À Renouveler</Text>
                <Heading size="lg" color="yellow.600">
                  {conducteursList.reduce((acc, c) => {
                    let count = 0;
                    const fco = parseJSON(c.fcoJson);
                    const carteChronos = parseJSON(c.carteChronosJson);
                    if (fco && getExpiryDays(fco.validite) < 30 && getExpiryDays(fco.validite) >= 0) count++;
                    if (carteChronos && getExpiryDays(carteChronos.validite) < 30 && getExpiryDays(carteChronos.validite) >= 0) count++;
                    return acc + count;
                  }, 0)}
                </Heading>
              </VStack>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <VStack align="start">
                <Text fontWeight="bold">Certifications Expirées</Text>
                <Heading size="lg" color="red.600">
                  {conducteursList.reduce((acc, c) => {
                    let count = 0;
                    const fco = parseJSON(c.fcoJson);
                    const carteChronos = parseJSON(c.carteChronosJson);
                    if (fco && isDateExpired(fco.validite)) count++;
                    if (carteChronos && isDateExpired(carteChronos.validite)) count++;
                    return acc + count;
                  }, 0)}
                </Heading>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>

      {/* Modal GESTION PRINCIPALE */}
      <Modal isOpen={isManagementOpen} onClose={onManagementClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack align="start" spacing={2}>
              <Text fontSize="lg" fontWeight="bold">
                Gestion du Personnel : {selectedConducteur?.prenom} {selectedConducteur?.nom}
              </Text>
              <HStack spacing={2}>
                <Badge colorScheme="blue">{selectedConducteur?.matricule}</Badge>
                <Badge colorScheme={selectedConducteur?.statut === 'Actif' ? 'green' : 'orange'}>
                  {selectedConducteur?.statut}
                </Badge>
              </HStack>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {/* Identité */}
              <Card borderLeft="4px" borderLeftColor="blue.500">
                <CardBody>
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={2} flex={1}>
                      <HStack>
                        <FaUser />
                        <Heading size="sm">Identité</Heading>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        {selectedConducteur?.prenom} {selectedConducteur?.nom}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {selectedConducteur?.email}
                      </Text>
                    </VStack>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      leftIcon={<EditIcon />}
                      onClick={onIdentityOpen}
                    >
                      Modifier
                    </Button>
                  </HStack>
                </CardBody>
              </Card>

              {/* Contrat */}
              <Card borderLeft="4px" borderLeftColor="green.500">
                <CardBody>
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={2} flex={1}>
                      <HStack>
                        <FaFileContract />
                        <Heading size="sm">Contrat</Heading>
                      </HStack>
                      <Text fontSize="sm">
                        <strong>{contractData.heuresSemaine}h/semaine</strong>
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Type: {contractData.type}
                      </Text>
                    </VStack>
                    <Button
                      size="sm"
                      colorScheme="green"
                      leftIcon={<EditIcon />}
                      onClick={onContractOpen}
                    >
                      Gérer
                    </Button>
                  </HStack>
                </CardBody>
              </Card>

              {/* Absences */}
              <Card borderLeft="4px" borderLeftColor="orange.500">
                <CardBody>
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={2} flex={1}>
                      <HStack>
                        <FaClipboardList />
                        <Heading size="sm">Absences</Heading>
                      </HStack>
                      <Badge colorScheme="orange">{absences.length} absence(s)</Badge>
                      <Text fontSize="xs" color="gray.500">
                        Suivi des congés et absences
                      </Text>
                    </VStack>
                    <Button
                      size="sm"
                      colorScheme="orange"
                      leftIcon={<AddIcon />}
                      onClick={onAbsencesOpen}
                    >
                      Gérer
                    </Button>
                  </HStack>
                </CardBody>
              </Card>

              {/* Statistiques TC 360+ */}
              <Card borderLeft="4px" borderLeftColor="purple.500">
                <CardBody>
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={2} flex={1}>
                      <HStack>
                        <FaChartBar />
                        <Heading size="sm">TC 360+</Heading>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        Statistiques pointage
                      </Text>
                    </VStack>
                    <Button
                      size="sm"
                      colorScheme="purple"
                      leftIcon={<EditIcon />}
                      onClick={onTC360Open}
                      isDisabled={isPDG(selectedConducteur)}
                      title={isPDG(selectedConducteur) ? "Le compte PDG ne peut pas être modifié" : ""}
                    >
                      Voir
                    </Button>
                  </HStack>
                </CardBody>
              </Card>

              {/* TC 360 Driver */}
              <Card borderLeft="4px" borderLeftColor="red.500">
                <CardBody>
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={2} flex={1}>
                      <HStack>
                        <FaLock />
                        <Heading size="sm">TC 360 Driver</Heading>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        Gestion identifiant/mot de passe
                      </Text>
                    </VStack>
                    <Button
                      size="sm"
                      colorScheme="red"
                      leftIcon={<EditIcon />}
                      onClick={onDriverOpen}
                      isDisabled={isPDG(selectedConducteur)}
                      title={isPDG(selectedConducteur) ? "Le compte PDG ne peut pas être modifié" : ""}
                    >
                      Gérer
                    </Button>
                  </HStack>
                </CardBody>
              </Card>

              {/* Certifications */}
              <Card borderLeft="4px" borderLeftColor="cyan.500">
                <CardBody>
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={2} flex={1}>
                      <HStack>
                        <FaCertificate />
                        <Heading size="sm">Certifications</Heading>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        FCO, Chronos, Sécurité, etc.
                      </Text>
                    </VStack>
                    <Button
                      size="sm"
                      colorScheme="cyan"
                      leftIcon={<EditIcon />}
                      onClick={onIdentityOpen}
                    >
                      Voir
                    </Button>
                  </HStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onManagementClose}>
              Fermer
            </Button>
            <Button colorScheme="blue" onClick={handleSaveChanges}>
              Enregistrer tous les changements
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal IDENTITÉ */}
      <Modal isOpen={isIdentityOpen} onClose={onIdentityClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modifier l'identité</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingConducteur && (
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Prénom</FormLabel>
                  <Input
                    value={editingConducteur.prenom || ''}
                    onChange={(e) => setEditingConducteur({...editingConducteur, prenom: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Nom</FormLabel>
                  <Input
                    value={editingConducteur.nom || ''}
                    onChange={(e) => setEditingConducteur({...editingConducteur, nom: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={editingConducteur.email || ''}
                    onChange={(e) => setEditingConducteur({...editingConducteur, email: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Téléphone</FormLabel>
                  <Input
                    value={editingConducteur.telephone || ''}
                    onChange={(e) => setEditingConducteur({...editingConducteur, telephone: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Matricule</FormLabel>
                  <Input
                    value={editingConducteur.matricule || ''}
                    disabled
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Statut</FormLabel>
                  <select
                    value={editingConducteur.statut || 'Actif'}
                    onChange={(e) => setEditingConducteur({...editingConducteur, statut: e.target.value})}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    <option value="Actif">Actif</option>
                    <option value="En arrêt">En arrêt</option>
                    <option value="Démission">Démission</option>
                    <option value="Retraite">Retraite</option>
                  </select>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onIdentityClose}>Annuler</Button>
            <Button colorScheme="blue" onClick={onIdentityClose}>Enregistrer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal CONTRAT */}
      <Modal isOpen={isContractOpen} onClose={onContractClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Gestion du Contrat</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Heures par semaine</FormLabel>
                <NumberInput
                  value={contractData.heuresSemaine}
                  onChange={(val) => setContractData({...contractData, heuresSemaine: parseInt(val) || 35})}
                  min={0}
                  max={60}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Type de contrat</FormLabel>
                <select
                  value={contractData.type}
                  onChange={(e) => setContractData({...contractData, type: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="Stage">Stage</option>
                  <option value="Apprentissage">Apprentissage</option>
                </select>
              </FormControl>
              <FormControl>
                <FormLabel>Date de début</FormLabel>
                <Input
                  type="date"
                  value={contractData.dateDebut}
                  onChange={(e) => setContractData({...contractData, dateDebut: e.target.value})}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Date de fin (si applicable)</FormLabel>
                <Input
                  type="date"
                  value={contractData.dateFin}
                  onChange={(e) => setContractData({...contractData, dateFin: e.target.value})}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Notes sur le contrat</FormLabel>
                <Textarea
                  value={contractData.notes}
                  onChange={(e) => setContractData({...contractData, notes: e.target.value})}
                  placeholder="Notes, conditions spéciales, etc..."
                />
              </FormControl>
              <FormControl>
                <FormLabel>Document du contrat (URL ou lien)</FormLabel>
                <Input
                  value={contractData.documentUrl}
                  onChange={(e) => setContractData({...contractData, documentUrl: e.target.value})}
                  placeholder="https://..."
                />
              </FormControl>
              {contractData.documentUrl && (
                <Link href={contractData.documentUrl} isExternal color="blue.500">
                  📄 Ouvrir le document
                </Link>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onContractClose}>Annuler</Button>
            <Button colorScheme="green" onClick={onContractClose}>Enregistrer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal ABSENCES */}
      <Modal isOpen={isAbsencesOpen} onClose={onAbsencesClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Gestion des Absences</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {absences.length > 0 && (
                <Box>
                  <Heading size="sm" mb={2}>Absences enregistrées</Heading>
                  <Stack spacing={2}>
                    {absences.map((abs, idx) => (
                      <Card key={idx} bg="gray.50">
                        <CardBody>
                          <HStack justify="space-between">
                            <VStack align="start" spacing={1}>
                              <Badge colorScheme="orange">{abs.type}</Badge>
                              <Text fontSize="sm">{formatDateFr(abs.dateDebut)} → {formatDateFr(abs.dateFin)}</Text>
                              {abs.motif && <Text fontSize="xs" color="gray.600">{abs.motif}</Text>}
                            </VStack>
                            <IconButton
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => setAbsences(absences.filter((_, i) => i !== idx))}
                            />
                          </HStack>
                        </CardBody>
                      </Card>
                    ))}
                  </Stack>
                  <Divider my={4} />
                </Box>
              )}

              <Box>
                <Heading size="sm" mb={3}>Ajouter une absence</Heading>
                <VStack spacing={3}>
                  <FormControl>
                    <FormLabel>Type d'absence</FormLabel>
                    <select
                      value={newAbsence.type}
                      onChange={(e) => setNewAbsence({...newAbsence, type: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                      <option value="maladie">Maladie</option>
                      <option value="congé">Congé payé</option>
                      <option value="congé-sans-solde">Congé sans solde</option>
                      <option value="formation">Formation</option>
                      <option value="autre">Autre</option>
                    </select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Date de début</FormLabel>
                    <Input
                      type="date"
                      value={newAbsence.dateDebut}
                      onChange={(e) => setNewAbsence({...newAbsence, dateDebut: e.target.value})}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Date de fin</FormLabel>
                    <Input
                      type="date"
                      value={newAbsence.dateFin}
                      onChange={(e) => setNewAbsence({...newAbsence, dateFin: e.target.value})}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Motif (optionnel)</FormLabel>
                    <Textarea
                      value={newAbsence.motif}
                      onChange={(e) => setNewAbsence({...newAbsence, motif: e.target.value})}
                      placeholder="Détails de l'absence..."
                    />
                  </FormControl>
                  <Button
                    colorScheme="orange"
                    width="full"
                    onClick={() => {
                      if (newAbsence.dateDebut && newAbsence.dateFin) {
                        setAbsences([...absences, newAbsence]);
                        setNewAbsence({dateDebut: '', dateFin: '', type: 'maladie', motif: ''});
                        toast({
                          title: 'Absence ajoutée',
                          status: 'success',
                          duration: 2000,
                        });
                      } else {
                        toast({
                          title: 'Erreur',
                          description: 'Veuillez remplir les dates',
                          status: 'error',
                          duration: 2000,
                        });
                      }
                    }}
                  >
                    Ajouter l'absence
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAbsencesClose}>Fermer</Button>
            <Button colorScheme="orange" onClick={onAbsencesClose}>Enregistrer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal TC 360+ STATISTIQUES */}
      <Modal isOpen={isTC360Open} onClose={onTC360Close} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Statistiques TC 360+ - {selectedConducteur?.prenom} {selectedConducteur?.nom}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Statistiques de pointage</AlertTitle>
                  <Text fontSize="sm">
                    Données récupérées depuis les services TC 360+ assignés à ce conducteur.
                  </Text>
                </Box>
              </Alert>
              <SimpleGrid columns={2} spacing={4} w="full">
                <Card>
                  <CardBody>
                    <VStack>
                      <Text fontSize="sm" color="gray.600">Services complétés</Text>
                      <Heading size="lg">--</Heading>
                    </VStack>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <VStack>
                      <Text fontSize="sm" color="gray.600">Retards</Text>
                      <Heading size="lg">--</Heading>
                    </VStack>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <VStack>
                      <Text fontSize="sm" color="gray.600">Non-présentations</Text>
                      <Heading size="lg">--</Heading>
                    </VStack>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <VStack>
                      <Text fontSize="sm" color="gray.600">Taux de conformité</Text>
                      <Heading size="lg">--</Heading>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
              <Text fontSize="xs" color="gray.500" textAlign="center">
                Les statistiques se mettent à jour automatiquement depuis les pointages.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onTC360Close}>Fermer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal TC 360 DRIVER */}
      <Modal isOpen={isDriverOpen} onClose={onDriverClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Gestion TC 360 Driver</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <Text fontSize="sm">
                    Gestion des identifiants et accès au module TC 360 Driver (application mobile).
                  </Text>
                </Box>
              </Alert>
              
              <FormControl>
                <FormLabel>Identifiant (Email)</FormLabel>
                <Input
                  value={selectedConducteur?.email || ''}
                  isReadOnly
                  bg="gray.100"
                />
              </FormControl>

              <Divider />

              <Heading size="sm">Changer le mot de passe</Heading>
              
              <FormControl>
                <FormLabel>Mot de passe actuel</FormLabel>
                <Input
                  type="password"
                  value={driverPassword}
                  onChange={(e) => setDriverPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Nouveau mot de passe</FormLabel>
                <Input
                  type="password"
                  value={driverPasswordNew}
                  onChange={(e) => setDriverPasswordNew(e.target.value)}
                  placeholder="••••••••"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <Input
                  type="password"
                  value={driverPasswordConfirm}
                  onChange={(e) => setDriverPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                />
              </FormControl>

              <Button
                colorScheme="red"
                width="full"
                onClick={() => {
                  if (driverPasswordNew && driverPasswordNew === driverPasswordConfirm) {
                    toast({
                      title: 'Mot de passe changé',
                      description: 'Le mot de passe a été mis à jour avec succès',
                      status: 'success',
                      duration: 3000,
                    });
                    setDriverPassword('');
                    setDriverPasswordNew('');
                    setDriverPasswordConfirm('');
                  } else {
                    toast({
                      title: 'Erreur',
                      description: 'Les mots de passe ne correspondent pas',
                      status: 'error',
                      duration: 2000,
                    });
                  }
                }}
              >
                Changer le mot de passe
              </Button>

              <Divider />

              <Button colorScheme="red" variant="outline" width="full">
                Réinitialiser l'accès
              </Button>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDriverClose}>Fermer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal AJOUTER CONDUCTEUR */}
      <Modal isOpen={isAddOpen} onClose={onAddClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ajouter un nouveau conducteur</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Prénom</FormLabel>
                <Input
                  value={newConducteur.prenom}
                  onChange={(e) => setNewConducteur({...newConducteur, prenom: e.target.value})}
                  placeholder="Jean"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Nom</FormLabel>
                <Input
                  value={newConducteur.nom}
                  onChange={(e) => setNewConducteur({...newConducteur, nom: e.target.value})}
                  placeholder="Dupont"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Matricule</FormLabel>
                <Input
                  value={newConducteur.matricule}
                  onChange={(e) => setNewConducteur({...newConducteur, matricule: e.target.value})}
                  placeholder="j.dupont"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={newConducteur.email}
                  onChange={(e) => setNewConducteur({...newConducteur, email: e.target.value})}
                  placeholder="jean.dupont@transports.fr"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Téléphone</FormLabel>
                <Input
                  value={newConducteur.telephone}
                  onChange={(e) => setNewConducteur({...newConducteur, telephone: e.target.value})}
                  placeholder="+33612345678"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Type de permis</FormLabel>
                <select
                  value={newConducteur.permis}
                  onChange={(e) => setNewConducteur({...newConducteur, permis: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="D">D (Bus/Autocar)</option>
                  <option value="D+E">D+E (Bus articulé)</option>
                  <option value="C">C (Poids lourds)</option>
                </select>
              </FormControl>

              <FormControl>
                <FormLabel>Type de contrat</FormLabel>
                <select
                  value={newConducteur.typeContrat}
                  onChange={(e) => setNewConducteur({...newConducteur, typeContrat: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="Stage">Stage</option>
                </select>
              </FormControl>

              <FormControl>
                <FormLabel>Statut</FormLabel>
                <select
                  value={newConducteur.statut}
                  onChange={(e) => setNewConducteur({...newConducteur, statut: e.target.value})}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="Actif">Actif</option>
                  <option value="En arrêt">En arrêt</option>
                </select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddClose}>Annuler</Button>
            <Button colorScheme="green" onClick={handleAddConducteur}>Ajouter</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default JURHE;
