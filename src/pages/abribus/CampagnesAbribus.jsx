import React, { useState, useContext, useEffect } from 'react';
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
  RadioGroup
} from '@chakra-ui/react';
import { FaChartBar, FaCheckCircle, FaClock, FaCamera, FaTrash, FaThermometerHalf, FaClipboard, FaTasks } from 'react-icons/fa';
import { UserContext } from '../../context/UserContext';
import { API_URL } from '../../config';

// Campagnes prédéfinies
// Campagnes prédéfinies - ces IDs correspondent aux données en DB
const CAMPAGNE_DEFAULTS = {
  CARROSSERIE: { type: 'VERIFICATION_CARROSSERIE', icon: FaCamera },
  CHAUFFAGE: { type: 'VERIFICATION_CHAUFFAGE', icon: FaThermometerHalf },
  SAEIV: { type: 'VERIFICATION_SAEIV', icon: FaClipboard }
};

const CAMPAGNES = [];

const TYPES_BUSES = {
  STANDARD: 'Standard',
  ARTICULE: 'Articulé',
  MINIBUS: 'Minibus'
};

const ANOMALIES_CARROSSERIE = [
  { id: 'rayures', label: 'Rayures' },
  { id: 'livree-defraichie', label: 'Livrée défrâchie' },
  { id: 'livree-manquante', label: 'Livrée manquante' },
  { id: 'carrosserie-dent', label: 'Carrosserie en dent-chevauchée' },
  { id: 'vitre-cassee', label: 'Vitre cassée' },
  { id: 'corrosion', label: 'Corrosion' },
  { id: 'graffiti', label: 'Graffiti' },
  { id: 'autre', label: 'Autre anomalie' }
];

const ANOMALIES_CHAUFFAGE = [
  { id: 'chauffage-conducteur-hs', label: 'Chauffage conducteur HS' },
  { id: 'chauffage-voyageurs-hs', label: 'Chauffage voyageurs HS' },
  { id: 'thermostat-defaillant', label: 'Thermostat défaillant' },
  { id: 'ventilation-defaillante', label: 'Ventilation défaillante' },
  { id: 'fuite-refrigerant', label: 'Fuite de réfrigérant' },
  { id: 'autre-chauffage', label: 'Autre anomalie chauffage' }
];

const ANOMALIES_SAEIV = [
  { id: 'portes-hs', label: 'Portes défaillantes' },
  { id: 'ascenseur-hs', label: 'Ascenseur HS' },
  { id: 'rampes-hs', label: 'Rampes d\'accès HS' },
  { id: 'boutons-appel-hs', label: 'Boutons d\'appel HS' },
  { id: 'ecrans-hs', label: 'Écrans information HS' },
  { id: 'microphone-hs', label: 'Microphone HS' },
  { id: 'autre-saeiv', label: 'Autre anomalie SAEIV' }
];

