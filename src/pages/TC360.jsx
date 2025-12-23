import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Spinner,
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Divider,
  Checkbox,
  Alert,
  AlertIcon,
  Grid,
  GridItem,
  SimpleGrid,
  Input,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { FaClock, FaCheckCircle, FaUser, FaBus, FaShieldAlt, FaMapPin } from 'react-icons/fa';
import { UserContext } from '../context/UserContext';
import { formatDateFrLong } from '../utils/dateFormat';
import { API_URL } from '../config';

const TC360 = () => {
  const { user } = useContext(UserContext);
  const [services, setServices] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showExpired, setShowExpired] = useState(false);
  const [conducteurs, setConducteurs] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isNonAssuredOpen, onOpen: onNonAssuredOpen, onClose: onNonAssuredClose } = useDisclosure();
  const toast = useToast();

  // États pour la modal non-assuré
  const [nonAssuredForm, setNonAssuredForm] = useState({
    motif: '',
    notes: '',
  });

  // Motifs possibles
  const MOTIFS_NON_ASSURANCE = [
    'RETARD CR',
    'REFUS POINTAGE',
    'REFUS CNI/PERMIS',
    'ABSENCE VEHICULE',
    'ABSENCE CONDUCTEUR',
    'DROIT DE RETRAIT CONDUCTEUR',
    'GREVE NON AUTORISEE',
    'GREVE AUTORISEE'
  ];

  // Pointage form state
  const [pointageForm, setPointageForm] = useState({
    vehicleType: '',
    permisChecked: false,
    chronometerChecked: false,
    conducteurId: '', // Ajouter le conducteurId
  });

  useEffect(() => {
    fetchServices();
    fetchConducteurs();
  }, []);

  const fetchConducteurs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/conducteurs`);
      if (response.ok) {
        const data = await response.json();
        setConducteurs(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des conducteurs:', err);
    }
  };

  // Mettre à jour la date à minuit et initialiser currentDateStr
  useEffect(() => {
    const updateDateAndServices = async () => {
      // Récupérer la date de Paris depuis le serveur
      try {
        const todayResponse = await fetch(`${API_URL}/api/today`);
        const { today } = await todayResponse.json();
        setCurrentDateStr(today);
      } catch (err) {
        console.error('Erreur récupération date:', err);
      }
      // Recharger les services du nouveau jour
      fetchServices();
    };

    // Initialiser au montage
    updateDateAndServices();

    // Calculer le temps jusqu'à minuit
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timer = setTimeout(() => {
      updateDateAndServices();
      // Re-lancer le timer pour le jour suivant
      const newTimer = setInterval(updateDateAndServices, 24 * 60 * 60 * 1000);
      return () => clearInterval(newTimer);
    }, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, []);

  const getJourFonctionnement = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = dimanche, 1 = lundi, etc.
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Dimanche ou samedi
      if (dayOfWeek === 6) return "SAMEDI";
      return "DIMANCHE_FERIES";
    }
    return "SEMAINE"; // Lundi à vendredi
  };

  // Get ligne object from state by ligneId
  const getLigneById = (ligneId) => {
    return lignes.find(l => l.id === ligneId);
  };

  // Get sens object from ligne by sensId
  const getSensById = (ligneId, sensId) => {
    const ligne = getLigneById(ligneId);
    if (ligne && ligne.sens) {
      return ligne.sens.find(s => s.id === sensId);
    }
    return null;
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      
      // Obtenir la date d'aujourd'hui depuis le serveur (en heure de Paris)
      const todayResponse = await fetch(`${API_URL}/api/today`);
      const { today } = await todayResponse.json();
      
      const response = await fetch(`${API_URL}/api/lignes`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des services');

      const lignesData = await response.json();
      
      // Obtenir le jour de fonctionnement actuel
      const jourFonctionnement = getJourFonctionnement();
      
      // Aplatir la structure hiérarchique Ligne → Sens → Services
      // Stocker seulement les services avec IDs pour éviter les erreurs React #31
      // Filtrer les sens selon le jour de fonctionnement actuel
      const allServices = [];
      for (const ligne of lignesData) {
        if (ligne.sens && Array.isArray(ligne.sens)) {
          for (const sens of ligne.sens) {
            // Vérifier si le sens fonctionne aujourd'hui
            const sensFonctionneAujourdhui = !sens.jourFonctionnement || sens.jourFonctionnement === jourFonctionnement;
            if (!sensFonctionneAujourdhui) continue;
            
            if (sens.services && Array.isArray(sens.services)) {
              for (const service of sens.services) {
                allServices.push({
                  ...service,
                  ligneId: ligne.id,
                  sensId: sens.id,
                });
              }
            }
          }
        }
      }
      
      // Filtrer les services d'aujourd'hui en comparant les dates au format YYYY-MM-DD
      const todayServices = allServices.filter(s => {
        // Parse date string directly to avoid UTC conversion issues
        const serviceDate = s.date instanceof String || typeof s.date === 'string'
          ? s.date.split('T')[0]
          : new Date(s.date).toISOString().split('T')[0];
        return serviceDate === today;
      });

      setServices(todayServices.sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)));
      setLignes(lignesData);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Déterminer le statut et la couleur d'un service
  const getServiceStatus = (service) => {
    // Si le service est déjà marqué comme non-assuré
    if (service?.statut === 'Non assuré') {
      return { status: 'non-assured', label: '⚠️ Non assuré', color: 'orange', canPointage: false };
    }

    const heureDebut = typeof service === 'string' ? service : service?.heureDebut;
    if (!heureDebut) return { status: 'error', label: 'Erreur', color: 'red', canPointage: false };

    const now = new Date();
    const [hours, minutes] = heureDebut.split(':').map(Number);
    const serviceTime = new Date();
    serviceTime.setHours(hours, minutes, 0, 0);

    const timeDiff = serviceTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff >= 20) {
      return { status: 'pending', label: 'À venir', color: 'gray', canPointage: true }; // TEST: permettre pointage
    } else if (minutesDiff >= 0) {
      return { status: 'ready', label: 'À pointer', color: 'green', canPointage: true };
    } else if (minutesDiff > -60) {
      return { status: 'late', label: 'Passé', color: 'orange', canPointage: true }; // TEST: permettre pointage
    } else {
      // Services expirés peuvent encore être modifiés (retard -> absence, etc.)
      return { status: 'expired', label: 'Expiré', color: 'red', canPointage: true };
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setPointageForm({
      vehicleType: '',
      permisChecked: false,
      chronometerChecked: false,
      conducteurId: '',
    });
    onOpen();
  };

  const handlePointage = async () => {
    try {
      if (!selectedService) return;

      // Valider que le conducteurId est sélectionné
      if (!pointageForm.conducteurId) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner un conducteur',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Vérifier si la carte chrono est obligatoire et cocher le checkbox
      const ligne = getLigneById(selectedService.ligneId);
      if (ligne?.demandeChrono && !pointageForm.chronometerChecked) {
        toast({
          title: 'Erreur',
          description: 'La vérification de la carte chrono est obligatoire pour cette ligne',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Vérifier si le service a un autocar assigné
      if (selectedService.vehiculeAssigne) {
        // Chercher le type de véhicule
        try {
          const vehicleRes = await fetch(`${API_URL}/api/vehicles/${selectedService.vehiculeAssigne}`);
          if (vehicleRes.ok) {
            const vehicle = await vehicleRes.json();
            // Déterminer si c'est un autocar
            const isAutocar = vehicle.type && (
              vehicle.type.toUpperCase().includes('AUTOCAR') ||
              vehicle.type.toUpperCase().includes('TCP')
            );
            
            if (isAutocar && !pointageForm.chronometerChecked) {
              toast({
                title: 'Erreur',
                description: 'La vérification de la carte chrono est obligatoire pour un autocar',
                status: 'error',
                duration: 3000,
                isClosable: true,
              });
              return;
            }
          }
        } catch (e) {
          console.warn('Impossible de vérifier le type de véhicule:', e);
        }
      }

      // Détecter si le service est pointé en retard
      const now = new Date();
      const [hours, minutes] = selectedService.heureDebut.split(':').map(Number);
      const serviceTime = new Date();
      serviceTime.setHours(hours, minutes, 0, 0);
      const timeDiff = serviceTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      const isLate = minutesDiff < 0 && minutesDiff > -60;
      const lateMinutes = isLate ? Math.abs(Math.round(minutesDiff)) : 0;

      const pointageData = {
        serviceId: selectedService.id,
        conducteurId: pointageForm.conducteurId, // Utiliser le conducteur sélectionné du form
        validatedBy: user?.role || 'Régulateur',
        vehicleType: pointageForm.vehicleType,
        permisChecked: pointageForm.permisChecked,
        chronometerChecked: pointageForm.chronometerChecked,
        isLate,
        lateMinutes,
      };

      const response = await fetch(`${API_URL}/api/pointages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pointageData),
      });

      if (!response.ok) throw new Error('Erreur lors du pointage');

      // Toast avec notification de retard si applicable
      const toastTitle = isLate ? '⚠️ Service validé en retard' : 'Pointage enregistré';
      const ligneNum = getLigneById(selectedService.ligneId)?.numero || '?';
      const toastDesc = isLate 
        ? `Service ligne ${ligneNum} validé avec ${lateMinutes}min de retard`
        : `Service ligne ${ligneNum} validé avec succès`;

      toast({
        title: toastTitle,
        description: toastDesc,
        status: isLate ? 'warning' : 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      
      // Rafraîchir les services pour voir les mises à jour (le service passe à "Terminée")
      await fetchServices();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Marquer un service comme non-assuré
  const handleMarkNonAssured = async () => {
    try {
      if (!selectedService || !nonAssuredForm.motif) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner un motif',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/services/${selectedService.id}/non-assured`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motifNonAssurance: nonAssuredForm.motif,
          notes: nonAssuredForm.notes,
          markedBy: user?.role || 'Régulateur',
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');

      toast({
        title: 'Service marqué',
        description: `Service ligne ${getLigneById(selectedService.ligneId)?.numero} marqué comme non-assuré`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onNonAssuredClose();
      setNonAssuredForm({ motif: '', notes: '' });
      
      // Rafraîchir les services
      await fetchServices();
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Vérifier l'accès (DG et Responsable d'exploitation ont accès à tout, sinon Régulateur et Chef d'Équipe)
  const allowedRoles = ['Régulateur', 'Chef d\'Équipe', 'Responsable d\'exploitation', 'DG'];
  if (user && user.role && !allowedRoles.includes(user.role)) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert
          status="warning"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="md"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <Heading mt={4} size="lg">Accès restreint</Heading>
          <Text mt={2}>
            Seuls les Régulateurs et Chefs d'Équipe peuvent accéder à TC 360+
          </Text>
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="blue.500" />
          <Text>Chargement des services...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Titre */}
        <Box>
          <Heading as="h1" variant="pageTitle">
            <span style={{ color: 'black' }}>TC 360</span>
            <span style={{ color: '#ff8888', fontStyle: 'italic' }}>+</span>
          </Heading>
          <Text color="gray.600" textAlign="center">
            Pointage et validation des départs de services
          </Text>
        </Box>

        {/* Info pointage */}
        <Alert status="info" variant="subtle" borderRadius="md">
          <AlertIcon />
          <Box>
            <Box fontWeight="bold" mb={2}>Pointage TC 360+ - {formatDateFrLong(currentDateStr)}</Box>
            <Input
              placeholder="Rechercher une ligne, un conducteur..."
              size="sm"
              mb={2}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Box fontSize="sm">
              Les services affichés sont ceux avec départ prévu dans les 20 prochaines minutes.
              Cliquez sur un service pour le valider.
            </Box>
          </Box>
        </Alert>

        {/* Bouton afficher services expirés non assurés */}
        <Button
          onClick={() => setShowExpired(!showExpired)}
          colorScheme={showExpired ? "orange" : "blue"}
          size="sm"
          variant="outline"
        >
          {showExpired ? "Masquer" : "Afficher"} les services expirés non assurés
        </Button>

        {/* Bloc utilisateur supprimé */}

        {/* Liste des services */}
        {error && (
          <Card bg="red.100" borderColor="red.300" borderWidth="1px">
            <CardBody>
              <HStack spacing={2}>
                <Box color="red.600" fontSize="lg">
                  ⚠️
                </Box>
                <Text color="red.700">{error}</Text>
              </HStack>
            </CardBody>
          </Card>
        )}

        {services.length > 0 ? (
          <VStack spacing={8} align="stretch">
            {/* SERVICES EN ATTENTE */}
            {services.filter(s => s.statut !== 'Terminée').length > 0 && (
              <Box>
                <Heading size="md" mb={6}>
                  Services du jour ({services.filter(s => s.statut !== 'Terminée').filter(s => {
                    const status = getServiceStatus(s);
                    return showExpired || status.status !== 'expired';
                  }).length})
                </Heading>
                <VStack spacing={6} align="stretch">
                  {(() => {
                    const groupedByLine = {};
                    // Filtrer les services : exclure les expirés sauf si showExpired est true
                    services.filter(s => s.statut !== 'Terminée').filter(s => {
                      const status = getServiceStatus(s);
                      return showExpired || status.status !== 'expired';
                    }).forEach(service => {
                      const lineNum = getLigneById(service.ligneId)?.numero || '?';
                      if (!groupedByLine[lineNum]) {
                        groupedByLine[lineNum] = [];
                      }
                      groupedByLine[lineNum].push(service);
                    });

                    return Object.entries(groupedByLine).map(([lineNum, lineServices]) => (
                      <Box key={lineNum}>
                        <HStack mb={4} spacing={2}>
                          <Badge colorScheme="blue" fontSize="lg" px={4} py={2}>
                            📍 Ligne {lineNum}
                          </Badge>
                          <Text fontSize="sm" color="gray.600">
                            {lineServices.length} service{lineServices.length > 1 ? 's' : ''}
                          </Text>
                        </HStack>

                        <VStack spacing={3} align="stretch">
                          {lineServices.map((service, idx) => {
                            const serviceStatus = getServiceStatus(service);
                            const borderColor = {
                              pending: 'gray.400',
                              ready: 'green.500',
                              late: 'orange.500',
                              expired: 'red.500',
                            }[serviceStatus.status];

                            const bgColor = {
                              pending: 'gray.50',
                              ready: 'green.50',
                              late: 'orange.50',
                              expired: 'red.50',
                            }[serviceStatus.status];

                            return (
                              <Card
                                key={service.id}
                                borderTop="4px"
                                borderTopColor={borderColor}
                                bg={bgColor}
                                _hover={serviceStatus.canPointage ? { shadow: 'lg', cursor: 'pointer', transform: 'translateX(4px)' } : {}}
                                onClick={() => serviceStatus.canPointage && handleServiceSelect(service)}
                                transition="all 0.2s"
                                opacity={serviceStatus.canPointage ? 1 : 0.75}
                              >
                                <CardBody>
                                  <Grid templateColumns="repeat(4, 1fr)" gap={4} alignItems="center">
                                    {/* Horaire */}
                                    <GridItem>
                                      <VStack align="start" spacing={1}>
                                        <HStack spacing={2}>
                                          <FaClock color={borderColor} />
                                          <Box>
                                            <Text fontWeight="bold" fontSize="lg">
                                              {service.heureDebut}
                                            </Text>
                                            <Text fontSize="xs" color="gray.600">
                                              → {service.heureFin}
                                            </Text>
                                          </Box>
                                        </HStack>
                                      </VStack>
                                    </GridItem>

                                    {/* Conducteur */}
                                    <GridItem>
                                      {service.conducteur ? (
                                        <HStack spacing={2}>
                                          <FaUser color={borderColor} />
                                          <VStack align="start" spacing={0}>
                                            <Text fontWeight="bold" fontSize="sm">
                                              {service.conducteur.prenom}
                                            </Text>
                                            <Text fontSize="xs" color="gray.600">
                                              {service.conducteur.nom}
                                            </Text>
                                          </VStack>
                                        </HStack>
                                      ) : (
                                        <Text fontSize="xs" color="red.600" fontWeight="bold">
                                          ⚠️ Pas de conducteur
                                        </Text>
                                      )}
                                    </GridItem>

                                    {/* Infos supplémentaires */}
                                    <GridItem>
                                      {service.conducteur && (
                                        <VStack align="start" spacing={1}>
                                          <Text fontSize="xs" color="gray.600">
                                            Permis <strong>{service.conducteur.permis}</strong>
                                          </Text>
                                          <Badge colorScheme={service.conducteur.statut === 'Actif' ? 'green' : 'yellow'} fontSize="xs">
                                            {service.conducteur.statut}
                                          </Badge>
                                        </VStack>
                                      )}
                                    </GridItem>

                                    {/* Statut et bouton */}
                                    <GridItem>
                                      <HStack spacing={2} justify="flex-end">
                                        <Badge colorScheme={serviceStatus.color}>
                                          {serviceStatus.label}
                                        </Badge>
                                        {serviceStatus.canPointage ? (
                                          <HStack spacing={1}>
                                            <Button 
                                              colorScheme="green" 
                                              size="sm"
                                              onClick={() => {
                                                setSelectedService(service);
                                                onOpen();
                                              }}
                                            >
                                              Pointer
                                            </Button>
                                            <Button 
                                              colorScheme="orange" 
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                setSelectedService(service);
                                                onClose(); // Fermer la modale de pointage d'abord
                                                onNonAssuredOpen();
                                              }}
                                            >
                                              Non-assuré
                                            </Button>
                                          </HStack>
                                        ) : (
                                          <Button 
                                            colorScheme="orange" 
                                            size="sm"
                                            variant="ghost"
                                            isDisabled={service.statut === 'Non assuré'}
                                            onClick={() => {
                                              if (service.statut !== 'Non assuré') {
                                                setSelectedService(service);
                                                onNonAssuredOpen();
                                              }
                                            }}
                                          >
                                            Non-assuré
                                          </Button>
                                        )}
                                      </HStack>
                                    </GridItem>
                                  </Grid>
                                </CardBody>
                              </Card>
                            );
                          })}
                        </VStack>
                      </Box>
                    ));
                  })()}
                </VStack>
              </Box>
            )}

            {/* POINTAGES EFFECTUÉS ET ARCHIVÉS */}
            {services.filter(s => s.statut === 'Terminée').length > 0 && (
              <Box>
                <Divider my={6} />
                <Heading size="md" mb={6} color="gray.600">
                  ✓ Pointages effectués et archivés ({services.filter(s => s.statut === 'Terminée').length})
                </Heading>
                <VStack spacing={3} align="stretch">
                  {(() => {
                    const groupedByLine = {};
                    services.filter(s => s.statut === 'Terminée').forEach(service => {
                      const lineNum = getLigneById(service.ligneId)?.numero || '?';
                      if (!groupedByLine[lineNum]) {
                        groupedByLine[lineNum] = [];
                      }
                      groupedByLine[lineNum].push(service);
                    });

                    return Object.entries(groupedByLine).map(([lineNum, lineServices]) => (
                      <Box key={`archived-${lineNum}`}>
                        <HStack mb={2} spacing={2} opacity={0.6}>
                          <Badge colorScheme="gray" fontSize="sm" px={2} py={1}>
                            Ligne {lineNum}
                          </Badge>
                          <Text fontSize="xs" color="gray.500">
                            {lineServices.length} service{lineServices.length > 1 ? 's' : ''}
                          </Text>
                        </HStack>
                        <VStack spacing={2} align="stretch" pl={4} borderLeftColor="gray.300" borderLeftWidth="2px">
                          {lineServices.map((service) => (
                            <Card
                              key={`archived-${service.id}`}
                              bg="gray.50"
                              opacity={0.7}
                              borderRadius="md"
                            >
                              <CardBody py={2} px={3}>
                                <HStack justify="space-between" spacing={4}>
                                  <HStack spacing={3} flex={1}>
                                    <HStack spacing={1} minW="80px">
                                      <FaClock color="gray" size="12" />
                                      <Text fontSize="sm" color="gray.600" fontWeight="bold">
                                        {service.heureDebut}
                                      </Text>
                                    </HStack>
                                    {service.conducteur && (
                                      <HStack spacing={1} flex={1}>
                                        <Text fontSize="sm" color="gray.600">
                                          {service.conducteur.prenom} {service.conducteur.nom}
                                        </Text>
                                      </HStack>
                                    )}
                                  </HStack>
                                  <Badge colorScheme="gray" fontSize="xs">
                                    ✓ Pointé
                                  </Badge>
                                </HStack>
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      </Box>
                    ));
                  })()}
                </VStack>
              </Box>
            )}
          </VStack>
        ) : (
          <Card bg="gray.50">
            <CardBody textAlign="center" py={8}>
              <VStack spacing={2}>
                <Box fontSize="3xl">📭</Box>
                <Text fontWeight="bold">Aucun service prévu aujourd'hui</Text>
                <Text fontSize="sm" color="gray.600">
                  Les services générés apparaîtront ici.
                </Text>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Modal de pointage */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={2}>
                <FaCheckCircle color="green" />
                <span>Valider le pointage</span>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedService && (() => {
                const ligne = getLigneById(selectedService.ligneId);
                return (
                <VStack spacing={4} align="stretch">
                  {/* Infos du service */}
                  <Box bg="blue.50" p={4} borderRadius="md">
                    <Heading size="sm" mb={3}>Détails du service</Heading>
                    <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                      <GridItem>
                        <Text fontSize="xs" color="gray.600">Ligne</Text>
                        <Badge colorScheme="blue">{ligne?.numero}</Badge>
                      </GridItem>
                      <GridItem>
                        <Text fontSize="xs" color="gray.600">Heure départ</Text>
                        <Text fontWeight="bold">{selectedService.heureDebut}</Text>
                      </GridItem>
                      <GridItem colSpan={2}>
                        <Text fontSize="xs" color="gray.600">Ligne</Text>
                        <Text>{ligne?.nom}</Text>
                      </GridItem>
                    </Grid>
                  </Box>

                  <Divider />

                  {/* Sélection du conducteur ou Échange de service */}
                  <Box>
                    <Heading size="sm" mb={3}>
                      <HStack spacing={2}>
                        <FaUser />
                        <span>{selectedService.conducteur ? 'Échange de service' : 'Sélectionner le conducteur'}</span>
                      </HStack>
                    </Heading>
                    <VStack spacing={3}>
                      <select
                        value={pointageForm.conducteurId}
                        onChange={(e) => setPointageForm({ ...pointageForm, conducteurId: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                          fontSize: '14px',
                        }}
                      >
                        <option value="">-- Choisir un conducteur --</option>
                        {conducteurs.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.prenom} {c.nom} ({c.matricule})
                          </option>
                        ))}
                      </select>
                      
                      {/* Motif d'échange si conducteur changé */}
                      {selectedService.conducteur && pointageForm.conducteurId && pointageForm.conducteurId !== selectedService.conducteur.id && (
                        <Box w="full" bg="orange.50" p={3} borderRadius="md">
                          <FormControl>
                            <FormLabel fontSize="sm" fontWeight="bold">Motif de l'échange</FormLabel>
                            <Input
                              type="text"
                              placeholder="Ex: Échange de dernière minute, absence du conducteur, ..."
                              value={pointageForm.motifEchange || ''}
                              onChange={(e) => setPointageForm({ ...pointageForm, motifEchange: e.target.value })}
                              size="sm"
                            />
                          </FormControl>
                        </Box>
                      )}
                    </VStack>
                  </Box>

                  <Divider />

                  {/* Conducteur */}
                  {selectedService.conducteur && (
                    <Box bg="green.50" p={4} borderRadius="md">
                      <Heading size="sm" mb={3}>Conducteur assigné</Heading>
                      <VStack align="start" spacing={2}>
                        <HStack>
                          <FaUser color="green" />
                          <Box>
                            <Text fontWeight="bold">
                              {selectedService.conducteur.prenom} {selectedService.conducteur.nom}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              Matricule : {selectedService.conducteur.matricule}
                            </Text>
                          </Box>
                        </HStack>
                      </VStack>
                    </Box>
                  )}

                  <Divider />

                  {/* Vérifications */}
                  <Box>
                    <Heading size="sm" mb={3}>Vérifications</Heading>
                    <VStack align="start" spacing={3}>
                      {/* Type de véhicule */}
                      <Box>
                        <HStack spacing={2} mb={2}>
                          <FaBus />
                          <Box fontSize="sm" fontWeight="bold">Type de véhicule assigné</Box>
                        </HStack>
                        <HStack spacing={2}>
                          {ligne && JSON.parse(ligne.typesVehicules || '[]').map(type => (
                            <Button
                              key={type}
                              size="sm"
                              variant={pointageForm.vehicleType === type ? 'solid' : 'outline'}
                              colorScheme="blue"
                              onClick={() => setPointageForm({ ...pointageForm, vehicleType: type })}
                            >
                              {type}
                            </Button>
                          ))}
                        </HStack>
                      </Box>

                      {/* Permis */}
                      <Box>
                        <Checkbox
                          isChecked={pointageForm.permisChecked}
                          onChange={(e) => setPointageForm({ ...pointageForm, permisChecked: e.target.checked })}
                        >
                          <HStack spacing={2} ml={2}>
                            <FaShieldAlt color="blue" />
                            <span>
                              Permis vérifié
                              {selectedService.conducteur && ` (${selectedService.conducteur.permis})`}
                            </span>
                          </HStack>
                        </Checkbox>
                      </Box>

                      {/* Chrono/Tachograph */}
                      {ligne && (JSON.parse(ligne.typesVehicules || '[]').includes('TCP - Autocars BC/NOC/EXPRESS') || ligne?.demandeChrono) && (
                        <Box>
                          {ligne?.demandeChrono && (
                            <Alert status="warning" mb={2} borderRadius="md" fontSize="sm">
                              <AlertIcon />
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="bold">Carte chrono obligatoire</Text>
                                <Text fontSize="xs">Cette ligne nécessite la vérification de la carte chrono</Text>
                              </VStack>
                            </Alert>
                          )}
                          <Checkbox
                            isChecked={pointageForm.chronometerChecked}
                            onChange={(e) => setPointageForm({ ...pointageForm, chronometerChecked: e.target.checked })}
                            isRequired={ligne?.demandeChrono}
                          >
                            <HStack spacing={2} ml={2}>
                              <FaClock color="purple" />
                              <span>Chrono/Tachographe vérifié{ligne?.demandeChrono ? ' *' : ''}</span>
                            </HStack>
                          </Checkbox>
                        </Box>
                      )}
                    </VStack>
                  </Box>

                  <Divider />

                  {/* Résumé */}
                  <Box bg="yellow.50" p={3} borderRadius="md" fontSize="sm">
                    <Text fontWeight="bold" mb={2}>Résumé du pointage</Text>
                    <VStack align="start" spacing={1} fontSize="xs">
                      <Text>• Validé par : <strong>{user?.role || 'Régulateur'}</strong></Text>
                      <Text>• Conducteur : <strong>{selectedService.conducteur?.prenom} {selectedService.conducteur?.nom}</strong></Text>
                      <Text>• Service : <strong>Ligne {ligne?.numero} à {selectedService.heureDebut}</strong></Text>
                    </VStack>
                  </Box>
                </VStack>
              );
              })()}
            </ModalBody>
            <ModalFooter>
              <HStack spacing={2}>
                <Button variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button colorScheme="green" onClick={handlePointage}>
                  Valider le pointage
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal pour marquer comme non-assuré */}
        <Modal isOpen={isNonAssuredOpen} onClose={onNonAssuredClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={2}>
                <span>⚠️ Marquer comme non-assuré</span>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedService && (() => {
                const ligneForModal = getLigneById(selectedService.ligneId);
                return (
                <VStack spacing={4} align="stretch">
                  {/* Infos du service */}
                  <Box bg="blue.50" p={4} borderRadius="md">
                    <Text fontSize="sm" color="gray.600" mb={1}>Service</Text>
                    <HStack spacing={2}>
                      <Badge colorScheme="blue">Ligne {ligneForModal?.numero}</Badge>
                      <Text fontWeight="bold">{selectedService.heureDebut} - {selectedService.heureFin}</Text>
                    </HStack>
                  </Box>

                  <Divider />

                  {/* Motif */}
                  <Box>
                    <Text fontWeight="bold" mb={2}>Motif de non-assurance</Text>
                    <select
                      value={nonAssuredForm.motif}
                      onChange={(e) => setNonAssuredForm({ ...nonAssuredForm, motif: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        fontSize: '14px',
                      }}
                    >
                      <option value="">-- Sélectionner un motif --</option>
                      {MOTIFS_NON_ASSURANCE.map(motif => (
                        <option key={motif} value={motif}>{motif}</option>
                      ))}
                    </select>
                  </Box>

                  {/* Notes optionnelles */}
                  <Box>
                    <Text fontWeight="bold" mb={2}>Notes (optionnel)</Text>
                    <Input
                      placeholder="Ajouter des détails..."
                      value={nonAssuredForm.notes}
                      onChange={(e) => setNonAssuredForm({ ...nonAssuredForm, notes: e.target.value })}
                      size="sm"
                    />
                  </Box>

                  <Box bg="orange.50" p={3} borderRadius="md" fontSize="sm">
                    <Text fontWeight="bold" mb={1}>Conséquence :</Text>
                    <Text>Ce service sera marqué comme non-assuré et exclu des statistiques de ponctualité.</Text>
                  </Box>
                </VStack>
              );
              })()}
            </ModalBody>
            <ModalFooter>
              <HStack spacing={2}>
                <Button variant="outline" onClick={onNonAssuredClose}>
                  Annuler
                </Button>
                <Button colorScheme="orange" onClick={handleMarkNonAssured}>
                  Confirmer
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
};

export default TC360;
