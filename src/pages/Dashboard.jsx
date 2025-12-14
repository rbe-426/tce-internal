import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  Flex,
  Icon,
  VStack,
  HStack,
  Badge,
  Spinner,
  useToast,
  SimpleGrid,
} from '@chakra-ui/react';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import {
  FaBus,
  FaUser,
  FaCalendarAlt,
  FaChartBar,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowRight,
} from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const toast = useToast();

  const [stats, setStats] = useState({
    totalServices: 0,
    servicesPlanned: 0,
    servicesCompleted: 0,
    totalConductors: 0,
    totalVehicles: 0,
    todayServices: 0,
    todayCompleted: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      // Récupérer la date d'aujourd'hui
      const todayRes = await fetch(`${API_URL}/api/today`);
      const { today } = await todayRes.json();

      // Récupérer les services
      const servicesRes = await fetch(`${API_URL}/api/services`);
      const services = await servicesRes.json();

      // Récupérer les conducteurs
      const conductorsRes = await fetch(`${API_URL}/api/conducteurs`);
      const conductors = await conductorsRes.json();

      // Récupérer les véhicules
      const vehiclesRes = await fetch(`${API_URL}/api/vehicles`);
      const vehicles = await vehiclesRes.json();

      // Filtrer les services d'aujourd'hui
      const todayServicesData = services.filter(s => {
        // Parse date string directly to avoid UTC conversion issues
        const serviceDate = s.date instanceof String || typeof s.date === 'string' 
          ? s.date.split('T')[0]
          : new Date(s.date).toISOString().split('T')[0];
        return serviceDate === today;
      });

      const todayCompletedCount = todayServicesData.filter(s => s.statut === 'Terminée').length;

      setStats({
        totalServices: services.length,
        servicesPlanned: services.filter(s => s.statut === 'Planifiée').length,
        servicesCompleted: services.filter(s => s.statut === 'Terminée').length,
        totalConductors: conductors.length,
        totalVehicles: vehicles.length,
        todayServices: todayServicesData.length,
        todayCompleted: todayCompletedCount,
      });
    } catch (error) {
      console.error('Erreur récupération stats:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les statistiques',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const quickAccessModules = [
    {
      title: 'TC360+',
      description: 'Gestion des pointages',
      icon: FaCheckCircle,
      color: 'green',
      path: '/tc360',
      roles: ['Régulateur', 'Chef d\'Équipe', 'Responsable d\'exploitation', 'DG'],
    },
    {
      title: 'Plannings',
      description: 'Planifier les conducteurs',
      icon: FaCalendarAlt,
      color: 'blue',
      path: '/abribus/plannings',
      roles: ['Responsable d\'exploitation', 'DG'],
    },
    {
      title: 'Véhicules',
      description: 'Gestion de la flotte',
      icon: FaBus,
      color: 'orange',
      path: '/abribus/vehicules',
      roles: ['Responsable d\'exploitation', 'DG'],
    },
    {
      title: 'Conducteurs',
      description: 'Gestion des équipes',
      icon: FaUser,
      color: 'purple',
      path: '/abribus/conducteurs',
      roles: ['Responsable d\'exploitation', 'DG'],
    },
    {
      title: 'Lignes',
      description: 'Gestion des lignes de transport',
      icon: FaBus,
      color: 'cyan',
      path: '/abribus/lignes-hierarchie',
      roles: ['Responsable d\'exploitation', 'DG'],
    },
    {
      title: 'Statistiques',
      description: 'Rapports et analytics',
      icon: FaChartBar,
      color: 'red',
      path: '/abribus/statistiques',
      roles: ['Responsable d\'exploitation', 'DG', 'Régulateur'],
    },
  ];

  // Filtrer les modules selon le rôle de l'utilisateur
  const userRole = user?.role || '';
  const accessibleModules = quickAccessModules.filter(m => m.roles.includes(userRole));

  if (loading) {
    return (
      <Box p={6} display="flex" justifyContent="center" alignItems="center" minH="500px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text fontSize="lg" color="gray.600">
            Chargement du tableau de bord...
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6} bg="gray.50" minH="100vh">
      <VStack spacing={8} align="stretch">
        {/* En-tête */}
        <Box>
          <Heading size="lg" mb={2}>
            Bienvenue, {user?.prenom} {user?.nom?.toUpperCase()} !
          </Heading>
          <Text color="gray.600" fontSize="md">
            Tableau de bord - {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </Box>

        {/* Statistiques principales */}
        <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
          {/* Services d'aujourd'hui */}
          <Card bg="white" shadow="sm" borderTop="4px" borderTopColor="green.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.600" mb={2}>
                  <HStack spacing={2}>
                    <Icon as={FaClock} />
                    <Text>Services aujourd'hui</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="2xl" color="green.600">
                  {stats.todayServices}
                </StatNumber>
                <StatHelpText>
                  {stats.todayCompleted} complétés
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Services planifiés */}
          <Card bg="white" shadow="sm" borderTop="4px" borderTopColor="blue.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.600" mb={2}>
                  <HStack spacing={2}>
                    <Icon as={FaCalendarAlt} />
                    <Text>Services planifiés</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="2xl" color="blue.600">
                  {stats.servicesPlanned}
                </StatNumber>
                <StatHelpText>
                  Total: {stats.totalServices}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Conducteurs */}
          <Card bg="white" shadow="sm" borderTop="4px" borderTopColor="purple.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.600" mb={2}>
                  <HStack spacing={2}>
                    <Icon as={FaUser} />
                    <Text>Conducteurs actifs</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="2xl" color="purple.600">
                  {stats.totalConductors}
                </StatNumber>
                <StatHelpText>
                  Équipe disponible
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          {/* Véhicules */}
          <Card bg="white" shadow="sm" borderTop="4px" borderTopColor="orange.500">
            <CardBody>
              <Stat>
                <StatLabel color="gray.600" mb={2}>
                  <HStack spacing={2}>
                    <Icon as={FaBus} />
                    <Text>Véhicules disponibles</Text>
                  </HStack>
                </StatLabel>
                <StatNumber fontSize="2xl" color="orange.600">
                  {stats.totalVehicles}
                </StatNumber>
                <StatHelpText>
                  Flotte totale
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Accès rapide */}
        <Box>
          <Heading size="md" mb={4}>
            <HStack spacing={2}>
              <Icon as={FaArrowRight} color="gray.400" />
              <Text>Accès rapide</Text>
            </HStack>
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {accessibleModules.map((module) => (
              <Card
                key={module.path}
                bg="white"
                shadow="sm"
                _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
                cursor="pointer"
                onClick={() => navigate(module.path)}
              >
                <CardHeader pb={2}>
                  <HStack spacing={3} align="start">
                    <Icon
                      as={module.icon}
                      fontSize="2xl"
                      color={`${module.color}.500`}
                    />
                    <VStack align="start" spacing={0}>
                      <Heading size="sm">{module.title}</Heading>
                      <Text fontSize="xs" color="gray.500">
                        {module.description}
                      </Text>
                    </VStack>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Button
                    size="sm"
                    colorScheme={module.color}
                    variant="ghost"
                    rightIcon={<FaArrowRight />}
                    width="100%"
                  >
                    Accéder
                  </Button>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>

        {/* Informations de l'utilisateur */}
        <Card bg="blue.50" border="1px solid" borderColor="blue.200">
          <CardHeader>
            <Heading size="sm" color="blue.700">
              Informations de profil
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack align="start" spacing={2} fontSize="sm">
              <HStack spacing={4}>
                <Box>
                  <Text fontWeight="bold">Nom:</Text>
                  <Text color="gray.600">{user?.nom}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Prénom:</Text>
                  <Text color="gray.600">{user?.prenom}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Rôle:</Text>
                  <Badge colorScheme="blue">{user?.role || 'N/A'}</Badge>
                </Box>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default Dashboard;