export default function CampagnesAbribus() {
  const [campagnes, setCampagnes] = useState([]);
  const [campagneActive, setCampagneActive] = useState(null);
  const [busAVerifier, setBusAVerifier] = useState([]);
  const [busVerifies, setBusVerifies] = useState([]);
  const [busEnCours, setBusEnCours] = useState(null);
  const [anomaliesSelectionnees, setAnomaliesSelectionnees] = useState([]);
  const [photosUpload, setPhotosUpload] = useState([]);
  const [indisponibiliteProgrammee, setIndisponibiliteProgrammee] = useState({
    hs: false,
    dateDebut: '',
    dateFin: '',
    motif: ''
  });
  const [loading, setLoading] = useState(true);
  
  const { user } = useContext(UserContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [detailsVerification, setDetailsVerification] = useState({
    date: new Date().toISOString().split('T')[0],
    heure: new Date().toTimeString().slice(0, 5),
    agent: user?.prenom + ' ' + user?.nom || 'Agent',
    notes: ''
  });

  // Charger les campagnes au démarrage
  useEffect(() => {
    loadCampagnes();
  }, []);

  const loadCampagnes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/campagnes-abribus`);
      if (!response.ok) throw new Error('Erreur chargement campagnes');
      
      const campagnesData = await response.json();
      
      // Ajouter les icônes aux campagnes
      const campagnesWithIcons = campagnesData.map(c => ({
        ...c,
        icon: c.type === 'VERIFICATION_CARROSSERIE' ? FaCamera :
              c.type === 'VERIFICATION_CHAUFFAGE' ? FaThermometerHalf :
              c.type === 'VERIFICATION_SAEIV' ? FaClipboard : FaTasks
      }));

      setCampagnes(campagnesWithIcons);
      
      // Sélectionner la première campagne par défaut
      if (campagnesWithIcons.length > 0) {
        setCampagneActive(campagnesWithIcons[0]);
      }
    } catch (err) {
      console.error('Erreur chargement campagnes:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les campagnes',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger les vérifications quand la campagne change
  useEffect(() => {
    if (campagneActive) {
      loadVerifications();
    }
  }, [campagneActive]);

  const loadVerifications = async () => {
    try {
      setLoading(true);
      // Récupérer toutes les vérifications de la campagne
      const response = await fetch(`${API_URL}/api/campagnes-abribus/${campagneActive.id}/verifications`);
      if (!response.ok) throw new Error('Erreur chargement vérifications');
      
      const verifications = await response.json();
      
      // Charger les véhicules disponibles
      const vehiclesResponse = await fetch(`${API_URL}/api/vehicles`);
      let allVehicles = [];
      if (vehiclesResponse.ok) {
        allVehicles = await vehiclesResponse.json();
      } else {
        // Fallback sur les données locales
        allVehicles = [
          { parc: 'AB001', type: 'STANDARD', marque: 'Irisbus', modele: 'Citelis' },
          { parc: 'AB002', type: 'STANDARD', marque: 'Irisbus', modele: 'Citelis' },
          { parc: 'AB003', type: 'ARTICULE', marque: 'Irisbus', modele: 'Citiris Articulé' },
          { parc: 'AB004', type: 'STANDARD', marque: 'Irisbus', modele: 'Citelis' },
          { parc: 'AB005', type: 'MINIBUS', marque: 'Irisbus', modelo: 'Citaro' }
        ];
      }

      const parcVerifies = verifications.map(v => v.vehicleParc);
      const aVerifier = allVehicles.filter(v => !parcVerifies.includes(v.parc));

      setBusAVerifier(aVerifier);
      setBusVerifies(verifications);
    } catch (err) {
      console.error('Erreur chargement vérifications:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les vérifications',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getAnomaliesForCampagne = () => {
    if (campagneActive.type === 'VERIFICATION_CARROSSERIE') return ANOMALIES_CARROSSERIE;
    if (campagneActive.type === 'VERIFICATION_CHAUFFAGE') return ANOMALIES_CHAUFFAGE;
    if (campagneActive.type === 'VERIFICATION_SAEIV') return ANOMALIES_SAEIV;
    return [];
  };

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
    setIndisponibiliteProgrammee({
      hs: false,
      dateDebut: '',
      dateFin: '',
      motif: ''
    });
    onOpen();
  };

  const handleValidateBus = async () => {
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

    if ((campagneActive.type === 'VERIFICATION_CHAUFFAGE' || campagneActive.type === 'VERIFICATION_SAEIV') 
        && indisponibiliteProgrammee.hs 
        && (!indisponibiliteProgrammee.dateDebut || !indisponibiliteProgrammee.dateFin)) {
      toast({
        title: 'Erreur',
        description: 'Veuillez programmer les dates d\'indisponibilité',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);

      // Soumettre la vérification
      const anomaliesToSubmit = anomaliesSelectionnees.map(id => {
        const anom = getAnomaliesForCampagne().find(a => a.id === id);
        return anom || { id };
      });

      const verificationData = {
        vehicleParc: busEnCours.parc,
        agentNom: detailsVerification.agent.split(' ')[1] || detailsVerification.agent,
        agentPrenom: detailsVerification.agent.split(' ')[0],
        dateVerification: detailsVerification.date,
        heureVerification: detailsVerification.heure,
        anomalies: anomaliesToSubmit,
        notes: detailsVerification.notes,
        photos: photosUpload
      };

      const response = await fetch(`${API_URL}/api/campagnes-abribus/${campagneActive.id}/verifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationData)
      });

      if (!response.ok) throw new Error('Erreur création vérification');

      const verification = await response.json();

      // Si indisponibilité programmée, la soumettre aussi
      if (indisponibiliteProgrammee.hs) {
        await fetch(`${API_URL}/api/campagnes-abribus/${campagneActive.id}/indisponibilites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleParc: busEnCours.parc,
            dateDebut: indisponibiliteProgrammee.dateDebut,
            dateFin: indisponibiliteProgrammee.dateFin,
            motif: indisponibiliteProgrammee.motif
          })
        });
      }

      const message = indisponibiliteProgrammee.hs 
        ? `Bus ${busEnCours.parc} vérifié - Indisponibilité programmée (DG sera notifié)` 
        : `Bus ${busEnCours.parc} vérifié`;

      toast({
        title: 'Succès',
        description: message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Recharger les vérifications
      await loadVerifications();
      onClose();
      setBusEnCours(null);
    } catch (err) {
      console.error('Erreur validation:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de soumettre la vérification',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
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
            {['VUE AVANT', 'VUE LATÉRALE', 'VUE ARRIÈRE'].map((vue) => (
              <Box key={vue} border="2px solid" borderColor="gray.300" borderRadius="md" p={4} bg="gray.50">
                <Text fontSize="sm" fontWeight="bold" textAlign="center" mb={4}>{vue}</Text>
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
                    <Text fontSize="xs">Cliquez pour marquer les anomalies</Text>
                  </Box>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        <Box>
          <Text fontWeight="bold" mb={3}>Anomalies détectées</Text>
          <CheckboxGroup value={anomaliesSelectionnees} onChange={setAnomaliesSelectionnees}>
            <Stack spacing={2}>
              {getAnomaliesForCampagne().map(anom => (
                <Checkbox key={anom.id} value={anom.id}>
                  <Text>{anom.label}</Text>
                </Checkbox>
              ))}
            </Stack>
          </CheckboxGroup>
        </Box>

        {(campagneActive.type === 'VERIFICATION_CHAUFFAGE' || campagneActive.type === 'VERIFICATION_SAEIV') && (
          <Card bg="red.50" borderColor="red.300" borderWidth="2px">
            <CardHeader bg="red.100" py={3}>
              <Heading size="sm" color="red.700">⚠️ Programmation d'indisponibilité</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <RadioGroup
                    value={indisponibiliteProgrammee.hs ? '1' : '0'}
                    onChange={(val) => setIndisponibiliteProgrammee({
                      ...indisponibiliteProgrammee,
                      hs: val === '1'
                    })}
                  >
                    <Stack>
                      <Radio value="0">Aucun problème - Véhicule opérationnel</Radio>
                      <Radio value="1">Problème détecté - Programmer indisponibilité</Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>

                {indisponibiliteProgrammee.hs && (
                  <>
                    <HStack spacing={4}>
                      <FormControl>
                        <FormLabel>Date de début</FormLabel>
                        <Input
                          type="date"
                          value={indisponibiliteProgrammee.dateDebut}
                          onChange={(e) => setIndisponibiliteProgrammee({
                            ...indisponibiliteProgrammee,
                            dateDebut: e.target.value
                          })}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Date de fin estimée</FormLabel>
                        <Input
                          type="date"
                          value={indisponibiliteProgrammee.dateFin}
                          onChange={(e) => setIndisponibiliteProgrammee({
                            ...indisponibiliteProgrammee,
                            dateFin: e.target.value
                          })}
                        />
                      </FormControl>
                    </HStack>
                    <FormControl>
                      <FormLabel>Motif (notification au DG)</FormLabel>
                      <Textarea
                        placeholder="Décrivez le problème et les interventions nécessaires..."
                        value={indisponibiliteProgrammee.motif}
                        onChange={(e) => setIndisponibiliteProgrammee({
                          ...indisponibiliteProgrammee,
                          motif: e.target.value
                        })}
                        rows={3}
                      />
                    </FormControl>
                  </>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

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
                  {!estAVerifier && <Th>Statut</Th>}
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {buses.map(bus => (
                  <Tr key={bus.id} _hover={{ bg: 'gray.50' }}>
                    <Td fontWeight="bold">{bus.parc}</Td>
                    <Td>{bus.marque}</Td>
                    <Td>{bus.modele}</Td>
                    <Td><Badge colorScheme="blue">{TYPES_BUSES[bus.type]}</Badge></Td>
                    {!estAVerifier && <Td>{bus.verification?.agent}</Td>}
                    {!estAVerifier && <Td>{bus.verification?.date}</Td>}
                    {!estAVerifier && <Td>
                      {bus.verification?.indisponibilite ? (
                        <Badge colorScheme="red">
                          Indisponible
                        </Badge>
                      ) : (
                        <Badge colorScheme="green">Opérationnel</Badge>
                      )}
                    </Td>}
                    <Td>
                      <Button
                        size="xs"
                        colorScheme={estAVerifier ? 'blue' : 'gray'}
                        onClick={() => estAVerifier && handleSelectBus(bus)}
                      >
                        {estAVerifier ? 'Vérifier' : 'Détails'}
                      </Button>
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

  const handleChangerCampagne = (campagne) => {
    setCampagneActive(campagne);
  };

  return (
    <Box p={6} maxW="100%" mx="auto">
      <VStack align="stretch" spacing={6}>
        {/* Sélection de la campagne */}
        <Box>
          <Heading size="lg" mb={4}>Campagnes ABRIBUS</Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={6}>
            {CAMPAGNES.map((campagne) => (
              <Card
                key={campagne.id}
                bg={campagneActive.id === campagne.id ? 'blue.50' : 'white'}
                borderWidth={campagneActive.id === campagne.id ? '2px' : '1px'}
                borderColor={campagneActive.id === campagne.id ? 'blue.500' : 'gray.200'}
                cursor="pointer"
                onClick={() => handleChangerCampagne(campagne)}
                _hover={{ boxShadow: 'md' }}
              >
                <CardHeader py={3}>
                  <HStack>
                    <Icon as={campagne.icon} boxSize={6} color="blue.500" />
                    <Heading size="sm">{campagne.nom}</Heading>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <Text fontSize="sm" color="gray.600">{campagne.description}</Text>
                  <Badge colorScheme="green" mt={2}>En cours</Badge>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>

        <Divider />

        {/* Contenu de la campagne active */}
        <Box>
          <HStack justify="space-between" align="flex-start" mb={4}>
            <Box>
              <Heading size="md">{campagneActive.nom}</Heading>
              <Text color="gray.600" fontSize="sm" mt={1}>{campagneActive.description}</Text>
              <HStack spacing={4} fontSize="xs" mt={2}>
                <Text>Du {campagneActive.dateDebut} au {campagneActive.dateFin}</Text>
                <Progress
                  value={(busVerifies.length / (busAVerifier.length + busVerifies.length)) * 100}
                  w="200px"
                  colorScheme="blue"
                  size="sm"
                />
                <Text fontWeight="bold">{Math.round((busVerifies.length / (busAVerifier.length + busVerifies.length)) * 100)}%</Text>
              </HStack>
            </Box>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mb={6}>
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

          <Tabs colorScheme="blue">
            <TabList>
              <Tab><Icon as={FaClock} mr={2} />À vérifier ({busAVerifier.length})</Tab>
              <Tab><Icon as={FaCheckCircle} mr={2} />Vérifiés ({busVerifies.length})</Tab>
              <Tab><Icon as={FaChartBar} mr={2} />Statistiques</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <TableauBus buses={busAVerifier} titre="Buses à vérifier" estAVerifier={true} />
              </TabPanel>

              <TabPanel>
                <TableauBus buses={busVerifies} titre="Buses vérifiées" estAVerifier={false} />
              </TabPanel>

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
        </Box>
      </VStack>

      {/* Modal de vérification */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>Vérification - Bus {busEnCours?.parc}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {busEnCours && (
              <VStack spacing={6} align="stretch">
                <Card bg="blue.50">
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Bus</Text>
                        <Text fontWeight="bold">{busEnCours.parc}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Date</Text>
                        <Input type="date" size="sm" value={detailsVerification.date}
                          onChange={(e) => setDetailsVerification({...detailsVerification, date: e.target.value})}
                        />
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Heure</Text>
                        <Input type="time" size="sm" value={detailsVerification.heure}
                          onChange={(e) => setDetailsVerification({...detailsVerification, heure: e.target.value})}
                        />
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Agent</Text>
                        <Text fontWeight="bold">{detailsVerification.agent}</Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                <CarrosserieMaquette />
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>Annuler</Button>
              <Button colorScheme="green" leftIcon={<FaCheckCircle />} onClick={handleValidateBus}>
                Valider la vérification
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
