import React from 'react';
import { Box, Heading, SimpleGrid, Button, Icon } from '@chakra-ui/react';
import { FaCalendarAlt, FaClipboardList, FaChartBar, FaMapMarkerAlt, FaClock, FaUserTie, FaCog, FaBuilding, FaLink } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AbribusHome = () => {
  const navigate = useNavigate();

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
      label: 'Établissements & Dépôts',
      icon: FaBuilding,
      route: '/abribus/etablissements',
    },
    {
      label: 'Affecter Lignes',
      icon: FaLink,
      route: '/abribus/affecter-lignes',
    },
  ];

  return (
    <Box bg="white" minH="80vh" p={10}>
      <Heading textAlign="center" mb={12} fontSize="3xl">
        Accueil ABRIBUS
      </Heading>

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
