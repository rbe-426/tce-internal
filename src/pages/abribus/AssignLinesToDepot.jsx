import { useState, useEffect } from 'react';
import { Box, Button, Table, Thead, Tbody, Tr, Th, Td, Select, HStack, Alert, AlertIcon, Spinner, Heading, SimpleGrid, Badge } from '@chakra-ui/react';
import { API_URL } from '../../config';

export default function AssignLinesToDepot() {
  const [lines, setLines] = useState([]);
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({ total: 0, assigned: 0, unassigned: 0 });

  // Charger les lignes et dépôts
  useEffect(() => {
    const fetch = async () => {
      try {
        const [linesRes, depotsRes] = await Promise.all([
          window.fetch(`${API_URL}/api/lignes`),
          window.fetch(`${API_URL}/api/etablissements`)
        ]);

        if (!linesRes.ok || !depotsRes.ok) throw new Error('Erreur de chargement');

        const linesData = await linesRes.json();
        const depotsData = await depotsRes.json();

        setLines(linesData);
        setDepots(depotsData);
        
        // Calculer les stats
        const assigned = linesData.filter(l => l.etablissementId).length;
        setStats({
          total: linesData.length,
          assigned,
          unassigned: linesData.length - assigned
        });
        
        setError(null);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  // Affecter une ligne à un dépôt
  const handleAssignLine = async (ligneId, selectedDepotId) => {
    try {
      const res = await window.fetch(`${API_URL}/api/lignes/${ligneId}/assign-depot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etablissementId: selectedDepotId || null })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur');
      }

      // Mettre à jour la ligne localement
      const updatedLines = lines.map(l => 
        l.id === ligneId 
          ? { ...l, etablissementId: selectedDepotId || null, etablissement: selectedDepotId ? depots.find(d => d.id === selectedDepotId) : null }
          : l
      );
      setLines(updatedLines);

      // Recalculer les stats
      const assigned = updatedLines.filter(l => l.etablissementId).length;
      setStats({
        total: updatedLines.length,
        assigned,
        unassigned: updatedLines.length - assigned
      });

      setSuccess(`Ligne ${ligneId} affectée`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  if (loading) return <Box p={6}><Spinner /></Box>;

  return (
    <Box p={6} bg="white" minH="100vh">
      <Heading mb={6} fontSize="2xl">
        Affectation des lignes aux dépôts
      </Heading>

      {/* Statistiques */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50">
          <Box fontSize="sm" color="gray.600">Total lignes</Box>
          <Box fontSize="2xl" fontWeight="bold" color="blue.600">{stats.total}</Box>
        </Box>
        <Box p={4} borderWidth={1} borderRadius="md" bg="green.50">
          <Box fontSize="sm" color="gray.600">Affectées</Box>
          <Box fontSize="2xl" fontWeight="bold" color="green.600">{stats.assigned}</Box>
        </Box>
        <Box p={4} borderWidth={1} borderRadius="md" bg="orange.50">
          <Box fontSize="sm" color="gray.600">Non affectées</Box>
          <Box fontSize="2xl" fontWeight="bold" color="orange.600">{stats.unassigned}</Box>
        </Box>
      </SimpleGrid>

      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {success && (
        <Alert status="success" mb={4} borderRadius="md">
          <AlertIcon />
          {success}
        </Alert>
      )}

      <Box overflowX="auto" borderWidth={1} borderRadius="md">
        <Table variant="simple">
          <Thead bg="gray.100">
            <Tr>
              <Th>Ligne</Th>
              <Th>Numéro</Th>
              <Th>Statut</Th>
              <Th>Dépôt assigné</Th>
              <Th>Changer d'affectation</Th>
            </Tr>
          </Thead>
          <Tbody>
            {lines.map(ligne => (
              <LineRow 
                key={ligne.id}
                ligne={ligne}
                depots={depots}
                onAssign={handleAssignLine}
              />
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
}

function LineRow({ ligne, depots, onAssign }) {
  const [selectedDepot, setSelectedDepot] = useState(ligne.etablissementId || '');

  const handleChange = (e) => {
    const depotId = e.target.value;
    setSelectedDepot(depotId);
    onAssign(ligne.id, depotId || null);
  };

  const currentDepot = depots.find(d => d.id === ligne.etablissementId);

  return (
    <Tr>
      <Td fontWeight="bold">{ligne.id}</Td>
      <Td fontWeight="bold" fontSize="lg">{ligne.numero}</Td>
      <Td>
        <Badge colorScheme={ligne.statut === 'Actif' ? 'green' : 'gray'}>
          {ligne.statut}
        </Badge>
      </Td>
      <Td>
        {currentDepot ? (
          <Badge colorScheme="blue">{currentDepot.nom}</Badge>
        ) : (
          <Badge colorScheme="gray">Non assigné</Badge>
        )}
      </Td>
      <Td>
        <Select 
          value={selectedDepot}
          onChange={handleChange}
          size="sm"
          width="220px"
          bg="white"
          placeholder="Sélectionner un dépôt"
        >
          <option value="">-- Désaffecter --</option>
          {depots.map(depot => (
            <option key={depot.id} value={depot.id}>
              {depot.nom}
            </option>
          ))}
        </Select>
      </Td>
    </Tr>
  );
}
