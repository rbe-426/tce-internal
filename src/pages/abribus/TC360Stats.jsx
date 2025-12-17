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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Input,
  Flex,
} from '@chakra-ui/react';
import {
  FaCheckCircle,
  FaClipboardList,
  FaUser,
  FaClock,
  FaBus,
  FaShieldAlt,
  FaTrophy,
  FaChartBar,
} from 'react-icons/fa';
import { API_URL } from '../../config';

const API = API_URL;

const TC360Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    fetchStats();
  }, [selectedDate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const url = `${API}/api/pointages/stats/daily?date=${selectedDate}`;
      console.log('[TC360Stats] Fetching:', url);
      
      const response = await fetch(url);
      if (!response.ok)
        throw new Error('Erreur lors de la récupération des statistiques');

      const data = await response.json();
      console.log('[TC360Stats] Data received:', data);
      
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Erreur stats TC360:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="60vh">
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

  if (!stats) return null;

  // Déterminer la couleur du taux de validation
  const getValidationColor = (rate) => {
    if (rate >= 90) return 'green';
    if (rate >= 70) return 'yellow';
    return 'red';
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Titre et sélection de date */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <VStack align="start" spacing={1}>
              <Heading as="h1" size="2xl">
                TC 360+ - Statistiques Pointages
              </Heading>
              <Text fontSize="md" color="gray.600">
                Validation des départs de services
              </Text>
            </VStack>
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={2}>
                Sélectionner une date
              </Text>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                width="180px"
              />
            </Box>
          </HStack>
        </Box>

        {/* Statistiques principales */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Card borderTop="4px solid" borderTopColor="blue.500">
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <VStack align="start">
                    <StatLabel>Services du jour</StatLabel>
                    <StatNumber fontSize="2xl">{stats.totalServices}</StatNumber>
                    <StatHelpText>Services planifiés</StatHelpText>
                  </VStack>
                  <Box fontSize="2xl" color="blue.500">
                    <FaClipboardList />
                  </Box>
                </HStack>
              </Stat>
            </CardBody>
          </Card>

          <Card borderTop="4px solid" borderTopColor="green.500">
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <VStack align="start">
                    <StatLabel>Services pointés</StatLabel>
                    <StatNumber fontSize="2xl" color="green.600">
                      {stats.totalPointages}
                    </StatNumber>
                    <StatHelpText>Validations effectuées</StatHelpText>
                  </VStack>
                  <Box fontSize="2xl" color="green.500">
                    <FaCheckCircle />
                  </Box>
                </HStack>
              </Stat>
            </CardBody>
          </Card>

          <Card borderTop="4px solid" borderTopColor="purple.500">
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <VStack align="start">
                    <StatLabel>Taux de validation</StatLabel>
                    <HStack spacing={2}>
                      <StatNumber fontSize="2xl">
                        {stats.validationRate}%
                      </StatNumber>
                      <Badge
                        colorScheme={getValidationColor(stats.validationRate)}
                        fontSize="md"
                      >
                        {stats.validationRate >= 90
                          ? 'Excellent'
                          : stats.validationRate >= 70
                          ? 'Bon'
                          : 'À améliorer'}
                      </Badge>
                    </HStack>
                  </VStack>
                  <Box fontSize="2xl" color="purple.500">
                    <FaChartBar />
                  </Box>
                </HStack>
              </Stat>
              <Progress
                value={stats.validationRate}
                mt={3}
                colorScheme={getValidationColor(stats.validationRate)}
              />
            </CardBody>
          </Card>

          <Card borderTop="4px solid" borderTopColor="orange.500">
            <CardBody>
              <Stat>
                <HStack justify="space-between">
                  <VStack align="start">
                    <StatLabel>Conducteurs actifs</StatLabel>
                    <StatNumber fontSize="2xl" color="orange.600">
                      {Object.keys(stats.conductorStats).length}
                    </StatNumber>
                    <StatHelpText>Pointés aujourd'hui</StatHelpText>
                  </VStack>
                  <Box fontSize="2xl" color="orange.500">
                    <FaUser />
                  </Box>
                </HStack>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Taux de vérification */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Card bg="cyan.50" borderColor="cyan.200" borderWidth="2px">
            <CardBody>
              <VStack align="start" spacing={4}>
                <HStack>
                  <Box fontSize="xl" color="cyan.600">
                    <FaShieldAlt />
                  </Box>
                  <Heading size="sm">Vérification des Permis</Heading>
                </HStack>
                <HStack w="full" justify="space-between">
                  <Text fontSize="2xl" fontWeight="bold">
                    {stats.avgPermisCheckRate}%
                  </Text>
                  <Badge colorScheme={stats.avgPermisCheckRate >= 80 ? 'green' : 'orange'}>
                    {stats.avgPermisCheckRate >= 80 ? 'Complet' : 'Partiel'}
                  </Badge>
                </HStack>
                <Progress
                  value={stats.avgPermisCheckRate}
                  w="full"
                  colorScheme={stats.avgPermisCheckRate >= 80 ? 'green' : 'orange'}
                />
                <Text fontSize="xs" color="gray.600">
                  Vérifications du permis effectuées parmi tous les pointages
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg="teal.50" borderColor="teal.200" borderWidth="2px">
            <CardBody>
              <VStack align="start" spacing={4}>
                <HStack>
                  <Box fontSize="xl" color="teal.600">
                    <FaClock />
                  </Box>
                  <Heading size="sm">Vérification Chrono/Tachographe</Heading>
                </HStack>
                <HStack w="full" justify="space-between">
                  <Text fontSize="2xl" fontWeight="bold">
                    {stats.avgTachographCheckRate}%
                  </Text>
                  <Badge colorScheme={stats.avgTachographCheckRate >= 80 ? 'green' : 'orange'}>
                    {stats.avgTachographCheckRate >= 80 ? 'Complet' : 'Partiel'}
                  </Badge>
                </HStack>
                <Progress
                  value={stats.avgTachographCheckRate}
                  w="full"
                  colorScheme={stats.avgTachographCheckRate >= 80 ? 'green' : 'orange'}
                />
                <Text fontSize="xs" color="gray.600">
                  Vérifications du tachographe (véhicules autocars)
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Services non assurés */}
        {stats.nonAssuuredStats && (
          <Card bg="red.50" borderColor="red.200" borderWidth="2px">
            <CardBody>
              <VStack align="start" spacing={4}>
                <HStack>
                  <Box fontSize="xl" color="red.600">
                    ⚠️
                  </Box>
                  <Heading size="sm">Services Non Assurés</Heading>
                </HStack>
                
                <HStack w="full" justify="space-between" bg="white" p={3} borderRadius="md">
                  <Text fontWeight="bold">Total non assuré(s):</Text>
                  <Badge colorScheme={stats.nonAssuuredStats.total > 0 ? 'red' : 'gray'} fontSize="lg">
                    {stats.nonAssuuredStats.total}
                  </Badge>
                </HStack>

                {stats.nonAssuuredStats.total > 0 && (
                  <SimpleGrid columns={{ base: 2, md: 5 }} spacing={2} w="full">
                    {Object.entries(stats.nonAssuuredStats.byReason || {}).map(([reason, count]) => (
                      <Box key={reason} p={3} bg="white" borderRadius="md" borderLeft="3px solid red.400">
                        <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1}>
                          {reason}
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color="red.600">
                          {count}
                        </Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}

                {stats.expiredServices > 0 && (
                  <Box bg="orange.50" p={3} borderRadius="md" borderLeft="3px solid orange.400" w="full">
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="bold">Pointages expirés (mode manuel):</Text>
                      <Badge colorScheme="orange">{stats.expiredServices}</Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.600" mt={2}>
                      Assureur/Régulateur à mettre les motifs manuellement
                    </Text>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Top conducteurs */}
        {stats.topConductors && stats.topConductors.length > 0 && (
          <Card bg="green.50" borderColor="green.200" borderWidth="2px">
            <CardBody>
              <HStack mb={4}>
                <Box fontSize="xl" color="green.600">
                  <FaTrophy />
                </Box>
                <Heading size="md">Top 5 Conducteurs</Heading>
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
                {stats.topConductors.map((conductor, idx) => (
                  <Box key={conductor.id} p={4} bg="white" borderRadius="md" borderLeft="4px solid green.500">
                    <Text fontSize="sm" fontWeight="bold" color="green.600">
                      #{idx + 1}
                    </Text>
                    <Text fontWeight="bold" fontSize="md" mt={1}>
                      {conductor.prenom} {conductor.nom}
                    </Text>
                    <Badge colorScheme="green" mt={2} mb={2}>
                      {conductor.pointages} pointages
                    </Badge>
                    <Text fontSize="xs" color="gray.600">
                      Permis: {conductor.permisChecked}/{conductor.pointages}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>
        )}

        {/* Distribution horaire */}
        {stats.hourlyDistribution && Object.keys(stats.hourlyDistribution).length > 0 && (
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>
                <HStack>
                  <Box color="blue.500">
                    <FaClock />
                  </Box>
                  <span>Distribution des Pointages par Heure de Départ</span>
                </HStack>
              </Heading>
              <Table size="sm">
                <Thead>
                  <Tr bg="gray.100">
                    <Th>Heure de départ</Th>
                    <Th isNumeric>Services planifiés</Th>
                    <Th isNumeric>Services pointés</Th>
                    <Th isNumeric>Taux (%)</Th>
                    <Th>Progression</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {Object.entries(stats.hourlyDistribution)
                    .sort(([hourA], [hourB]) => hourA.localeCompare(hourB))
                    .map(([hour, data]) => {
                      const rate = data.total > 0 ? Math.round((data.validated / data.total) * 100) : 0;
                      return (
                        <Tr key={hour}>
                          <Td fontWeight="bold">{hour}:00</Td>
                          <Td isNumeric>{data.total}</Td>
                          <Td isNumeric>{data.validated}</Td>
                          <Td isNumeric>
                            <Badge colorScheme={rate >= 80 ? 'green' : rate >= 60 ? 'yellow' : 'red'}>
                              {rate}%
                            </Badge>
                          </Td>
                          <Td>
                            <Progress value={rate} size="sm" colorScheme={rate >= 80 ? 'green' : 'yellow'} />
                          </Td>
                        </Tr>
                      );
                    })}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        )}

        {/* Types de véhicules */}
        {stats.vehicleTypes && Object.keys(stats.vehicleTypes).length > 0 && (
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>
                <HStack>
                  <Box color="blue.500">
                    <FaBus />
                  </Box>
                  <span>Pointages par Type de Véhicule</span>
                </HStack>
              </Heading>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                {Object.entries(stats.vehicleTypes)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <Card key={type} bg="blue.50" borderColor="blue.200" borderWidth="1px">
                      <CardBody>
                        <Text fontSize="sm" color="gray.600" mb={2}>
                          {type}
                        </Text>
                        <HStack justify="space-between">
                          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                            {count}
                          </Text>
                          <Badge colorScheme="blue">{Math.round((count / stats.totalPointages) * 100)}%</Badge>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
              </SimpleGrid>
            </CardBody>
          </Card>
        )}

        {/* Lignes/Routes */}
        {stats.lineStats && stats.lineStats.length > 0 && (
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>
                <HStack>
                  <Box color="purple.500">
                    <FaClipboardList />
                  </Box>
                  <span>Top Lignes/Routes</span>
                </HStack>
              </Heading>
              <Table size="sm">
                <Thead>
                  <Tr bg="gray.100">
                    <Th>Ligne/Route</Th>
                    <Th isNumeric>Pointages</Th>
                    <Th isNumeric>% du total</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {stats.lineStats.slice(0, 10).map((line) => (
                    <Tr key={line.numero}>
                      <Td fontWeight="bold">
                        <Badge colorScheme="purple" mr={2}>
                          {line.numero}
                        </Badge>
                      </Td>
                      <Td isNumeric>{line.pointages}</Td>
                      <Td isNumeric>
                        {Math.round((line.pointages / stats.totalPointages) * 100)}%
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        )}

        {/* Validateurs */}
        {stats.validatedByStats && Object.keys(stats.validatedByStats).length > 0 && (
          <Card bg="indigo.50" borderColor="indigo.200" borderWidth="2px">
            <CardBody>
              <Heading size="md" mb={4}>
                <HStack>
                  <Box color="indigo.600">
                    <FaShieldAlt />
                  </Box>
                  <span>Pointages par Rôle de Validateur</span>
                </HStack>
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {Object.entries(stats.validatedByStats).map(([role, count]) => (
                  <HStack
                    key={role}
                    p={4}
                    bg="white"
                    borderRadius="md"
                    borderLeft="4px solid indigo.500"
                    justify="space-between"
                  >
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" color="gray.600">
                        {role}
                      </Text>
                      <Text fontSize="lg" fontWeight="bold">
                        {count} pointages
                      </Text>
                    </VStack>
                    <Badge colorScheme="indigo" fontSize="md">
                      {Math.round((count / stats.totalPointages) * 100)}%
                    </Badge>
                  </HStack>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>
        )}

        {/* Résumé détaillé des conducteurs */}
        {stats.conductorStats && stats.conductorStats.length > 0 && (
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>
                <HStack>
                  <Box color="teal.500">
                    <FaUser />
                  </Box>
                  <span>Détails par Conducteur</span>
                </HStack>
              </Heading>
              <Box overflowX="auto">
                <Table size="sm">
                  <Thead>
                    <Tr bg="gray.100">
                      <Th>Conducteur</Th>
                      <Th isNumeric>Pointages</Th>
                      <Th isNumeric>Permis ✓</Th>
                      <Th isNumeric>Chrono ✓</Th>
                      <Th isNumeric>% Permis</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {stats.conductorStats
                      .sort((a, b) => b.pointages - a.pointages)
                      .map((conductor) => {
                        const permisRate = conductor.pointages > 0
                          ? Math.round((conductor.permisChecked / conductor.pointages) * 100)
                          : 0;
                        return (
                          <Tr key={conductor.id}>
                            <Td fontWeight="bold">
                              {conductor.prenom} {conductor.nom}
                            </Td>
                            <Td isNumeric>
                              <Badge colorScheme="blue">{conductor.pointages}</Badge>
                            </Td>
                            <Td isNumeric>
                              <Badge colorScheme={conductor.permisChecked > 0 ? 'green' : 'gray'}>
                                {conductor.permisChecked}
                              </Badge>
                            </Td>
                            <Td isNumeric>
                              <Badge colorScheme={conductor.chronometerChecked > 0 ? 'green' : 'gray'}>
                                {conductor.chronometerChecked}
                              </Badge>
                            </Td>
                            <Td isNumeric>
                              <Badge colorScheme={permisRate >= 80 ? 'green' : permisRate >= 50 ? 'yellow' : 'red'}>
                                {permisRate}%
                              </Badge>
                            </Td>
                          </Tr>
                        );
                      })}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Container>
  );
};

export default TC360Stats;
