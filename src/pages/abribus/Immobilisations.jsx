import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Container,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardBody,
  Badge,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  Select,
} from '@chakra-ui/react';
import { API_URL } from '../../config';

const Immobilisations = () => {
  const [immobilisations, setImmobilisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('APPROUVÉ');
  const toast = useToast();

  // Charger les immobilisations
  useEffect(() => {
    const fetchImmobilisations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/immobilisations?statut=${filterStatus}`);
        if (response.ok) {
          const data = await response.json();
          setImmobilisations(data.immobilisations || []);
        }
      } catch (error) {
        console.error('Erreur:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les immobilisations',
          status: 'error',
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchImmobilisations();
  }, [filterStatus, toast]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'EN_ATTENTE': return 'orange';
      case 'APPROUVÉ': return 'green';
      case 'REJETÉ': return 'red';
      case 'COMPLÉTÉ': return 'gray';
      default: return 'blue';
    }
  };

  const getStatusLabel = (statut) => {
    switch (statut) {
      case 'EN_ATTENTE': return 'En attente';
      case 'APPROUVÉ': return 'Approuvé';
      case 'REJETÉ': return 'Rejeté';
      case 'COMPLÉTÉ': return 'Complété';
      default: return statut;
    }
  };

  const getPosteLabel = (poste) => {
    switch (poste) {
      case 'SAEIV': return '🔧 SAEIV';
      case 'Atelier': return '🛠️ Atelier';
      case 'Usine': return '🏭 Usine';
      case 'Planning': return '📅 Planning';
      default: return poste;
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="blue.500" />
          <Box>Chargement des immobilisations...</Box>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Titre */}
        <Box>
          <Heading as="h1" size="lg">
            Immobilisations de véhicules
          </Heading>
        </Box>

        {/* Filtre */}
        <HStack>
          <Box>Filtrer par statut:</Box>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            maxW="300px"
          >
            <option value="EN_ATTENTE">En attente d'approbation</option>
            <option value="APPROUVÉ">Approuvées (en cours)</option>
            <option value="REJETÉ">Rejetées</option>
            <option value="COMPLÉTÉ">Complétées</option>
          </Select>
        </HStack>

        {/* Tableau */}
        {immobilisations.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            Aucune immobilisation pour ce statut
          </Alert>
        ) : (
          <Card>
            <CardBody>
              <Box overflowX="auto">
                <Table variant="striped" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Véhicule</Th>
                      <Th>Type</Th>
                      <Th>Motif</Th>
                      <Th>Demandé par</Th>
                      <Th>Poste</Th>
                      <Th>Date début</Th>
                      <Th>Date fin</Th>
                      <Th>Statut</Th>
                      <Th>Approbation</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {immobilisations.map(immo => (
                      <Tr key={immo.id}>
                        <Td fontWeight="bold">{immo.vehicleParc}</Td>
                        <Td>{immo.vehicle?.type || '-'}</Td>
                        <Td>{immo.motif}</Td>
                        <Td>
                          {immo.createdBy.nom} {immo.createdBy.prenom}
                        </Td>
                        <Td>{getPosteLabel(immo.demandeurPoste)}</Td>
                        <Td>{formatDate(immo.dateDebut)}</Td>
                        <Td>{immo.dateFin ? formatDate(immo.dateFin) : '-'}</Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(immo.statut)}>
                            {getStatusLabel(immo.statut)}
                          </Badge>
                        </Td>
                        <Td>
                          {immo.approvedBy ? (
                            <Box fontSize="sm">
                              ✓ {immo.approvedBy.nom}
                              <br />
                              <small>{formatDate(immo.dateApproved)}</small>
                            </Box>
                          ) : (
                            <Box fontSize="sm" color="orange.500">
                              En attente
                            </Box>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        )}

        {/* Légende */}
        <Card bg="gray.50">
          <CardBody>
            <Heading size="sm" mb={3}>
              Postes pouvant demander une immobilisation:
            </Heading>
            <VStack align="start" spacing={2} fontSize="sm">
              <Box>🔧 <strong>SAEIV</strong> - Demandes auto-approuvées depuis la page SAEIV</Box>
              <Box>🛠️ <strong>Atelier</strong> - Demandes à approuver par le responsable de dépôt</Box>
              <Box>🏭 <strong>Usine</strong> - Demandes à approuver par le responsable de dépôt</Box>
              <Box>📅 <strong>Planning</strong> - Demandes à approuver par le responsable de dépôt</Box>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default Immobilisations;
