import React from 'react';
import { Box, Heading, SimpleGrid, Button, Icon, Card, CardBody, VStack, HStack, Text, Badge } from '@chakra-ui/react';
import { FaCalendarAlt, FaClipboardList, FaChartBar, FaMapMarkerAlt, FaClock, FaUserTie, FaCog, FaBuilding, FaLink, FaMap, FaLock, FaTasks, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AbribusHome = () => {
  const navigate = useNavigate();

  const MARQUE_BLEU = '#053bff';
  const MARQUE_ROSE = '#fe8987';

  const boutons = [
    {
      label: 'Véhicules',
      icon: FaCalendarAlt,
      route: '/abribus/vehicules',
    },
    {
      label: 'Ateliers',
      icon: FaClipboardList,
      route: '/abribus/atelier',
    },
    {
      label: 'Statistiques',
      icon: FaChartBar,
      route: '/abribus/statistiques',
    },
    {
      label: 'Gestion des Lignes',
      icon: FaMapMarkerAlt,
      route: '/abribus/lignes-hierarchie',
    },
    {
      label: 'Gestion des Plannings',
      icon: FaClock,
      route: '/abribus/plannings',
    },
    {
      label: 'Gestion des Conducteurs',
      icon: FaUserTie,
      route: '/abribus/conducteurs',
    },
    {
      label: 'Gestion SAEIV',
      icon: FaCog,
      route: '/abribus/saeiv',
    },
    {
      label: 'Immobilisations',
      icon: FaLock,
      route: '/abribus/immobilisations',
    },
    {
      label: 'Établissements & Dépôts',
      icon: FaBuilding,
      route: '/abribus/etablissements',
    },
    {
      label: 'Affecter Lignes',
      icon: FaLink,
      route: '/abribus/affecter-lignes',
    },
    {
      label: 'Campagnes de Mercatos',
      icon: FaMap,
      route: '/abribus/campagnes-mercatos',
    },
  ];

  return (
    <Box bg="white" minH="80vh" p={10}>
      <Heading textAlign="center" mb={12} fontSize="3xl">
        Accueil ABRIBUS
      </Heading>

      {/* Carte Campagnes ABRIBUS - En avant */}
      <Box maxW="1200px" mx="auto" mb={12}>
        <Card
          bg={`linear-gradient(135deg, ${MARQUE_BLEU} 0%, #0525cc 100%)`}
          borderRadius="xl"
          boxShadow="0 10px 30px rgba(5, 59, 255, 0.3)"
          overflow="hidden"
          transition="all 0.3s ease"
          _hover={{
            boxShadow: '0 15px 40px rgba(5, 59, 255, 0.4)',
            transform: 'translateY(-4px)',
          }}
          cursor="pointer"
          onClick={() => navigate('/abribus/campagnes-abribus')}
        >
          <CardBody p={8}>
            <HStack justify="space-between" align="flex-start" spacing={6}>
              <VStack align="flex-start" spacing={4} flex={1}>
                <HStack spacing={3}>
                  <Icon as={FaTasks} boxSize={10} color={MARQUE_ROSE} />
                  <VStack align="flex-start" spacing={1}>
                    <Heading color="white" fontSize="2xl">
                      Campagnes ABRIBUS
                    </Heading>
                    <Badge bg={MARQUE_ROSE} color="white" px={3} py={1} fontSize="xs" fontWeight="bold">
                      ⭐ Accès rapide
                    </Badge>
                  </VStack>
                </HStack>
                
                <Text color="white" fontSize="md" opacity={0.95}>
                  Gérez les campagnes d'entretien, de vérification et de programmation d'atelier pour votre flotte
                </Text>
                
                <HStack spacing={4} pt={4}>
                  <Box>
                    <Text color={MARQUE_ROSE} fontWeight="bold" fontSize="lg">0</Text>
                    <Text color="white" fontSize="xs" opacity={0.8}>Campagnes actives</Text>
                  </Box>
                  <Box>
                    <Text color={MARQUE_ROSE} fontWeight="bold" fontSize="lg">0%</Text>
                    <Text color="white" fontSize="xs" opacity={0.8}>Progression</Text>
                  </Box>
                  <Box>
                    <Text color={MARQUE_ROSE} fontWeight="bold" fontSize="lg">0</Text>
                    <Text color="white" fontSize="xs" opacity={0.8}>En retard</Text>
                  </Box>
                </HStack>
              </VStack>
              
              <VStack align="center" justify="center" spacing={3}>
                <Icon as={FaArrowRight} boxSize={8} color={MARQUE_ROSE} opacity={0.7} />
                <Button
                  bg="white"
                  color={MARQUE_BLEU}
                  fontWeight="bold"
                  _hover={{
                    bg: MARQUE_ROSE,
                    color: 'white',
                  }}
                  onClick={() => navigate('/abribus/campagnes-abribus')}
                  size="lg"
                >
                  Accéder
                </Button>
              </VStack>
            </HStack>
          </CardBody>
        </Card>
      </Box>

      {/* Autres cartes */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={10} maxW="1200px" mx="auto">
        {boutons.map((btn) => (
          <Button
            key={btn.label}
            onClick={() => navigate(btn.route)}
            leftIcon={<Icon as={btn.icon} boxSize={6} />}
            height="120px"
            fontSize="xl"
            variant="outline"
            borderWidth={2}
            borderColor="gray.700"
            color="gray.800"
            _hover={{
              bg: 'gray.800',
              color: 'white',
              borderColor: 'gray.800',
            }}
            flexDirection="column"
            justifyContent="center"
          >
            {btn.label}
          </Button>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default AbribusHome;
