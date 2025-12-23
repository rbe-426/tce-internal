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
  Button,
  Input,
  Textarea,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, AddIcon } from '@chakra-ui/icons';
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

const AtelierManager = () => {
  const [ateliers, setAteliers] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedParc, setExpandedParc] = useState(null);
  const [selectedVehicleParc, setSelectedVehicleParc] = useState(null);
  const [showInterventionForm, setShowInterventionForm] = useState(false);
  const [interventionData, setInterventionData] = useState({
    libelle: '',
    datePrevue: '',
    commentaire: '',
  });
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const [statusTransition, setStatusTransition] = useState(null);
  const [transitionComment, setTransitionComment] = useState('');

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

  const handleChangeStatus = async (parc, newStatus, comment) => {
    try {
      const r = await fetch(`${API}/api/vehicles/${parc}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatus }),
      });
      if (!r.ok) throw new Error(await r.text());
      
      // Ajouter à l'historique avec commentaire
      await fetch(`${API}/api/vehicles/${parc}/state-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus: newStatus, note: comment }),
      });
      
      // Recharger
      await fetchAteliers();
      await fetchStats();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleAddIntervention = async (parc) => {
    if (!interventionData.libelle) {
      alert('Le libellé de l\'intervention est obligatoire');
      return;
    }
    try {
      const r = await fetch(`${API}/api/vehicles/${parc}/interventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interventionData),
      });
      if (!r.ok) throw new Error(await r.text());
      
      setInterventionData({ libelle: '', datePrevue: '', commentaire: '' });
      setShowInterventionForm(false);
      await fetchAteliers();
      await fetchStats();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleCompleteIntervention = async (parc, interventionId) => {
    try {
      const r = await fetch(`${API}/api/vehicles/${parc}/interventions/${interventionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'Complétée', dateEffective: new Date().toISOString() }),
      });
      if (!r.ok) throw new Error(await r.text());
      
      await fetchAteliers();
      await fetchStats();
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const openStatusModal = (parc, targetStatus) => {
    setSelectedVehicleParc(parc);
    setStatusTransition(targetStatus);
    setTransitionComment('');
    onModalOpen();
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
                          aria-label="Afficher les détails"
                        />
                      </Flex>

                      {/* Détails et actions */}
                      <Collapse in={expandedParc === vehicule.parc} animateOpacity>
                        <Box mt={4} bg="white" p={4} borderRadius="md" boxShadow="sm">
                          {/* Transitions de statut */}
                          <Box mb={4}>
                            <Text fontWeight="bold" mb={2}>Mouvements disponibles:</Text>
                            <HStack spacing={2} flexWrap="wrap">
                              {statut === 'Aux Ateliers' && (
                                <>
                                  <Button
                                    size="sm"
                                    colorScheme="blue"
                                    onClick={() => openStatusModal(vehicule.parc, 'Indisponible')}
                                  >
                                    → Indisponible
                                  </Button>
                                  <Button
                                    size="sm"
                                    colorScheme="purple"
                                    onClick={() => openStatusModal(vehicule.parc, 'Affecté')}
                                  >
                                    → Affecté
                                  </Button>
                                </>
                              )}
                              {statut === 'Indisponible' && (
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() => openStatusModal(vehicule.parc, 'Disponible')}
                                >
                                  → Disponible
                                </Button>
                              )}
                              {statut === 'Affecté' && (
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() => openStatusModal(vehicule.parc, 'Disponible')}
                                >
                                  → Disponible
                                </Button>
                              )}
                            </HStack>
                          </Box>

                          <Divider mb={4} />

                          {/* Historique des mouvements */}
                          <Box mb={4}>
                            <Text fontWeight="bold" mb={3}>Mouvements récents:</Text>
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
                          </Box>

                          <Divider mb={4} />

                          {/* Interventions */}
                          <Box mb={4}>
                            <Flex justify="space-between" align="center" mb={2}>
                              <Text fontWeight="bold">Interventions:</Text>
                              <Button
                                size="xs"
                                leftIcon={<AddIcon />}
                                colorScheme="green"
                                onClick={() => {
                                  setSelectedVehicleParc(vehicule.parc);
                                  setShowInterventionForm(!showInterventionForm);
                                }}
                              >
                                Ajouter
                              </Button>
                            </Flex>

                            {/* Formulaire ajout intervention */}
                            {showInterventionForm && selectedVehicleParc === vehicule.parc && (
                              <Box bg="green.50" p={3} borderRadius="md" mb={3}>
                                <Input
                                  placeholder="Libellé de l'intervention"
                                  size="sm"
                                  mb={2}
                                  value={interventionData.libelle}
                                  onChange={(e) =>
                                    setInterventionData({ ...interventionData, libelle: e.target.value })
                                  }
                                />
                                <Input
                                  type="date"
                                  size="sm"
                                  mb={2}
                                  value={interventionData.datePrevue}
                                  onChange={(e) =>
                                    setInterventionData({ ...interventionData, datePrevue: e.target.value })
                                  }
                                />
                                <Textarea
                                  placeholder="Commentaires (optionnel)"
                                  size="sm"
                                  mb={2}
                                  value={interventionData.commentaire}
                                  onChange={(e) =>
                                    setInterventionData({ ...interventionData, commentaire: e.target.value })
                                  }
                                />
                                <HStack spacing={2}>
                                  <Button
                                    size="xs"
                                    colorScheme="green"
                                    onClick={() => handleAddIntervention(vehicule.parc)}
                                  >
                                    Ajouter
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => setShowInterventionForm(false)}
                                  >
                                    Annuler
                                  </Button>
                                </HStack>
                              </Box>
                            )}

                            {/* Liste interventions */}
                            {vehicule.interventions && vehicule.interventions.length > 0 ? (
                              <VStack spacing={2} align="stretch">
                                {vehicule.interventions.map((intervention) => (
                                  <Box
                                    key={intervention.id}
                                    bg={intervention.statut === 'Complétée' ? 'green.50' : 'yellow.50'}
                                    p={2}
                                    borderRadius="md"
                                  >
                                    <Flex justify="space-between" align="center">
                                      <Box flex="1">
                                        <Text fontSize="sm">
                                          <strong>{intervention.libelle}</strong>
                                        </Text>
                                        {intervention.datePrevue && (
                                          <Text fontSize="xs" color="gray.600">
                                            Prévu: {new Date(intervention.datePrevue).toLocaleDateString('fr-FR')}
                                          </Text>
                                        )}
                                        {intervention.commentaire && (
                                          <Text fontSize="xs" color="gray.600">
                                            {intervention.commentaire}
                                          </Text>
                                        )}
                                        <Text fontSize="xs" fontWeight="bold" color={intervention.statut === 'Complétée' ? 'green.600' : 'orange.600'}>
                                          {intervention.statut}
                                        </Text>
                                      </Box>
                                      {intervention.statut !== 'Complétée' && (
                                        <Button
                                          size="xs"
                                          colorScheme="green"
                                          onClick={() =>
                                            handleCompleteIntervention(vehicule.parc, intervention.id)
                                          }
                                        >
                                          ✓
                                        </Button>
                                      )}
                                    </Flex>
                                  </Box>
                                ))}
                              </VStack>
                            ) : (
                              <Text fontSize="sm" color="gray.600">Aucune intervention</Text>
                            )}
                          </Box>
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
                        {new Date(mouvement.changedAt).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(mouvement.changedAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </Box>
                  </Flex>
                ))}
              </VStack>
            </Box>
          </Box>
        )}
      </Box>

      {/* Modal pour transition de statut avec commentaire */}
      <Modal isOpen={isModalOpen} onClose={onModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transition de statut</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Passer le véhicule <strong>{selectedVehicleParc}</strong> à{' '}
              <strong>{statusTransition}</strong>
            </Text>
            <Textarea
              placeholder="Ajouter un commentaire (optionnel)"
              value={transitionComment}
              onChange={(e) => setTransitionComment(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onModalClose}>
              Annuler
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => {
                handleChangeStatus(selectedVehicleParc, statusTransition, transitionComment);
                onModalClose();
              }}
            >
              Confirmer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AtelierManager;
