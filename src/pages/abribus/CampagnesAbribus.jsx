import React, { useState, useContext } from 'react';
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
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
  Input,
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Progress,
  useToast,
  Text,
  Icon,
  Divider,
  Checkbox,
  CheckboxGroup,
  Stack,
  Radio,
  RadioGroup,
  Select as ChakraSelect
} from '@chakra-ui/react';
import { FaChartBar, FaCheckCircle, FaClock, FaCamera, FaTrash, FaThermometerHalf, FaClipboard } from 'react-icons/fa';
import { UserContext } from '../../context/UserContext';
import { API_URL } from '../../config';

const CAMPAGNE_RELEVE_CARROSSERIE = {
  id: 'releve-carrosserie-2026',
  nom: 'Relevé Carrosserie',
  type: 'VERIFICATION_CARROSSERIE',
  description: 'Relevé complet de l\'état de la carrosserie pour tous les véhicules',
  dateDebut: '2026-01-01',
  dateFin: '2026-02-01',
  statut: 'EN_COURS',
  objectif: 'Vérifier l\'état général de la carrosserie, des vitres et de la livrée de chaque véhicule'
};

const TYPES_BUSES = {
  STANDARD: 'Standard',
  ARTICULE: 'Articulé',
  MINIBUS: 'Minibus'
};

const ANOMALIES = [
  { id: 'rayures', label: 'Rayures' },
  { id: 'livree-defraichie', label: 'Livrée défrâchie' },
  { id: 'livree-manquante', label: 'Livrée manquante' },
  { id: 'carrosserie-dent', label: 'Carrosserie en dent-chevauchée' },
  { id: 'vitre-cassee', label: 'Vitre cassée' },
  { id: 'corrosion', label: 'Corrosion' },
  { id: 'graffiti', label: 'Graffiti' },
  { id: 'autre', label: 'Autre anomalie' }
];

