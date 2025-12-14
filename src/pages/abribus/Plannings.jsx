import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Container,
  VStack,
  HStack,
  Button,
  Card,
  CardBody,
  Badge,
  useToast,
  Text,
  SimpleGrid,
  Select,
  Divider,
  Grid,
  GridItem,
  Spinner,
  FormControl,
  FormLabel,
  CheckboxGroup,
  Checkbox,
  Stack,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, ChevronLeftIcon, ChevronRightIcon, WarningIcon } from '@chakra-ui/icons';
import { FaCalendarAlt, FaClock } from 'react-icons/fa';
import { formatDateFr, formatDateFrLong, getFullDayNameFr, getMonthNameFr, getDayNameFr } from '../../utils/dateFormat';

// Règlementations du transport en commun
const REGLEMENTATIONS = {
  dureeMaxService: 10, // heures
  pauseMinimale: 0.5, // heures (30 min)
  heuresMaxParSemaine: 44,
  heuresMinParService: 3,
};

import { API_URL } from '../../config';

const PlanningsCalendar = () => {
  const [services, setServices] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [conducteurs, setConducteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedConstraints, setSelectedConstraints] = useState([]);
  const [availableConstraints, setAvailableConstraints] = useState([]);
  const [isDegradedMode, setIsDegradedMode] = useState(false);
  const [systemDateError, setSystemDateError] = useState(null);
  const { isOpen: isCalendarOpen, onOpen: onCalendarOpen, onClose: onCalendarClose } = useDisclosure();
  const toast = useToast();

  // Vérifier la synchronisation date système ↔ navigateur
  useEffect(() => {
    const checkSystemDate = async () => {
      try {
        // Récupérer la date du serveur
        const response = await fetch(`${API_URL}/api/server-time`);
        if (!response.ok) throw new Error('Impossible de récupérer l\'heure serveur');
        
        const { timestamp } = await response.json();
        const serverDate = new Date(timestamp);
        const browserDate = new Date();
        
        // Calculer la différence (en millisecondes)
        const diff = Math.abs(serverDate.getTime() - browserDate.getTime());
        const diffMinutes = Math.floor(diff / (1000 * 60));
        
        // Si plus de 5 minutes de différence: mode dégradé
        if (diffMinutes > 5) {
          setIsDegradedMode(true);
          setSystemDateError(`Écart détecté: ${diffMinutes} minutes. Synchronisez votre poste de travail.`);
        } else {
          setIsDegradedMode(false);
          setSystemDateError(null);
          // Mettre à jour la date avec celle du serveur pour être sûr
          setSelectedDate(serverDate.toISOString().split('T')[0]);
        }
      } catch (error) {
        console.error('[SYNC DATE] Erreur:', error);
        // En cas d'erreur, utiliser la date du navigateur
        setSelectedDate(new Date().toISOString().split('T')[0]);
      }
    };

    checkSystemDate();
    
    // Vérifier chaque heure
    const interval = setInterval(checkSystemDate, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Charger les données depuis le serveur
  useEffect(() => {
    fetchData();
  }, []);

  // Mettre à jour la date chaque jour à minuit
  useEffect(() => {
    const updateDateAtMidnight = () => {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    };

    // Calculer le temps jusqu'à minuit
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timer = setTimeout(() => {
      updateDateAtMidnight();
      // Re-lancer le timer pour le jour suivant
      const newTimer = setInterval(updateDateAtMidnight, 24 * 60 * 60 * 1000);
      return () => clearInterval(newTimer);
    }, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, []);

  const fetchData = async () => {
    try {
      const [lignesRes, conducteursRes] = await Promise.all([
        fetch(`${API_URL}/api/lignes`),
        fetch(`${API_URL}/api/conducteurs`),
      ]);

      if (!lignesRes.ok || !conducteursRes.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const lignesData = await lignesRes.json();
      const conducteursData = await conducteursRes.json();

      setConducteurs(conducteursData.filter(c => c.statut === 'Actif'));

      // Initialiser les calendriers manquants
      try {
        await fetch(`${API_URL}/api/lignes/init-calendars`, { method: 'POST' });
      } catch (e) {
        // Silencieux si non disponible
      }
      setConducteurs(conducteursData.filter(c => c.statut === 'Actif'));

      // Extract all unique constraints from all lignes
      const constraintsSet = new Set();
      lignesData.forEach(ligne => {
        if (ligne.contraintes) {
          try {
            const contrs = JSON.parse(ligne.contraintes);
            if (Array.isArray(contrs)) {
              contrs.forEach(c => constraintsSet.add(c));
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      });
      setAvailableConstraints(Array.from(constraintsSet).sort());

      // Aplatir la structure hiérarchique Ligne → Sens → Services
      const flatServices = [];
      for (const ligne of lignesData) {
        if (ligne.sens && Array.isArray(ligne.sens)) {
          for (const sens of ligne.sens) {
            if (sens.services && Array.isArray(sens.services)) {
              for (const service of sens.services) {
                flatServices.push({
                  ...service,
                  ligne,
                  sens,
                });
              }
            }
          }
        }
      }
      setServices(flatServices);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Générer les 7 jours centrés sur la date sélectionnée
  const getWeekDays = () => {
    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay();
    // Obtenir le lundi de la semaine (0=dimanche, donc lundi=1)
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(selectedDateObj);
    monday.setDate(selectedDateObj.getDate() - daysToMonday);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  // Get all days in month for calendar view (based on selectedDate)
  const getDaysInMonth = () => {
    const selectedDateObj = new Date(selectedDate);
    const year = selectedDateObj.getFullYear();
    const month = selectedDateObj.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  // Check if a ligne matches current filter (only constraints now)
  const ligneMatchesFilter = (ligne) => {
    // If no filters selected, show all
    if (selectedConstraints.length === 0) {
      return true;
    }

    // Check constraints filter
    try {
      const contrs = ligne.contraintes ? JSON.parse(ligne.contraintes) : [];
      // Line must have at least ONE of the selected constraints
      const hasConstraint = selectedConstraints.some(c => contrs.includes(c));
      if (!hasConstraint) {
        return false;
      }
    } catch (e) {
      // If parsing fails, include it
    }

    return true;
  };

  // Filter services based on selected date and ligne filters
  const getFilteredServices = () => {
    const weekDays = getWeekDays();
    return services.filter(s => {
      // Parse date directly without timezone conversion
      // If s.date is "2025-12-15T00:00:00Z", extract just the date part
      const serviceDate = s.date instanceof String || typeof s.date === 'string' 
        ? s.date.split('T')[0]
        : new Date(s.date).toISOString().split('T')[0];
      
      if (!weekDays.includes(serviceDate)) return false;
      
      // Vérifier les contraintes
      if (!ligneMatchesFilter(s.ligne)) return false;
      
      // Vérifier le calendrier d'exploitation de la ligne
      if (s.ligne.calendrierJson) {
        try {
          const calendrier = JSON.parse(s.ligne.calendrierJson);
          
          // Utiliser Intl pour obtenir le jour de la semaine en heure Paris (comme le backend)
          const formatter = new Intl.DateTimeFormat('fr-FR', { 
            timeZone: 'Europe/Paris',
            weekday: 'long'
          });
          const dayNameFr = formatter.format(new Date(s.date)).toLowerCase();
          
          // Mapping des jours
          const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
          const dayName = dayNames.includes(dayNameFr) ? dayNameFr : null;
          
          // Vérifier si la ligne fonctionne ce jour-là
          if (!dayName || !calendrier[dayName]) {
            return false; // La ligne ne fonctionne pas ce jour
          }
        } catch (e) {
          // Si le parsing échoue, exclure le service
          console.warn('Erreur parsing calendrier pour service:', s.id, e);
          return false;
        }
      }
      
      return true;
    });
  };

  // Navigate to previous month
  const previousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  // Navigate to next month
  const nextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  // Select a date from calendar
  const selectDateFromCalendar = (date) => {
    setSelectedDate(date.toISOString().split('T')[0]);
    onCalendarClose();
  };

  // Générer les services recommandés pour une ligne
  // Vérifier si un conducteur peut être assigné à un service (amplitude 12h, pas de double service)
  const canAssignConductor = (serviceId, conducteurId) => {
    if (!conducteurId) return true; // Pas de restriction pour désassigner

    const serviceActuel = services.find(s => s.id === serviceId);
    if (!serviceActuel) return false;

    // Récupérer tous les services du conducteur (indépendamment de la ligne)
    const servicesduConducteur = services.filter(s => s.conducteurId === conducteurId && s.id !== serviceId);

    const [hDebut, mDebut] = serviceActuel.heureDebut.split(':').map(Number);
    const [hFin, mFin] = serviceActuel.heureFin.split(':').map(Number);
    const minutesDebut = hDebut * 60 + mDebut;
    const minutesFin = hFin * 60 + mFin;

    for (const service of servicesduConducteur) {
      const [hDService, mDService] = service.heureDebut.split(':').map(Number);
      const [hFService, mFService] = service.heureFin.split(':').map(Number);
      const minutesDDebut = hDService * 60 + mDService;
      const minutesDFin = hFService * 60 + mFService;

      // Vérifier chevauchement direct : même jour ET horaires qui se chevauchent
      const serviceDate = new Date(serviceActuel.date).toISOString().split('T')[0];
      const otherDate = new Date(service.date).toISOString().split('T')[0];
      
      if (serviceDate === otherDate) {
        // Même jour : vérifier qu'il n'y a pas de chevauchement
        const chevauchement = !(minutesFin <= minutesDDebut || minutesDebut >= minutesDFin);
        if (chevauchement) {
          return false; // Chevauchement direct
        }
        
        // Aussi vérifier amplitude 12h le même jour
        const timeBetweenEnd = minutesDDebut - minutesFin;
        const timeBetweenStart = minutesDebut - minutesDFin;
        
        if ((timeBetweenEnd >= 0 && timeBetweenEnd < 720) || (timeBetweenStart >= 0 && timeBetweenStart < 720)) {
          return false; // Moins de 12h entre les services
        }
      }
    }
    return true;
  };

  const assignerConducteur = async (serviceId, conducteurId) => {
    try {
      // Utiliser le nouvel endpoint /api/services-hierarchie
      const response = await fetch(`${API_URL}/api/services-hierarchie/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conducteurId: conducteurId || null }),
      });

      if (response.ok) {
        toast({
          title: 'Succès',
          description: 'Conducteur assigné avec succès',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
        // Rafraîchir les lignes pour synchroniser avec le serveur
        await fetchData();
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le service',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const supprimerService = async (serviceId) => {
    try {
      // Utiliser le nouvel endpoint /api/services-hierarchie
      const response = await fetch(`${API_URL}/api/services-hierarchie/${serviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setServices(services.filter(s => s.id !== serviceId));
        toast({
          title: 'Service supprimé',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le service',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getConducteurName = (conducteurId) => {
    const c = conducteurs.find(cond => cond.id === conducteurId);
    return c ? `${c.prenom} ${c.nom}` : 'Non assigné';
  };

  const getConducteurStatut = (conducteurId) => {
    const c = conducteurs.find(cond => cond.id === conducteurId);
    return c ? c.statut : null;
  };

  const servicesJour = getFilteredServices();

  const calculerDureeService = (depart, fin) => {
    const [hD, mD] = depart.split(':').map(Number);
    const [hF, mF] = fin.split(':').map(Number);
    return ((hF - hD) + (mF - mD) / 60).toFixed(1);
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="blue.500" />
          <Box>Chargement des plannings...</Box>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Alerte mode dégradé */}
        {isDegradedMode && (
          <Alert
            status="error"
            variant="left-accent"
            flexDirection="column"
            alignItems="flex-start"
            borderRadius="md"
          >
            <HStack align="start" w="full">
              <WarningIcon boxSize="5" />
              <Box flex="1">
                <AlertTitle>Mode dégradé - Synchronisation date/heure requise</AlertTitle>
                <Text fontSize="sm" mt={2}>
                  ⚠️ {systemDateError}
                </Text>
                <Text fontSize="xs" color="gray.600" mt={2}>
                  Vous ne pouvez effectuer aucune action tant que la date et l'heure de votre poste de travail ne sont pas à jour.
                </Text>
              </Box>
            </HStack>
          </Alert>
        )}

        {/* Titre */}
        <Box>
          <Heading as="h1" size="2xl" mb={2}>
            Gestion des Plannings
          </Heading>
          <Text color="gray.600">
            Générez et organisez les services selon les règlementations du transport en commun
          </Text>
        </Box>

        {/* Sélection de la date et filtres */}
        <Card>
          <CardBody>
            <VStack align="start" spacing={4}>
              <HStack justify="space-between" w="full">
                <Box>
                  <FormLabel fontWeight="bold" mb={1}>Date sélectionnée</FormLabel>
                  <Text fontSize="lg" fontWeight="bold" color="blue.600">
                    {formatDateFrLong(selectedDate)}
                  </Text>
                </Box>
                <Button
                  leftIcon={<FaCalendarAlt />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={onCalendarOpen}
                >
                  Ouvrir calendrier
                </Button>
              </HStack>

              {/* Filtres */}
              <Divider />
              <Box w="full">
                <FormControl mb={4}>
                  <FormLabel fontWeight="bold" fontSize="sm">📅 Plannings de cette semaine</FormLabel>
                  <HStack spacing={1}>
                    {getWeekDays().map((day, idx) => {
                      const dayDate = new Date(day);
                      const isSelected = day === selectedDate;
                      const dayOfWeek = dayDate.getDay();
                      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
                      
                      return (
                        <Button
                          key={day}
                          size="sm"
                          variant={isSelected ? 'solid' : 'outline'}
                          colorScheme={isSelected ? 'blue' : 'gray'}
                          onClick={() => setSelectedDate(day)}
                          isDisabled={isDegradedMode}
                          title={isDegradedMode ? 'Mode dégradé: synchronisez votre date/heure' : formatDateFrLong(day)}
                        >
                          <VStack spacing={0}>
                            <Text fontSize="xs">{dayNames[dayOfWeek]}</Text>
                            <Text fontSize="xs" fontWeight="bold">{dayDate.getDate()}</Text>
                          </VStack>
                        </Button>
                      );
                    })}
                  </HStack>
                </FormControl>

                {availableConstraints.length > 0 && (
                  <FormControl>
                    <FormLabel fontWeight="bold" fontSize="sm">⚠️ Filtrer par contraintes</FormLabel>
                    <CheckboxGroup value={selectedConstraints} onChange={setSelectedConstraints}>
                      <Stack spacing={2}>
                        {availableConstraints.map((constraint) => (
                          <Checkbox key={constraint} value={constraint}>
                            {constraint}
                          </Checkbox>
                        ))}
                      </Stack>
                    </CheckboxGroup>
                  </FormControl>
                )}
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Modal - Calendrier du mois */}
        <Modal isOpen={isCalendarOpen} onClose={onCalendarClose} size="md">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack justify="space-between" align="center">
                <IconButton
                  icon={<ChevronLeftIcon />}
                  onClick={previousMonth}
                  variant="ghost"
                  size="sm"
                />
                <Text fontSize="lg" fontWeight="bold" minW="200px" textAlign="center">
                  {getMonthNameFr(selectedDate)} {new Date(selectedDate).getFullYear()}
                </Text>
                <IconButton
                  icon={<ChevronRightIcon />}
                  onClick={nextMonth}
                  variant="ghost"
                  size="sm"
                />
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={3}>
                {/* Days of week header */}
                <Grid templateColumns="repeat(7, 1fr)" gap={1} w="full">
                  {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                    <Box key={day} textAlign="center" fontWeight="bold" fontSize="sm">
                      {day}
                    </Box>
                  ))}
                </Grid>

                {/* Calendar days */}
                <Grid templateColumns="repeat(7, 1fr)" gap={1} w="full">
                  {getDaysInMonth().map((date, idx) => {
                    if (!date) {
                      return <Box key={`empty-${idx}`} />;
                    }
                    const dateStr = date.toISOString().split('T')[0];
                    const isSelected = dateStr === selectedDate;
                    const isToday = dateStr === new Date().toISOString().split('T')[0];

                    return (
                      <Button
                        key={dateStr}
                        size="sm"
                        variant={isSelected ? 'solid' : 'outline'}
                        colorScheme={isSelected ? 'blue' : isToday ? 'green' : 'gray'}
                        onClick={() => selectDateFromCalendar(date)}
                        w="full"
                      >
                        {date.getDate()}
                      </Button>
                    );
                  })}
                </Grid>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Génération de services */}
        <Card bg="blue.50">
          <CardBody>
            <VStack align="start" spacing={4}>
              <Heading size="md">ℹ️ Services depuis la Gestion des Lignes</Heading>
              <Text fontSize="sm" color="gray.600">
                Les services s'affichent automatiquement ici une fois créés depuis <strong>Gestion des Lignes → Sens → Services</strong>
              </Text>
              <Badge colorScheme="blue">
                {services.length} service(s) total au passage
              </Badge>
            </VStack>
          </CardBody>
        </Card>

        {/* Services du jour */}
        <Box>
          <Heading size="md" mb={4}>Services du {formatDateFr(selectedDate)}</Heading>
          {servicesJour.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {servicesJour.map(service => (
                <Card key={`${service.id}-${service.date}`} borderLeft="4px" borderLeftColor="blue.500">
                  <CardBody>
                    <VStack align="start" spacing={3}>
                      <HStack justify="space-between" w="full">
                        <VStack align="start" spacing={0}>
                          <Badge colorScheme="blue" fontSize="md">
                            Ligne {service.ligne?.numero || '?'}
                          </Badge>
                          {service.sens && (
                            <Badge colorScheme="green" fontSize="xs" mt={1}>
                              📍 {service.sens.nom}
                            </Badge>
                          )}
                        </VStack>
                        <Button
                          size="xs"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => supprimerService(service.id)}
                          isDisabled={isDegradedMode}
                          title={isDegradedMode ? 'Mode dégradé: synchronisez votre date/heure' : 'Supprimer le service'}
                        >
                          <DeleteIcon />
                        </Button>
                      </HStack>

                      <Box>
                        <HStack spacing={2} fontSize="sm">
                          <FaClock />
                          <Text fontWeight="bold">
                            {service.heureDebut} - {service.heureFin}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color="gray.600">
                          Durée : {calculerDureeService(service.heureDebut, service.heureFin)}h
                        </Text>
                        {service.sens?.direction && (
                          <Text fontSize="xs" color="gray.600" mt={1}>
                            {service.sens.direction}
                          </Text>
                        )}
                      </Box>

                      <Divider />

                      <Box w="full">
                        <Text fontSize="sm" color="gray.600" mb={2}>Assigner un conducteur</Text>
                        <Select
                          size="sm"
                          placeholder="-- Sélectionner --"
                          value={service.conducteurId || ''}
                          onChange={(e) => assignerConducteur(service.id, e.target.value || null)}
                          isDisabled={isDegradedMode}
                        >
                          {conducteurs.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.prenom} {c.nom}
                            </option>
                          ))}
                        </Select>
                      </Box>

                      {service.conducteurId && (
                        <Box w="full" bg="green.50" p={2} borderRadius="md">
                          <Text fontSize="sm" fontWeight="bold" color="green.700">
                            ✓ {getConducteurName(service.conducteurId)}
                          </Text>
                          <Badge colorScheme={getConducteurStatut(service.conducteurId) === 'Actif' ? 'green' : 'yellow'} fontSize="xs">
                            {getConducteurStatut(service.conducteurId)}
                          </Badge>
                        </Box>
                      )}

                      <Box w="full" bg="gray.100" p={2} borderRadius="md" fontSize="xs">
                        <Text color="gray.600">Statut : <strong>{service.statut}</strong></Text>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            <Card bg="gray.50">
              <CardBody textAlign="center">
                <Text color="gray.500">Aucun service pour cette date. Créez-en depuis la Gestion des Lignes.</Text>
              </CardBody>
            </Card>
          )}
        </Box>

        {/* Informations réglementaires */}
        <Card bg="yellow.50" borderLeft="4px" borderLeftColor="yellow.500" mt={6}>
          <CardBody>
            <Heading size="sm" mb={4} color="orange.700">📋 Règlementations du transport en commun</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} fontSize="sm">
              <Box p={2} bg="white" borderRadius="md" border="1px solid orange.200">
                <Text><strong>Durée max/service :</strong> {REGLEMENTATIONS.dureeMaxService}h</Text>
              </Box>
              <Box p={2} bg="white" borderRadius="md" border="1px solid orange.200">
                <Text><strong>Pause minimale :</strong> {REGLEMENTATIONS.pauseMinimale * 60}min</Text>
              </Box>
              <Box p={2} bg="white" borderRadius="md" border="1px solid orange.200">
                <Text><strong>Heures max/semaine :</strong> {REGLEMENTATIONS.heuresMaxParSemaine}h</Text>
              </Box>
              <Box p={2} bg="white" borderRadius="md" border="1px solid orange.200">
                <Text><strong>Durée min/service :</strong> {REGLEMENTATIONS.heuresMinParService}h</Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Statistiques */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card>
            <CardBody>
              <VStack align="start">
                <Text fontWeight="bold">Services générés</Text>
                <Heading size="lg">{servicesJour.length}</Heading>
              </VStack>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <VStack align="start">
                <Text fontWeight="bold">Services assignés</Text>
                <Heading size="lg" color="green.600">
                  {servicesJour.filter(s => s.conducteurId).length}
                </Heading>
              </VStack>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <VStack align="start">
                <Text fontWeight="bold">À assigner</Text>
                <Heading size="lg" color="orange.600">
                  {servicesJour.filter(s => !s.conducteurId).length}
                </Heading>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Container>
  );
};

export default PlanningsCalendar;
