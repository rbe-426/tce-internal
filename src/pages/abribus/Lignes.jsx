import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Container,
  VStack,
  HStack,
  Button,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardBody,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  FormControl,
  FormLabel,
  Checkbox,
  Stack,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { API_URL } from '../../config';

const typesAutobus = ['Standard', 'Articulés', 'Midibus', 'minibus', 'Standard BHNS', 'Articulés BHNS'];

const Lignes = () => {
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newLigne, setNewLigne] = useState({ numero: '', nom: '', typesVehicules: [] });
  const [editingLigne, setEditingLigne] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const toast = useToast();

  // Charger les lignes depuis le serveur
  useEffect(() => {
    const fetchLignes = async () => {
      try {
        const response = await fetch(`${API_URL}/api/lignes`);
        if (!response.ok) throw new Error('Erreur lors du chargement');
        const data = await response.json();
        setLignes(data);
      } catch (error) {
        console.error('Erreur:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les lignes',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLignes();
  }, [toast]);

  const handleImportSuccess = async () => {
    // Recharger les lignes après import
    try {
      const response = await fetch(`${API_URL}/api/lignes`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setLignes(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };  const parseJSON = (jsonStr) => {
    try {
      return jsonStr ? JSON.parse(jsonStr) : [];
    } catch {
      return [];
    }
  };

  const filteredLignes = lignes.filter(ligne =>
    ligne.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ligne.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddLigne = async () => {
    if (!newLigne.numero || !newLigne.nom || newLigne.typesVehicules.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis et sélectionner au moins un type de véhicule',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/lignes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: newLigne.numero,
          nom: newLigne.nom,
          typesVehicules: newLigne.typesVehicules,
          statut: 'Actif',
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la création');
      const created = await response.json();

      setLignes([...lignes, created]);
      setNewLigne({ numero: '', nom: '', typesVehicules: [] });
      onClose();

      toast({
        title: 'Succès',
        description: `Ligne ${created.numero} ajoutée`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter la ligne',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteLigne = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/lignes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      setLignes(lignes.filter(ligne => ligne.id !== id));
      toast({
        title: 'Succès',
        description: 'Ligne supprimée',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la ligne',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditClick = (ligne) => {
    setEditingLigne({
      id: ligne.id,
      numero: ligne.numero,
      nom: ligne.nom,
      typesVehicules: parseJSON(ligne.typesVehicules),
      statut: ligne.statut,
    });
    onEditOpen();
  };

  const handleUpdateLigne = async () => {
    if (!editingLigne.numero || !editingLigne.nom || editingLigne.typesVehicules.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis et sélectionner au moins un type de véhicule',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/lignes/${editingLigne.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: editingLigne.numero,
          nom: editingLigne.nom,
          typesVehicules: editingLigne.typesVehicules,
          statut: editingLigne.statut,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      const updated = await response.json();

      setLignes(lignes.map(l => l.id === editingLigne.id ? updated : l));
      setEditingLigne(null);
      onEditClose();

      toast({
        title: 'Succès',
        description: `Ligne ${updated.numero} modifiée`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la ligne',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleToggleStatut = async (ligne) => {
    const nouveauStatut = ligne.statut === 'Actif' ? 'Suspendue' : 'Actif';
    
    try {
      const response = await fetch(`${API_URL}/api/lignes/${ligne.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: ligne.numero,
          nom: ligne.nom,
          typesVehicules: parseJSON(ligne.typesVehicules),
          statut: nouveauStatut,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut');
      const updated = await response.json();

      setLignes(lignes.map(l => l.id === ligne.id ? updated : l));

      toast({
        title: 'Succès',
        description: `Ligne ${ligne.numero} ${nouveauStatut === 'Actif' ? 'activée' : 'suspendue'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="blue.500" />
          <Box>Chargement des lignes...</Box>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Titre */}
        <Box>
          <Heading as="h1" size="2xl" mb={2}>
            Gestion des Lignes
          </Heading>
          <HStack justify="space-between">
            <Box>Total : <strong>{lignes.length}</strong> lignes ({lignes.filter(l => l.statut === 'Actif').length} actives)</Box>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={onOpen}
            >
              Ajouter une ligne
            </Button>
          </HStack>
        </Box>

        {/* Recherche */}
        <Input
          placeholder="Rechercher par numéro ou nom..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="lg"
        />

        {/* Tableau des lignes */}
        <Card>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Numéro</Th>
                  <Th>Nom de la ligne</Th>
                  <Th>Types d'autobus autorisés</Th>
                  <Th>Statut</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredLignes.map((ligne) => (
                  <Tr key={ligne.id}>
                    <Td fontWeight="bold">{ligne.numero}</Td>
                    <Td>{ligne.nom}</Td>
                    <Td>
                      <HStack spacing={2}>
                        {parseJSON(ligne.typesVehicules).map((type, idx) => (
                          <Badge key={idx} colorScheme="blue">{type}</Badge>
                        ))}
                      </HStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={ligne.statut === 'Actif' ? 'green' : 'gray'}>
                        {ligne.statut}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme={ligne.statut === 'Actif' ? 'orange' : 'green'}
                          variant="outline"
                          onClick={() => handleToggleStatut(ligne)}
                        >
                          {ligne.statut === 'Actif' ? 'Suspendre' : 'Activer'}
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          leftIcon={<EditIcon />}
                          onClick={() => handleEditClick(ligne)}
                        >
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          leftIcon={<DeleteIcon />}
                          onClick={() => handleDeleteLigne(ligne.id)}
                        >
                          Supprimer
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </VStack>

      {/* Modal d'ajout */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ajouter une nouvelle ligne</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Numéro de ligne</FormLabel>
                <Input
                  placeholder="Ex: 815"
                  value={newLigne.numero}
                  onChange={(e) => setNewLigne({ ...newLigne, numero: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Nom de la ligne</FormLabel>
                <Input
                  placeholder="Ex: Gare SNCF - Centre Ville"
                  value={newLigne.nom}
                  onChange={(e) => setNewLigne({ ...newLigne, nom: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Types d'autobus autorisés</FormLabel>
                <Stack spacing={2}>
                  {typesAutobus.map((type) => (
                    <Checkbox
                      key={type}
                      isChecked={newLigne.typesVehicules.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewLigne({
                            ...newLigne,
                            typesVehicules: [...newLigne.typesVehicules, type],
                          });
                        } else {
                          setNewLigne({
                            ...newLigne,
                            typesVehicules: newLigne.typesVehicules.filter(t => t !== type),
                          });
                        }
                      }}
                    >
                      {type}
                    </Checkbox>
                  ))}
                </Stack>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={handleAddLigne}>
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal d'édition */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modifier la ligne</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingLigne && (
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Numéro de ligne</FormLabel>
                  <Input
                    placeholder="Ex: 815"
                    value={editingLigne.numero}
                    onChange={(e) => setEditingLigne({ ...editingLigne, numero: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Nom de la ligne</FormLabel>
                  <Input
                    placeholder="Ex: Gare SNCF - Centre Ville"
                    value={editingLigne.nom}
                    onChange={(e) => setEditingLigne({ ...editingLigne, nom: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Types d'autobus autorisés</FormLabel>
                  <Stack spacing={2}>
                    {typesAutobus.map((type) => (
                      <Checkbox
                        key={type}
                        isChecked={editingLigne.typesVehicules.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingLigne({
                              ...editingLigne,
                              typesVehicules: [...editingLigne.typesVehicules, type],
                            });
                          } else {
                            setEditingLigne({
                              ...editingLigne,
                              typesVehicules: editingLigne.typesVehicules.filter(t => t !== type),
                            });
                          }
                        }}
                      >
                        {type}
                      </Checkbox>
                    ))}
                  </Stack>
                </FormControl>
                <FormControl>
                  <FormLabel>Statut</FormLabel>
                  <HStack spacing={4}>
                    <Checkbox
                      isChecked={editingLigne.statut === 'Actif'}
                      onChange={(e) => setEditingLigne({ ...editingLigne, statut: e.target.checked ? 'Actif' : 'Suspendue' })}
                    >
                      Actif
                    </Checkbox>
                    <Badge colorScheme={editingLigne.statut === 'Actif' ? 'green' : 'gray'}>
                      {editingLigne.statut}
                    </Badge>
                  </HStack>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateLigne}>
              Modifier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Lignes;