export default function CampagnesAbribus() {
  const [campagneActive] = useState(CAMPAGNE_RELEVE_CARROSSERIE);
  const [busAVerifier, setBusAVerifier] = useState([
    { id: 1, parc: 'AB001', type: 'STANDARD', marque: 'Irisbus', modele: 'Citelis' },
    { id: 2, parc: 'AB002', type: 'STANDARD', marque: 'Irisbus', modele: 'Citelis' },
    { id: 3, parc: 'AB003', type: 'ARTICULE', marque: 'Irisbus', modele: 'Citiris Articulé' },
    { id: 4, parc: 'AB004', type: 'STANDARD', marque: 'Irisbus', modele: 'Citelis' },
    { id: 5, parc: 'AB005', type: 'MINIBUS', marque: 'Irisbus', modele: 'Citaro' }
  ]);
  
  const [busVerifies, setBusVerifies] = useState([]);
  const [busEnCours, setBusEnCours] = useState(null);
  const [anomaliesSelectionnees, setAnomaliesSelectionnees] = useState([]);
  const [photosUpload, setPhotosUpload] = useState([]);
  
  const { user } = useContext(UserContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [detailsVerification, setDetailsVerification] = useState({
    date: new Date().toISOString().split('T')[0],
    heure: new Date().toTimeString().slice(0, 5),
    agent: user?.prenom + ' ' + user?.nom || 'Agent',
    notes: ''
  });

  const handleSelectBus = (bus) => {
    setBusEnCours(bus);
    setDetailsVerification({
      date: new Date().toISOString().split('T')[0],
      heure: new Date().toTimeString().slice(0, 5),
      agent: user?.prenom + ' ' + user?.nom || 'Agent',
      notes: ''
    });
    setAnomaliesSelectionnees([]);
    setPhotosUpload([]);
    onOpen();
  };

  const handleValidateBus = () => {
    if (anomaliesSelectionnees.length === 0 && photosUpload.length === 0) {
      toast({
        title: 'Attention',
        description: 'Veuillez signaler au moins une anomalie ou ajouter une photo',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const busVerifie = {
      ...busEnCours,
      verification: {
        ...detailsVerification,
        anomalies: anomaliesSelectionnees,
        photos: photosUpload
      }
    };

    setBusVerifies([...busVerifies, busVerifie]);
    setBusAVerifier(busAVerifier.filter(b => b.id !== busEnCours.id));

    toast({
      title: 'Succès',
      description: `Bus ${busEnCours.parc} vérifié`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    onClose();
    setBusEnCours(null);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotosUpload([...photosUpload, ...files.map(f => ({ name: f.name, file: f }))]);
  };

  const CarrosserieMaquette = () => {
    return (
      <VStack spacing={6} align="stretch">
        <Box>
          <Text fontWeight="bold" mb={2}>Vues de la carrosserie</Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            {/* Vue Avant */}
            <Box border="2px solid" borderColor="gray.300" borderRadius="md" p={4} bg="gray.50">
              <Text fontSize="sm" fontWeight="bold" textAlign="center" mb={4}>VUE AVANT</Text>
              <Box
                bg="linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%)"
                borderRadius="md"
                p={4}
                minH="250px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="crosshair"
                border="1px dashed"
                borderColor="blue.300"
              >
                <Box textAlign="center" color="gray.400">
                  <Icon as={FaCamera} boxSize={12} mb={2} />
                  <Text fontSize="xs">Cliquez sur les zones pour marquer les anomalies</Text>
                </Box>
              </Box>
            </Box>

            {/* Vue Latérale */}
            <Box border="2px solid" borderColor="gray.300" borderRadius="md" p={4} bg="gray.50">
              <Text fontSize="sm" fontWeight="bold" textAlign="center" mb={4}>VUE LATÉRALE</Text>
              <Box
                bg="linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%)"
                borderRadius="md"
                p={4}
                minH="250px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="crosshair"
                border="1px dashed"
                borderColor="blue.300"
              >
                <Box textAlign="center" color="gray.400">
                  <Icon as={FaCamera} boxSize={12} mb={2} />
                  <Text fontSize="xs">Cliquez sur les zones pour marquer les anomalies</Text>
                </Box>
              </Box>
            </Box>

            {/* Vue Arrière */}
            <Box border="2px solid" borderColor="gray.300" borderRadius="md" p={4} bg="gray.50">
              <Text fontSize="sm" fontWeight="bold" textAlign="center" mb={4}>VUE ARRIÈRE</Text>
              <Box
                bg="linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%)"
                borderRadius="md"
                p={4}
                minH="250px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="crosshair"
                border="1px dashed"
                borderColor="blue.300"
              >
                <Box textAlign="center" color="gray.400">
                  <Icon as={FaCamera} boxSize={12} mb={2} />
                  <Text fontSize="xs">Cliquez sur les zones pour marquer les anomalies</Text>
                </Box>
              </Box>
            </Box>
          </SimpleGrid>
        </Box>

        <Box>
          <Text fontWeight="bold" mb={3}>Anomalies détectées</Text>
          <CheckboxGroup value={anomaliesSelectionnees} onChange={setAnomaliesSelectionnees}>
            <Stack spacing={2}>
              {ANOMALIES.map(anom => (
                <Checkbox key={anom.id} value={anom.id}>
                  <Text>{anom.label}</Text>
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </Box>

        <FormControl>
          <FormLabel>Notes supplémentaires</FormLabel>
          <Textarea
            placeholder="Décrivez précisément les anomalies observées..."
            value={detailsVerification.notes}
            onChange={(e) => setDetailsVerification({
              ...detailsVerification,
              notes: e.target.value
            })}
            rows={4}
          />
        </FormControl>

        <Box>
          <FormControl mb={3}>
            <FormLabel>Photos justificatives</FormLabel>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
            />
          </FormControl>
          {photosUpload.length > 0 && (
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={2}>Photos ajoutées ({photosUpload.length})</Text>
              <Stack spacing={2}>
                {photosUpload.map((photo, idx) => (
                  <HStack key={idx} justify="space-between" bg="gray.50" p={2} borderRadius="md">
                    <Text fontSize="sm">{photo.name}</Text>
                    <Button
                      size="xs"
                      colorScheme="red"
                      variant="ghost"
                      leftIcon={<FaTrash />}
                      onClick={() => setPhotosUpload(photosUpload.filter((_, i) => i !== idx))}
                    >
                      Supprimer
                    </Button>
                  </HStack>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </VStack>
    );
  };

  const TableauBus = ({ buses, titre, estAVerifier = true }) => (
    <Card>
      <CardHeader bg="gray.100" py={4}>
        <Heading size="sm">{titre}</Heading>
      </CardHeader>
      <CardBody>
        {buses.length === 0 ? (
          <Text textAlign="center" color="gray.500" py={6}>
            {estAVerifier ? 'Tous les bus ont été vérifiés !' : 'Aucun bus vérifié pour le moment'}
          </Text>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr bg="gray.50">
                  <Th>Parc</Th>
                  <Th>Marque</Th>
                  <Th>Modèle</Th>
                  <Th>Type</Th>
                  {!estAVerifier && <Th>Agent</Th>}
                  {!estAVerifier && <Th>Date</Th>}
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {buses.map(bus => (
                  <Tr key={bus.id} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="bold">{bus.parc}</Td>
                    <Td>{bus.marque}</Td>
                    <Td>{bus.modele}</Td>
                    <Td>
                      <Badge colorScheme="blue">{TYPES_BUSES[bus.type]}</Badge>
                    </Td>
                    {!estAVerifier && <Td>{bus.verification?.agent}</Td>}
                    {!estAVerifier && <Td>{bus.verification?.date}</Td>}
                    <Td>
                      {estAVerifier ? (
                        <Button
                          size="xs"
                          colorScheme="blue"
                          onClick={() => handleSelectBus(bus)}
                        >
                          Vérifier
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="blue"
                        >
                          Voir détails
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </CardBody>
    </Card>
  );

  return (
    <Box p={6} maxW="100%" mx="auto">
      <VStack align="stretch" spacing={6}>
        {/* En-tête */}
        <Box>
          <Heading size="lg" mb={2}>{campagneActive.nom}</Heading>
          <Text color="gray.600" mb={3}>{campagneActive.description}</Text>
          <HStack spacing={4} fontSize="sm">
            <Badge colorScheme="green">En cours</Badge>
            <Text>Du {campagneActive.dateDebut} au {campagneActive.dateFin}</Text>
            <HStack>
              <Text fontWeight="bold">Progression:</Text>
              <Progress
                value={(busVerifies.length / (busAVerifier.length + busVerifies.length)) * 100}
                w="200px"
                colorScheme="blue"
              />
              <Text>{Math.round((busVerifies.length / (busAVerifier.length + busVerifies.length)) * 100)}%</Text>
            </HStack>
          </HStack>
        </Box>

        <Divider />

        {/* Statistiques rapides */}
        <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>À vérifier</StatLabel>
                <StatNumber color="orange.500">{busAVerifier.length}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Vérifiés</StatLabel>
                <StatNumber color="green.500">{busVerifies.length}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total</StatLabel>
                <StatNumber>{busAVerifier.length + busVerifies.length}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Progression</StatLabel>
                <StatNumber color="blue.500">
                  {Math.round((busVerifies.length / (busAVerifier.length + busVerifies.length)) * 100)}%
                </StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Onglets */}
        <Tabs colorScheme="blue">
          <TabList>
            <Tab>
              <Icon as={FaClock} mr={2} />
              À vérifier ({busAVerifier.length})
            </Tab>
            <Tab>
              <Icon as={FaCheckCircle} mr={2} />
              Vérifiés ({busVerifies.length})
            </Tab>
            <Tab>
              <Icon as={FaChartBar} mr={2} />
              Statistiques
            </Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: À vérifier */}
            <TabPanel>
              <TableauBus buses={busAVerifier} titre="Buses à vérifier" estAVerifier={true} />
            </TabPanel>

            {/* Tab 2: Vérifiés */}
            <TabPanel>
              <TableauBus buses={busVerifies} titre="Buses vérifiées" estAVerifier={false} />
            </TabPanel>

            {/* Tab 3: Statistiques */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Card>
                  <CardHeader bg="gray.100" py={4}>
                    <Heading size="md">Anomalies les plus fréquentes</Heading>
                  </CardHeader>
                  <CardBody>
                    <Text color="gray.500" textAlign="center" py={8}>
                      Les statistiques s'afficheront au fur et à mesure des vérifications
                    </Text>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader bg="gray.100" py={4}>
                    <Heading size="md">Agents actifs</Heading>
                  </CardHeader>
                  <CardBody>
                    <Text color="gray.500" textAlign="center" py={8}>
                      Les agents actifs s'afficheront au fur et à mesure des vérifications
                    </Text>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Modal de vérification */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>
            Vérification - Bus {busEnCours?.parc}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {busEnCours && (
              <VStack spacing={6} align="stretch">
                {/* Infos pré-remplies */}
                <Card bg="blue.50">
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Bus</Text>
                        <Text fontWeight="bold">{busEnCours.parc}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Date</Text>
                        <Input
                          type="date"
                          size="sm"
                          value={detailsVerification.date}
                          onChange={(e) => setDetailsVerification({
                            ...detailsVerification,
                            date: e.target.value
                          })}
                        />
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Heure</Text>
                        <Input
                          type="time"
                          size="sm"
                          value={detailsVerification.heure}
                          onChange={(e) => setDetailsVerification({
                            ...detailsVerification,
                            heure: e.target.value
                          })}
                        />
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Agent</Text>
                        <Text fontWeight="bold">{detailsVerification.agent}</Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Maquettes de carrosserie */}
                <CarrosserieMaquette />
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Annuler
              </Button>
              <Button
                colorScheme="green"
                leftIcon={<FaCheckCircle />}
                onClick={handleValidateBus}
              >
                Valider la vérification
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
