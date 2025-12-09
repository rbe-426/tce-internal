import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Spinner,
  Text,
  VStack,
  HStack,
  Progress,
  Badge,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { FaCarAlt, FaCheckCircle, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import TC360Stats from './TC360Stats';
import { API_URL } from '../../config';

const API = API_URL;

const Statistiques = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/api/vehicles`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des véhicules');
      
      const vehicles = await response.json();
      
      // Calculer les statistiques
      const totalVehicles = vehicles.length;
      const available = vehicles.filter(v => v.statut === 'Disponible').length;
      const inMaintenance = vehicles.filter(v => v.statut === 'En maintenance').length;
      const unavailable = vehicles.filter(v => v.statut === 'Indisponible').length;
      
      // Moyennes d'état
      const avgEtat = vehicles.length > 0 
        ? Math.round(vehicles.reduce((sum, v) => sum + (v.etatTechnique || 0), 0) / vehicles.length)
        : 0;
      const avgProprete = vehicles.length > 0
        ? Math.round(vehicles.reduce((sum, v) => sum + (v.proprete || 0), 0) / vehicles.length)
        : 0;
      const avgInterieur = vehicles.length > 0
        ? Math.round(vehicles.reduce((sum, v) => sum + (v.etatInterieur || 0), 0) / vehicles.length)
        : 0;

      // Véhicules PMR
      const pmrVehicles = vehicles.filter(v => v.pmr).length;

      setStats({
        totalVehicles,
        available,
        inMaintenance,
        unavailable,
        avgEtat,
        avgProprete,
        avgInterieur,
        pmrVehicles,
        percentAvailable: Math.round((available / totalVehicles) * 100) || 0,
        percentMaintenance: Math.round((inMaintenance / totalVehicles) * 100) || 0,
      });
      
      setError(null);
    } catch (err) {
      console.error('Erreur statistiques:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="80vh">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxW="container.lg" py={8}>
        <Box bg="red.100" p={4} borderRadius="md">
          <Text color="red.700">Erreur : {error}</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Titre général */}
        <Box>
          <Heading as="h1" size="2xl" mb={2}>
            Statistiques TC Outil
          </Heading>
          <Text fontSize="md" color="gray.600">
            Aperçu complet des opérations - Voyages TC Essonnes
          </Text>
        </Box>

        {/* Tabs pour les deux sections */}
        <Tabs variant="enclosed">
          <TabList>
            <Tab>📦 Parc Véhicules</Tab>
            <Tab>🎯 TC 360+ Pointages</Tab>
          </TabList>

          <TabPanels>
            {/* TAB 1 : PARC VEHICULES */}
            <TabPanel>
              <VStack spacing={8} align="stretch" pt={6}>
                {/* Statistiques principales */}
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                  <Card>
                    <CardBody>
                      <Stat>
                        <HStack justify="space-between">
                          <VStack align="start">
                            <StatLabel>Total Véhicules</StatLabel>
                            <StatNumber fontSize="2xl">{stats.totalVehicles}</StatNumber>
                          </VStack>
                          <Box fontSize="2xl" color="blue.500">
                            <FaCarAlt />
                          </Box>
                        </HStack>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <Stat>
                        <HStack justify="space-between">
                          <VStack align="start">
                            <StatLabel>Disponibles</StatLabel>
                            <StatNumber fontSize="2xl" color="green.600">{stats.available}</StatNumber>
                            <StatHelpText>{stats.percentAvailable}%</StatHelpText>
                          </VStack>
                          <Box fontSize="2xl" color="green.500">
                            <FaCheckCircle />
                          </Box>
                        </HStack>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <Stat>
                        <HStack justify="space-between">
                          <VStack align="start">
                            <StatLabel>En Maintenance</StatLabel>
                            <StatNumber fontSize="2xl" color="orange.600">{stats.inMaintenance}</StatNumber>
                            <StatHelpText>{stats.percentMaintenance}%</StatHelpText>
                          </VStack>
                          <Box fontSize="2xl" color="orange.500">
                            <FaClock />
                          </Box>
                        </HStack>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <Stat>
                        <HStack justify="space-between">
                          <VStack align="start">
                            <StatLabel>Indisponibles</StatLabel>
                            <StatNumber fontSize="2xl" color="red.600">{stats.unavailable}</StatNumber>
                            <StatHelpText>Non opérationnels</StatHelpText>
                          </VStack>
                          <Box fontSize="2xl" color="red.500">
                            <FaExclamationTriangle />
                          </Box>
                        </HStack>
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* États moyens */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                  <Card>
                    <CardBody>
                      <VStack align="start" spacing={4}>
                        <Heading size="sm">État Technique Moyen</Heading>
                        <HStack w="full" justify="space-between">
                          <Text fontSize="3xl" fontWeight="bold">{stats.avgEtat}%</Text>
                          <Badge colorScheme={stats.avgEtat >= 80 ? 'green' : stats.avgEtat >= 60 ? 'yellow' : 'red'}>
                            {stats.avgEtat >= 80 ? 'Bon' : stats.avgEtat >= 60 ? 'Moyen' : 'Faible'}
                          </Badge>
                        </HStack>
                        <Progress value={stats.avgEtat} w="full" colorScheme={stats.avgEtat >= 80 ? 'green' : 'orange'} />
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <VStack align="start" spacing={4}>
                        <Heading size="sm">Propreté Moyenne</Heading>
                        <HStack w="full" justify="space-between">
                          <Text fontSize="3xl" fontWeight="bold">{stats.avgProprete}%</Text>
                          <Badge colorScheme={stats.avgProprete >= 80 ? 'green' : stats.avgProprete >= 60 ? 'yellow' : 'red'}>
                            {stats.avgProprete >= 80 ? 'Excellent' : stats.avgProprete >= 60 ? 'Bon' : 'À améliorer'}
                          </Badge>
                        </HStack>
                        <Progress value={stats.avgProprete} w="full" colorScheme={stats.avgProprete >= 80 ? 'green' : 'orange'} />
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <VStack align="start" spacing={4}>
                        <Heading size="sm">État Intérieur Moyen</Heading>
                        <HStack w="full" justify="space-between">
                          <Text fontSize="3xl" fontWeight="bold">{stats.avgInterieur}%</Text>
                          <Badge colorScheme={stats.avgInterieur >= 80 ? 'green' : stats.avgInterieur >= 60 ? 'yellow' : 'red'}>
                            {stats.avgInterieur >= 80 ? 'Excellent' : stats.avgInterieur >= 60 ? 'Bon' : 'À améliorer'}
                          </Badge>
                        </HStack>
                        <Progress value={stats.avgInterieur} w="full" colorScheme={stats.avgInterieur >= 80 ? 'green' : 'orange'} />
                      </VStack>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Accessibilité */}
                <Card bg="blue.50" borderColor="blue.200" borderWidth="2px">
                  <CardBody>
                    <HStack justify="space-between">
                      <VStack align="start">
                        <Heading size="md">Véhicules PMR (Accessibles)</Heading>
                        <Text color="gray.600">Véhicules adaptés pour personnes à mobilité réduite</Text>
                      </VStack>
                      <Badge colorScheme="blue" fontSize="lg" p={2}>
                        {stats.pmrVehicles} véhicules
                      </Badge>
                    </HStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* TAB 2 : TC 360+ POINTAGES */}
            <TabPanel>
              <TC360Stats />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default Statistiques;
