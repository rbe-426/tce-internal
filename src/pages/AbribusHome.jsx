import React, { useState, useEffect } from 'react';
import { Box, Heading, SimpleGrid, Button, Icon, Card, CardBody, VStack, HStack, Text, Badge, Image } from '@chakra-ui/react';
import { FaCalendarAlt, FaClipboardList, FaChartBar, FaMapMarkerAlt, FaClock, FaUserTie, FaCog, FaBuilding, FaLink, FaMap, FaLock, FaTasks, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import iconeVehicules from '../assets/icons/icone_abvehicules.png';

const AbribusHome = () => {
  const navigate = useNavigate();
  const [campaignsStats, setCampaignsStats] = useState({
    active: 0,
    progress: 0,
    delayed: 0
  });

  useEffect(() => {
    loadCampaignsStats();
  }, []);

  const loadCampaignsStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/campagnes-abribus`);
      if (!response.ok) throw new Error('Erreur chargement campagnes');
      
      const campagnes = await response.json();
      
      // Compter les campagnes actives
      const activeCampaigns = campagnes.filter(c => c.statut === 'EN_COURS').length;
      
      // Calculer la progression moyenne
      let totalProgress = 0;
      let progressCount = 0;
      
      for (const campagne of campagnes) {
        if (campagne.statut === 'EN_COURS') {
          const verifications = campagne._count?.verifications || 0;
          const total = verifications + 5; // Estimation: 5 buses par campagne
          const progress = total > 0 ? Math.round((verifications / total) * 100) : 0;
          totalProgress += progress;
          progressCount++;
        }
      }
      
      const avgProgress = progressCount > 0 ? Math.round(totalProgress / progressCount) : 0;
      
      setCampaignsStats({
        active: activeCampaigns,
        progress: avgProgress,
        delayed: 0 // À implémenter selon votre logique
      });
    } catch (err) {
      console.error('Erreur chargement stats campagnes:', err);
    }
  };

  const MARQUE_BLEU = '#053bff';
  const MARQUE_ROSE = '#ff8887';

  const boutons = [
    {
      label: 'Véhicules',
      icon: null,
      image: iconeVehicules,
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
                    <Text color={MARQUE_ROSE} fontWeight="bold" fontSize="lg">{campaignsStats.active}</Text>
                    <Text color="white" fontSize="xs" opacity={0.8}>Campagnes actives</Text>
                  </Box>
                  <Box>
                    <Text color={MARQUE_ROSE} fontWeight="bold" fontSize="lg">{campaignsStats.progress}%</Text>
                    <Text color="white" fontSize="xs" opacity={0.8}>Progression</Text>
                  </Box>
                  <Box>
                    <Text color={MARQUE_ROSE} fontWeight="bold" fontSize="lg">{campaignsStats.delayed}</Text>
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
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6} maxW="1200px" mx="auto">
        {boutons.map((btn) => (
          <Card
            key={btn.label}
            bg={`linear-gradient(135deg, ${MARQUE_BLEU} 0%, #0525cc 100%)`}
            borderColor={MARQUE_BLEU}
            borderWidth="1px"
            cursor="pointer"
            onClick={() => navigate(btn.route)}
            transition="all 0.3s ease"
            _hover={{
              boxShadow: `0 8px 20px rgba(5, 59, 255, 0.3)`,
              borderColor: '#ffffff',
              transform: 'translateY(-2px)',
            }}
          >
            {btn.image ? (
              <CardBody p={0} display="flex" alignItems="stretch" minH="140px">
                {/* Colonne gauche - Icône */}
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  p={4}
                  flex="0 0 auto"
                  minW="140px"
                >
                  <Image src={btn.image} alt={btn.label} boxSize="120px" objectFit="contain" />
                </Box>
                {/* Colonne droite - Texte */}
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  p={6}
                  flex="1"
                >
                  <Heading size="lg" color="white" mb={1}>
                    {btn.label}
                  </Heading>
                  <Text fontSize="sm" color="white" fontStyle="italic" opacity={0.85}>
                    Gestionnaire du parc
                  </Text>
                </Box>
              </CardBody>
            ) : (
              <CardBody p={6} display="flex" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" minH="140px">
                <Icon as={btn.icon} boxSize={8} color="white" mb={3} />
                <Heading size="md" color="white">{btn.label}</Heading>
              </CardBody>
            )}
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default AbribusHome;
