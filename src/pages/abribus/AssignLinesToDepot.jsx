import { useState, useEffect } from 'react';
import { Box, Button, Table, Thead, Tbody, Tr, Th, Td, Select, HStack, Alert, AlertIcon, Spinner, Heading, SimpleGrid, Badge, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, useDisclosure, useToast, FormControl, FormLabel, Textarea, RadioGroup, Stack, Radio, Checkbox } from '@chakra-ui/react';
import { API_URL } from '../../config';

export default function AssignLinesToDepot() {
  const [lines, setLines] = useState([]);
  const [depots, setDepots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({ total: 0, assigned: 0, unassigned: 0 });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  const [switchForm, setSwitchForm] = useState({
    action: 'switch', // switch ou merge
    selectedDepot: '',
    motif: '',
    mergeOptions: {
      allServices: true,
      selectServices: false,
      selectedServiceIds: [],
      vehiclesOnly: false,
      conductorsOnly: false
    }
  });
  const [selectedLine, setSelectedLine] = useState(null);

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

      toast({
        title: 'Succès',
        description: `Ligne affectée à ${selectedDepotId ? depots.find(d => d.id === selectedDepotId)?.nom : 'aucun dépôt'}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (err) {
      console.error('Erreur:', err);
      toast({
        title: 'Erreur',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Ouvrir modal pour switcher/fusionner
  const openSwitchModal = (ligne) => {
    setSelectedLine(ligne);
    setSwitchForm({
      action: 'switch',
      selectedDepot: '',
      motif: '',
      mergeOptions: {
        allServices: true,
        selectServices: false,
        selectedServiceIds: [],
        vehiclesOnly: false,
        conductorsOnly: false
      }
    });
    onOpen();
  };

  // Exécuter switcher/fusionner
  const handleSwitchOrMerge = async () => {
    if (!selectedLine) return;
    if (!switchForm.selectedDepot) {
      toast({
        title: 'Erreur',
        description: 'Sélectionnez un dépôt',
        status: 'error'
      });
      return;
    }
    if (!switchForm.motif.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le motif est obligatoire',
        status: 'error'
      });
      return;
    }

    try {
      let endpoint, method, body;
      
      if (switchForm.action === 'switch') {
        // Switcher simplement le dépôt
        endpoint = `/api/lignes/${selectedLine.id}/assign-depot`;
        method = 'PUT';
        body = {
          etablissementId: switchForm.selectedDepot,
          motif: switchForm.motif,
          type: 'switch'
        };
      } else {
        // Fusionner - pour l'instant, juste switcher avec motif
        endpoint = `/api/lignes/${selectedLine.id}/assign-depot`;
        method = 'PUT';
        body = {
          etablissementId: switchForm.selectedDepot,
          motif: switchForm.motif,
          type: 'merge',
          mergeOptions: switchForm.mergeOptions
        };
      }

      const res = await window.fetch(`${API_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur');
      }

      // Mettre à jour la liste
      const updatedLines = lines.map(l =>
        l.id === selectedLine.id
          ? { ...l, etablissementId: switchForm.selectedDepot, etablissement: depots.find(d => d.id === switchForm.selectedDepot) }
          : l
      );
      setLines(updatedLines);

      const assigned = updatedLines.filter(l => l.etablissementId).length;
      setStats({
        total: updatedLines.length,
        assigned,
        unassigned: updatedLines.length - assigned
      });

      toast({
        title: 'Succès',
        description: `Ligne ${switchForm.action === 'switch' ? 'switchée' : 'fusionnée'}`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });

      onClose();
    } catch (err) {
      console.error('Erreur:', err);
      toast({
        title: 'Erreur',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
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
              <Th>Numéro</Th>
              <Th>Statut</Th>
              <Th>Dépôt assigné</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {lines.map(ligne => (
              <LineRow 
                key={ligne.id}
                ligne={ligne}
                depots={depots}
                onOpenSwitch={() => openSwitchModal(ligne)}
              />
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Modal Switcher/Fusionner */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedLine && `Switcher/Fusionner Ligne ${selectedLine.numero}`}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box mb={4}>
              <FormControl mb={4}>
                <FormLabel fontWeight="bold">Action</FormLabel>
                <RadioGroup value={switchForm.action} onChange={(val) => setSwitchForm({...switchForm, action: val})}>
                  <Stack>
                    <Radio value="switch">
                      <Box ml={2}>
                        <Box fontWeight="bold">Switcher</Box>
                        <Box fontSize="sm" color="gray.600">Transférer la ligne à un autre dépôt (responsabilise l'autre dépôt)</Box>
                      </Box>
                    </Radio>
                    <Radio value="merge">
                      <Box ml={2}>
                        <Box fontWeight="bold">Fusionner</Box>
                        <Box fontSize="sm" color="gray.600">Fusionner avec un autre dépôt (sélectif)</Box>
                      </Box>
                    </Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>

              {switchForm.action === 'merge' && (
                <Box bg="blue.50" p={3} borderRadius="md" mb={4}>
                  <FormLabel fontWeight="bold" mb={3}>Éléments à fusionner</FormLabel>
                  <Stack spacing={2}>
                    <Checkbox 
                      isChecked={switchForm.mergeOptions.allServices}
                      onChange={(e) => setSwitchForm({
                        ...switchForm,
                        mergeOptions: {...switchForm.mergeOptions, allServices: e.target.checked, selectServices: false}
                      })}
                    >
                      Tous les services
                    </Checkbox>
                    <Checkbox 
                      isChecked={switchForm.mergeOptions.selectServices && !switchForm.mergeOptions.allServices}
                      onChange={(e) => setSwitchForm({
                        ...switchForm,
                        mergeOptions: {...switchForm.mergeOptions, selectServices: e.target.checked, allServices: false}
                      })}
                    >
                      Certains services seulement
                    </Checkbox>
                    <Checkbox 
                      isChecked={switchForm.mergeOptions.vehiclesOnly}
                      onChange={(e) => setSwitchForm({
                        ...switchForm,
                        mergeOptions: {...switchForm.mergeOptions, vehiclesOnly: e.target.checked}
                      })}
                    >
                      Seulement les véhicules
                    </Checkbox>
                    <Checkbox 
                      isChecked={switchForm.mergeOptions.conductorsOnly}
                      onChange={(e) => setSwitchForm({
                        ...switchForm,
                        mergeOptions: {...switchForm.mergeOptions, conductorsOnly: e.target.checked}
                      })}
                    >
                      Seulement les conducteurs
                    </Checkbox>
                  </Stack>
                </Box>
              )}

              <FormControl mb={4}>
                <FormLabel fontWeight="bold">Dépôt destination</FormLabel>
                <Select 
                  value={switchForm.selectedDepot}
                  onChange={(e) => setSwitchForm({...switchForm, selectedDepot: e.target.value})}
                  placeholder="Sélectionner un dépôt"
                >
                  {depots.filter(d => d.id !== selectedLine?.etablissementId).map(depot => (
                    <option key={depot.id} value={depot.id}>{depot.nom}</option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="bold">Motif (obligatoire)</FormLabel>
                <Textarea 
                  value={switchForm.motif}
                  onChange={(e) => setSwitchForm({...switchForm, motif: e.target.value})}
                  placeholder="Expliquer la raison du switch/fusion..."
                  size="sm"
                  rows={3}
                />
              </FormControl>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Annuler</Button>
            <Button colorScheme="blue" onClick={handleSwitchOrMerge}>
              {switchForm.action === 'switch' ? 'Switcher' : 'Fusionner'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

function LineRow({ ligne, depots, onOpenSwitch }) {
  const currentDepot = depots.find(d => d.id === ligne.etablissementId);

  return (
    <Tr>
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
        <Button 
          size="sm" 
          colorScheme={currentDepot ? "orange" : "blue"}
          onClick={() => onOpenSwitch()}
        >
          {currentDepot ? 'Switcher / Fusionner' : 'Assigner'}
        </Button>
      </Td>
    </Tr>
  );
}
