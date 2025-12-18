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
  Select,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { API_URL } from '../../config';

const SAEIV = () => {
  const [saeivs, setSaeivs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newSaeiv, setNewSaeiv] = useState({ 
    numero: '', 
    libelle: '', 
    type: 'Affichage',
    statut: 'Actif'
  });
  const [editingSaeiv, setEditingSaeiv] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const toast = useToast();

  const saeivTypes = ['Affichage', 'Sonorisation', 'WiFi', 'USB', 'Caméra', 'Ventilation', 'Accessibilité'];
  const saeivStatuts = ['Actif', 'Maintenance', 'Arrêté', 'Défaillant'];

  // Charger les SAEIV depuis le serveur
  useEffect(() => {
    const fetchSaeivs = async () => {
      try {
        const response = await fetch(`${API_URL}/api/saeivs`);
        if (!response.ok) throw new Error('Erreur lors du chargement');
        const data = await response.json();
        setSaeivs(data);
      } catch (error) {
        console.error('Erreur:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les équipements SAEIV',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSaeivs();
  }, [toast]);

  const filteredSaeivs = saeivs.filter(saeiv =>
    saeiv.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    saeiv.libelle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSaeiv = async () => {
    if (!newSaeiv.numero || !newSaeiv.libelle || !newSaeiv.type) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/saeivs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: newSaeiv.numero,
          libelle: newSaeiv.libelle,
          type: newSaeiv.type,
          statut: newSaeiv.statut,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la création');
      const created = await response.json();

      setSaeivs([...saeivs, created]);
      setNewSaeiv({ numero: '', libelle: '', type: 'Affichage', statut: 'Actif' });
      onClose();

      toast({
        title: 'Succès',
        description: `Équipement ${created.numero} ajouté`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter l\'équipement',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditClick = (saeiv) => {
    setEditingSaeiv({
      id: saeiv.id,
      numero: saeiv.numero,
      libelle: saeiv.libelle,
      type: saeiv.type,
      statut: saeiv.statut,
    });
    onEditOpen();
  };

  const handleUpdateSaeiv = async () => {
    if (!editingSaeiv.numero || !editingSaeiv.libelle || !editingSaeiv.type) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs requis',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/saeivs/${editingSaeiv.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: editingSaeiv.numero,
          libelle: editingSaeiv.libelle,
          type: editingSaeiv.type,
          statut: editingSaeiv.statut,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      const updated = await response.json();

      setSaeivs(saeivs.map(s => s.id === editingSaeiv.id ? updated : s));
      setEditingSaeiv(null);
      onEditClose();

      toast({
        title: 'Succès',
        description: `Équipement ${updated.numero} modifié`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier l\'équipement',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteSaeiv = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/saeivs/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      setSaeivs(saeivs.filter(s => s.id !== id));
      toast({
        title: 'Succès',
        description: 'Équipement supprimé',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'équipement',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleToggleStatut = async (saeiv) => {
    const statusSequence = {
      'Actif': 'Maintenance',
      'Maintenance': 'Arrêté',
      'Arrêté': 'Défaillant',
      'Défaillant': 'Actif'
    };
    
    const nouveauStatut = statusSequence[saeiv.statut] || 'Actif';
    
    try {
      const response = await fetch(`${API_URL}/api/saeivs/${saeiv.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: saeiv.numero,
          libelle: saeiv.libelle,
          type: saeiv.type,
          statut: nouveauStatut,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut');
      const updated = await response.json();

      setSaeivs(saeivs.map(s => s.id === saeiv.id ? updated : s));

      toast({
        title: 'Succès',
        description: `Statut changé à ${nouveauStatut}`,
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

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'Actif':
        return 'green';
      case 'Maintenance':
        return 'yellow';
      case 'Arrêté':
        return 'orange';
      case 'Défaillant':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="blue.500" />
          <Box>Chargement des équipements SAEIV...</Box>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Titre */}
        <Box>
          <Heading as="h1" variant="pageTitle">
            Gestion SAEIV
          </Heading>
        </Box>

        {/* Statistiques et Actions */}
        <HStack justify="space-between">
          <Box>
            Total : <strong>{saeivs.length}</strong> équipements 
            ({saeivs.filter(s => s.statut === 'Actif').length} actifs)
          </Box>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={onOpen}
          >
            Ajouter un équipement
          </Button>
        </HStack>

        {/* Recherche */}
        <Input
          placeholder="Rechercher par numéro ou libellé..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="lg"
        />

        {/* Tableau des équipements SAEIV */}
        <Card>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Numéro</Th>
                  <Th>Libellé</Th>
                  <Th>Type</Th>
                  <Th>Statut</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredSaeivs.map((saeiv) => (
                  <Tr key={saeiv.id}>
                    <Td fontWeight="bold">{saeiv.numero}</Td>
                    <Td>{saeiv.libelle}</Td>
                    <Td>
                      <Badge colorScheme="blue">{saeiv.type}</Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatutColor(saeiv.statut)}>
                        {saeiv.statut}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          colorScheme={getStatutColor(saeiv.statut)}
                          variant="outline"
                          onClick={() => handleToggleStatut(saeiv)}
                        >
                          {saeiv.statut}
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          leftIcon={<EditIcon />}
                          onClick={() => handleEditClick(saeiv)}
                        >
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          leftIcon={<DeleteIcon />}
                          onClick={() => handleDeleteSaeiv(saeiv.id)}
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
          <ModalHeader>Ajouter un équipement SAEIV</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Numéro</FormLabel>
                <Input
                  placeholder="Ex: SAEIV-001"
                  value={newSaeiv.numero}
                  onChange={(e) => setNewSaeiv({ ...newSaeiv, numero: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Libellé</FormLabel>
                <Input
                  placeholder="Ex: Affichage destination"
                  value={newSaeiv.libelle}
                  onChange={(e) => setNewSaeiv({ ...newSaeiv, libelle: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Type</FormLabel>
                <Select
                  value={newSaeiv.type}
                  onChange={(e) => setNewSaeiv({ ...newSaeiv, type: e.target.value })}
                >
                  {saeivTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Statut</FormLabel>
                <Select
                  value={newSaeiv.statut}
                  onChange={(e) => setNewSaeiv({ ...newSaeiv, statut: e.target.value })}
                >
                  {saeivStatuts.map((statut) => (
                    <option key={statut} value={statut}>
                      {statut}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={handleAddSaeiv}>
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal d'édition */}
      <Modal isOpen={isEditOpen} onClose={onEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modifier l'équipement SAEIV</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingSaeiv && (
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Numéro</FormLabel>
                  <Input
                    placeholder="Ex: SAEIV-001"
                    value={editingSaeiv.numero}
                    onChange={(e) => setEditingSaeiv({ ...editingSaeiv, numero: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Libellé</FormLabel>
                  <Input
                    placeholder="Ex: Affichage destination"
                    value={editingSaeiv.libelle}
                    onChange={(e) => setEditingSaeiv({ ...editingSaeiv, libelle: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={editingSaeiv.type}
                    onChange={(e) => setEditingSaeiv({ ...editingSaeiv, type: e.target.value })}
                  >
                    {saeivTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Statut</FormLabel>
                  <Select
                    value={editingSaeiv.statut}
                    onChange={(e) => setEditingSaeiv({ ...editingSaeiv, statut: e.target.value })}
                  >
                    {saeivStatuts.map((statut) => (
                      <option key={statut} value={statut}>
                        {statut}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateSaeiv}>
              Modifier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default SAEIV;
