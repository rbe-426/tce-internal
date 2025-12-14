import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Flex,
  Collapse,
  IconButton,
  Divider,
  Spinner,
  VStack,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { API_URL } from '../../config';

const API = API_URL;

const getStatusColor = (statut) => {
  switch (statut) {
    case 'Disponible':
      return '#e67e22';
    case 'Indisponible':
    case 'Aux Ateliers':
      return '#e74c3c';
    case 'Affecté':
      return '#7f8c8d';
    case 'Au CT':
      return '#9265ca';
    case 'Réformé':
      return '#292c3b';
    case 'Entretien':
      return '#f39c12';
    default:
      return '#7f8c8d';
  }
};

const Atelier = () => {
  const [ateliers, setAteliers] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedParc, setExpandedParc] = useState(null);

  useEffect(() => {
    fetchAteliers();
    fetchStats();
  }, []);

  const fetchAteliers = async () => {
    try {
      const response = await fetch(`${API}/api/ateliers`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setAteliers(data);
    } catch (error) {
      console.error('Erreur chargement ateliers:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API}/api/ateliers/stats`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box p={8} display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  const statuts = ['Aux Ateliers', 'Au CT', 'Indisponible', 'Entretien'];
  const vehiculesParStatut = ateliers?.parStatut || {};

  return (
    <Box>
      <Box p={8} fontFamily="Montserrat">
        {/* Titre principal */}
        <Text fontSize="3xl" fontWeight="bold" textAlign="center" mb={6}>
          Gestion des Ateliers
        </Text>

        {/* Stats par statut */}
        {stats && stats.parStatut && (
          <Flex
            direction="row"
            justify="space-around"
            align="center"
            bg="gray.100"
            p={4}
            borderRadius="md"
            mb={8}
            flexWrap="wrap"
            gap={4}
          >
            {stats.parStatut.map((stat) => (
              <Box key={stat.statut} textAlign="center">
                <Text fontWeight="bold" fontSize="lg" color={getStatusColor(stat.statut)}>
                  {stat._count.parc}
                </Text>
                <Text fontSize="sm">{stat.statut}</Text>
              </Box>
            ))}
          </Flex>
        )}

        {/* Véhicules par statut */}
        <VStack spacing={6} align="stretch">
          {statuts.map((statut) => {
            const vehicules = vehiculesParStatut[statut] || [];
            return (
              <Box key={statut}>
                <Text fontSize="2xl" fontWeight="bold" mb={4}>
                  {statut} ({vehicules.length})
                </Text>

                {vehicules.length === 0 ? (
                  <Box bg="gray.100" p={4} borderRadius="md" textAlign="center">
                    <Text color="gray.600">Aucun véhicule {statut}</Text>
                  </Box>
                ) : (
                  vehicules.map((vehicule) => (
                    <Box
                      key={vehicule.parc}
                      bg="gray.200"
                      borderRadius="md"
                      p={4}
                      mb={4}
                      borderLeft={`4px solid ${getStatusColor(vehicule.statut)}`}
                    >
                      <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                        <Box>
                          <Text><strong>Parc:</strong> {vehicule.parc}</Text>
                          <Text><strong>Type:</strong> {vehicule.type}</Text>
                          <Text><strong>Immat:</strong> {vehicule.immat}</Text>
                        </Box>
                        <Box>
                          <Text><strong>Taux santé:</strong> {vehicule.tauxSante}%</Text>
                          <Text><strong>Statut:</strong> {vehicule.statut}</Text>
                        </Box>
                        <IconButton
                          icon={expandedParc === vehicule.parc ? <ChevronUpIcon /> : <ChevronDownIcon />}
                          onClick={() => setExpandedParc(expandedParc === vehicule.parc ? null : vehicule.parc)}
                          variant="ghost"
                          aria-label="Afficher l'historique"
                        />
                      </Flex>

                      {/* Historique des mouvements */}
                      <Collapse in={expandedParc === vehicule.parc} animateOpacity>
                        <Box mt={4} bg="white" p={4} borderRadius="md" boxShadow="sm">
                          <Text fontWeight="bold" mb={3}>Mouvements récents:</Text>
                          <Divider mb={3} />
                          {vehicule.statesHistory && vehicule.statesHistory.length > 0 ? (
                            <VStack spacing={2} align="stretch">
                              {vehicule.statesHistory.map((mouvement, idx) => (
                                <Flex key={idx} align="flex-start" gap={3}>
                                  <Box
                                    bg={getStatusColor(mouvement.toStatus)}
                                    color="white"
                                    fontSize="xs"
                                    fontWeight="bold"
                                    px={2}
                                    py={1}
                                    borderRadius="md"
                                    minW="100px"
                                    textAlign="center"
                                    flexShrink={0}
                                  >
                                    {mouvement.toStatus}
                                  </Box>
                                  <Box>
                                    <Text fontSize="sm">
                                      <strong>{new Date(mouvement.changedAt).toLocaleDateString('fr-FR')}</strong>
                                      {' '}à {new Date(mouvement.changedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    {mouvement.note && (
                                      <Text fontSize="sm" color="gray.600">
                                        {mouvement.note}
                                      </Text>
                                    )}
                                  </Box>
                                </Flex>
                              ))}
                            </VStack>
                          ) : (
                            <Text fontSize="sm" color="gray.600">Pas d'historique</Text>
                          )}

                          {/* Interventions prévues */}
                          {vehicule.interventions && vehicule.interventions.length > 0 && (
                            <Box mt={4}>
                              <Divider mb={2} />
                              <Text fontWeight="bold" mb={2}>Interventions prévues:</Text>
                              <VStack spacing={2} align="stretch">
                                {vehicule.interventions.map((intervention) => (
                                  <Box key={intervention.id} bg="yellow.50" p={2} borderRadius="md">
                                    <Text fontSize="sm"><strong>{intervention.libelle}</strong></Text>
                                    {intervention.datePrevue && (
                                      <Text fontSize="sm" color="gray.600">
                                        Prévu: {new Date(intervention.datePrevue).toLocaleDateString('fr-FR')}
                                      </Text>
                                    )}
                                  </Box>
                                ))}
                              </VStack>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </Box>
                  ))
                )}
              </Box>
            );
          })}
        </VStack>

        {/* Derniers mouvements */}
        {stats && stats.derniersMouvements && stats.derniersMouvements.length > 0 && (
          <Box mt={10}>
            <Text fontSize="2xl" fontWeight="bold" mb={4}>
              Derniers mouvements sur le site
            </Text>
            <Box bg="gray.50" p={4} borderRadius="md">
              <VStack spacing={2} align="stretch">
                {stats.derniersMouvements.map((mouvement) => (
                  <Flex key={mouvement.id} align="center" gap={3} pb={2} borderBottom="1px solid #e2e8f0">
                    <Box
                      bg={getStatusColor(mouvement.toStatus)}
                      color="white"
                      fontSize="xs"
                      fontWeight="bold"
                      px={2}
                      py={1}
                      borderRadius="md"
                      minW="100px"
                      textAlign="center"
                    >
                      {mouvement.toStatus}
                    </Box>
                    <Box flex="1">
                      <Text fontSize="sm">
                        <strong>{mouvement.vehicle.parc}</strong> - {mouvement.vehicle.type}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {new Date(mouvement.changedAt).toLocaleDateString('fr-FR')} à {new Date(mouvement.changedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Box>
                  </Flex>
                ))}
              </VStack>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Atelier;
