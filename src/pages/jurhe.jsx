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
import { API_URL } from '../config';

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

      const response = await fetch(`${API_URL}/api/employes?${query}`);
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
        response = await fetch(`${API_URL}/api/employes/${selectedEmploye.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            dateEmbauche: formData.dateEmbauche ? new Date(formData.dateEmbauche).toISOString() : undefined,
          }),
        });
      } else {
        // Create
        response = await fetch(`${API_URL}/api/employes`, {
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
      const response = await fetch(`${API_URL}/api/employes/${selectedEmploye.id}`, {
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
