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
  Divider,
  useToast,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { API_URL } from '../../config';
import { lignesBase } from '../../data/lignesBase.js';

const Lignes = () => {
  const [lignes, setLignes] = useState([]);
  const [typesAutobus, setTypesAutobus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newLigne, setNewLigne] = useState({ numero: '', nom: '', typesVehicules: [], demandeChrono: false, estScolaire: false, estSpecial: false, departLimite: false, serviceLimite: false });
  const [editingLigne, setEditingLigne] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const toast = useToast();

  // Charger les types de véhicules et les lignes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les types
        const typesRes = await fetch(`${API_URL}/api/vehicle-types`);
        if (typesRes.ok) {
          const typesData = await typesRes.json();
          console.log('[Lignes] Types loaded:', typesData.types?.length);
          setTypesAutobus(typesData.types || []);
        } else {
          console.warn('[Lignes] Failed to load types:', typesRes.status);
        }
      } catch (error) {
        console.error('Erreur chargement types:', error);
      }
    };
    fetchData();
  }, []);

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
        // Fallback sur les données locales
        setLignes(lignesBase || []);
        toast({
          title: 'Info',
          description: 'Affichage des données locales',
          status: 'info',
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
          demandeChrono: newLigne.demandeChrono,
          statut: 'Actif',
          estScolaire: newLigne.estScolaire || false,
          estSpecial: newLigne.estSpecial || false,
          departLimite: newLigne.departLimite || false,
          serviceLimite: newLigne.serviceLimite || false,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la création');
      const created = await response.json();

      setLignes([...lignes, created]);
      setNewLigne({ numero: '', nom: '', typesVehicules: [], demandeChrono: false, estScolaire: false, estSpecial: false, departLimite: false, serviceLimite: false });
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
      demandeChrono: ligne.demandeChrono || false,
      statut: ligne.statut,
      estScolaire: ligne.estScolaire || false,
      estSpecial: ligne.estSpecial || false,
      departLimite: ligne.departLimite || false,
      serviceLimite: ligne.serviceLimite || false,
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
          demandeChrono: editingLigne.demandeChrono,
          statut: editingLigne.statut,
          estScolaire: editingLigne.estScolaire || false,
          estSpecial: editingLigne.estSpecial || false,
          departLimite: editingLigne.departLimite || false,
          serviceLimite: editingLigne.serviceLimite || false,
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
          demandeChrono: ligne.demandeChrono,
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
          <Heading as="h1" variant="pageTitle">
            Gestion des Lignes
          </Heading>
        </Box>

        {/* Statistiques et Actions */}
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
              <FormControl>
                <Checkbox
                  isChecked={newLigne.demandeChrono}
                  onChange={(e) => setNewLigne({ ...newLigne, demandeChrono: e.target.checked })}
                >
                  Demander la carte chrono
                </Checkbox>
              </FormControl>

              {/* Paramètres du cycle - Create modal */}
              <Divider my={2} />
              <FormControl>
                <FormLabel fontWeight="bold" fontSize="md">Paramètres du cycle</FormLabel>
                <Stack spacing={2} mt={3}>
                  <Checkbox
                    isChecked={newLigne.estScolaire}
                    onChange={(e) => setNewLigne({ ...newLigne, estScolaire: e.target.checked })}
                  >
                    Service scolaire
                  </Checkbox>
                  <Checkbox
                    isChecked={newLigne.estSpecial}
                    onChange={(e) => setNewLigne({ ...newLigne, estSpecial: e.target.checked })}
                  >
                    Service spécial
                  </Checkbox>
                  <Checkbox
                    isChecked={newLigne.departLimite}
                    onChange={(e) => setNewLigne({ ...newLigne, departLimite: e.target.checked })}
                  >
                    Départ limité
                  </Checkbox>
                  <Checkbox
                    isChecked={newLigne.serviceLimite}
                    onChange={(e) => setNewLigne({ ...newLigne, serviceLimite: e.target.checked })}
                  >
                    Service limité
                  </Checkbox>
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
          <ModalHeader>
            <HStack justify="space-between" w="100%">
              <Box>Modifier la ligne</Box>
              <Button 
                size="sm" 
                colorScheme="orange" 
                variant="outline"
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_URL}/api/admin/fix-vehicle-types`, { method: 'POST' });
                    const data = await res.json();
                    toast({
                      title: 'Types corrigés',
                      description: `${data.fixed} ligne(s) mise(s) à jour`,
                      status: 'success',
                      duration: 3000,
                      isClosable: true,
                    });
                    await fetchLignes();
                  } catch (e) {
                    toast({
                      title: 'Erreur',
                      description: 'Erreur lors de la correction',
                      status: 'error',
                      duration: 3000,
                      isClosable: true,
                    });
                  }
                }}
              >
                🔧 Corriger les types
              </Button>
            </HStack>
          </ModalHeader>
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
                  <Box mb={2}>
                    <Text fontSize="sm" color="gray.600" mb={2}>Actuellement sélectionnés :</Text>
                    <HStack spacing={2} flexWrap="wrap">
                      {editingLigne.typesVehicules.length > 0 ? (
                        editingLigne.typesVehicules.map(type => (
                          <Badge key={type} colorScheme="blue">
                            {type}
                          </Badge>
                        ))
                      ) : (
                        <Text fontSize="sm" color="orange.500">Aucun type sélectionné</Text>
                      )}
                    </HStack>
                  </Box>
                  {typesAutobus.length === 0 ? (
                    <Box color="orange.500" fontSize="sm">
                      Chargement des types de véhicules... ({typesAutobus.length})
                    </Box>
                  ) : (
                    <Stack spacing={2} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
                      <Text fontSize="sm" fontWeight="bold">Cocher/décocher les types :</Text>
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
                  )}
                </FormControl>
                <FormControl>
                  <Checkbox
                    isChecked={editingLigne.demandeChrono}
                    onChange={(e) => setEditingLigne({ ...editingLigne, demandeChrono: e.target.checked })}
                  >
                    Demander la carte chrono
                  </Checkbox>
                </FormControl>

                {/* Paramètres du cycle */}
                <Divider my={2} />
                <FormControl>
                  <FormLabel fontWeight="bold" fontSize="md">Paramètres du cycle</FormLabel>
                  <Stack spacing={2} mt={3}>
                    <Checkbox
                      isChecked={editingLigne.estScolaire || false}
                      onChange={(e) => setEditingLigne({ ...editingLigne, estScolaire: e.target.checked })}
                    >
                      Service scolaire
                    </Checkbox>
                    <Checkbox
                      isChecked={editingLigne.estSpecial || false}
                      onChange={(e) => setEditingLigne({ ...editingLigne, estSpecial: e.target.checked })}
                    >
                      Service spécial
                    </Checkbox>
                    <Checkbox
                      isChecked={editingLigne.departLimite || false}
                      onChange={(e) => setEditingLigne({ ...editingLigne, departLimite: e.target.checked })}
                    >
                      Départ limité
                    </Checkbox>
                    <Checkbox
                      isChecked={editingLigne.serviceLimite || false}
                      onChange={(e) => setEditingLigne({ ...editingLigne, serviceLimite: e.target.checked })}
                    >
                      Service limité
                    </Checkbox>
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
