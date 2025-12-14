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
  useToast,
  Text,
  SimpleGrid,
  Grid,
  GridItem,
  Spinner,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, SyncIcon } from '@chakra-ui/icons';
import { FaUser, FaPhone, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';
import { API_URL } from '../../config';

const GestionConducteurs = () => {
  const [conducteursList, setConducteursList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [selectedConducteur, setSelectedConducteur] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Charger les conducteurs depuis l'API
  useEffect(() => {
    fetchConducteurs();
  }, []);

  const fetchConducteurs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/conducteurs`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setConducteursList(data);
    } catch (error) {
      console.error('Erreur chargement conducteurs:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les conducteurs',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const syncWithJurhe = async () => {
    try {
      setSyncing(true);
      const response = await fetch(`${API_URL}/api/conducteurs/jurhe/sync`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      
      // Mettre à jour la liste
      setConducteursList(result.conducteurs || []);
      
      toast({
        title: 'Synchronisation JURHE',
        description: result.message || `${result.imported || 0} conducteurs synchronisés`,
        status: result.conducteurs ? 'success' : 'warning',
        duration: 3000,
      });
    } catch (error) {
      console.error('Erreur sync JURHE:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de synchroniser avec JURHE',
        status: 'error',
      });
    } finally {
      setSyncing(false);
    }
  };

  const filteredConducteurs = conducteursList.filter(c =>
    (c.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.matricule?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!filterStatut || c.statut === filterStatut)
  );

  const handleSelectConducteur = (conducteur) => {
    setSelectedConducteur(conducteur);
    onOpen();
  };

  const handleClosureModal = () => {
    setSelectedConducteur(null);
    onClose();
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'Actif':
        return 'green';
      case 'En congé':
        return 'yellow';
      case 'Inactif':
        return 'red';
      default:
        return 'gray';
    }
  };

  const calculerHeuresSemaine = (conducteur) => {
    // Calcul simplifié - en production, cela viendrait de la base de données
    return Math.floor(Math.random() * ((conducteur.heuresRéglementaires || 35) + 5));
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Titre */}
        <Box>
          <Heading as="h1" size="2xl" mb={2}>
            Gestion des Conducteurs
          </Heading>
          <Text color="gray.600">
            Gérez le personnel de conduite synchronisé avec JURHE
          </Text>
        </Box>

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
                <Text fontWeight="bold">En Congé</Text>
                <Heading size="lg" color="yellow.600">
                  {conducteursList.filter(c => c.statut === 'En congé').length}
                </Heading>
              </VStack>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <VStack align="start">
                <Text fontWeight="bold">Inactifs</Text>
                <Heading size="lg" color="red.600">
                  {conducteursList.filter(c => c.statut === 'Inactif').length}
                </Heading>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filtres et Actions */}
        <HStack spacing={4} wrap="wrap">
          <Input
            placeholder="Rechercher par nom, prénom ou matricule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            maxW="400px"
          />
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '16px',
            }}
          >
            <option value="">Tous les statuts</option>
            <option value="Actif">Actif</option>
            <option value="En congé">En congé</option>
            <option value="Inactif">Inactif</option>
          </select>
          <Button
            leftIcon={<SyncIcon />}
            colorScheme="blue"
            onClick={syncWithJurhe}
            isLoading={syncing}
            loadingText="Synchronisation..."
          >
            Sync JURHE
          </Button>
        </HStack>

        {/* Loading state */}
        {loading && (
          <Box textAlign="center" py={8}>
            <Spinner size="lg" color="blue.500" />
            <Text mt={4}>Chargement des conducteurs...</Text>
          </Box>
        )}

        {/* Tableau des conducteurs */}
        {!loading && (
        <Card>
          <CardBody>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr bg="gray.100">
                    <Th>Matricule</Th>
                    <Th>Nom Prénom</Th>
                    <Th>Permis</Th>
                    <Th>Statut</Th>
                    <Th>Heures/Semaine</Th>
                    <Th>Contrat</Th>
                    <Th>Embauche</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredConducteurs.length > 0 ? (
                    filteredConducteurs.map((conducteur) => (
                      <Tr key={conducteur.id} _hover={{ bg: 'gray.50' }}>
                        <Td fontWeight="bold">{conducteur.matricule}</Td>
                        <Td>{conducteur.prenom} {conducteur.nom}</Td>
                        <Td>
                          <Badge colorScheme="blue">{conducteur.permis}</Badge>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatutColor(conducteur.statut)}>
                            {conducteur.statut}
                          </Badge>
                        </Td>
                        <Td>
                          <Text>{calculerHeuresSemaine(conducteur)} / {conducteur.heuresRéglementaires}h</Text>
                        </Td>
                        <Td>{conducteur.typeContrat}</Td>
                        <Td fontSize="sm">{new Date(conducteur.dateEmbauche).toLocaleDateString('fr-FR')}</Td>
                        <Td>
                          <Button
                            size="sm"
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => handleSelectConducteur(conducteur)}
                          >
                            Détails
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={8} textAlign="center" py={8}>
                        <Text color="gray.500">Aucun conducteur trouvé</Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
        )}
      </VStack>

      {/* Modal Détails */}
      <Modal isOpen={isOpen} onClose={handleClosureModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Détails Conducteur - {selectedConducteur?.prenom} {selectedConducteur?.nom}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedConducteur && (
              <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                <GridItem>
                  <VStack align="start" spacing={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Matricule</Text>
                      <Text fontWeight="bold">{selectedConducteur.matricule}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Permis</Text>
                      <Text fontWeight="bold">{selectedConducteur.permis}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Date d'embauche</Text>
                      <Text fontWeight="bold">
                        {new Date(selectedConducteur.dateEmbauche).toLocaleDateString('fr-FR')}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Type de contrat</Text>
                      <Text fontWeight="bold">{selectedConducteur.typeContrat}</Text>
                    </Box>
                  </VStack>
                </GridItem>
                <GridItem>
                  <VStack align="start" spacing={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Statut</Text>
                      <Badge colorScheme={getStatutColor(selectedConducteur.statut)}>
                        {selectedConducteur.statut}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Heures réglementaires</Text>
                      <Text fontWeight="bold">{selectedConducteur.heuresRéglementaires}h/semaine</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Heures max</Text>
                      <Text fontWeight="bold">{selectedConducteur.heuresMax}h/semaine</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Téléphone</Text>
                      <Text fontWeight="bold">{selectedConducteur.telephone}</Text>
                    </Box>
                  </VStack>
                </GridItem>
              </Grid>
            )}
            {selectedConducteur && (
              <Box mt={6} p={4} bg="blue.50" borderRadius="md">
                <Text fontSize="sm" color="gray.600">Email</Text>
                <Text fontWeight="bold">{selectedConducteur.email}</Text>
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleClosureModal}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default GestionConducteurs;
