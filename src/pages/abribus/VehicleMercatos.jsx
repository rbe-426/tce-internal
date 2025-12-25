import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Select,
  Input,
  Textarea,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  HStack as Stack
} from '@chakra-ui/react';
import { API_URL } from '../../config';

const STATUT_COLORS = {
  EN_ATTENTE: 'yellow',
  APPROUVÉ: 'blue',
  TRANSPORTÉ: 'green',
  REJETÉ: 'red'
};

export default function VehicleMercatos({ depotId }) {
  const [loading, setLoading] = useState(true);
  const [mercatos, setMercatos] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [depots, setDepots] = useState([]);
  const [formData, setFormData] = useState({
    vehicleId: '',
    depotDestinationId: '',
    raison: ''
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, [depotId]);

  async function loadData() {
    try {
      setLoading(true);

      // Charger les mercatos
      const mercRes = await fetch(`${API_URL}/api/mercatos`);
      if (mercRes.ok) {
        const data = await mercRes.json();
        setMercatos(data);
      }

      // Charger les véhicules du dépôt
      const vehRes = await fetch(`${API_URL}/api/vehicles`);
      if (vehRes.ok) {
        const data = await vehRes.json();
        setVehicles(data.filter((v) => v.etablissementId === depotId));
      }

      // Charger les dépôts
      const depRes = await fetch(`${API_URL}/api/etablissements`);
      if (depRes.ok) {
        const data = await depRes.json();
        setDepots(data.filter((d) => d.id !== depotId));
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  }

  async function proposeMercato() {
    if (!formData.vehicleId || !formData.depotDestinationId) {
      toast({
        title: 'Données manquantes',
        description: 'Veuillez sélectionner un véhicule et un dépôt destination',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/mercatos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: formData.vehicleId,
          depotSourceId: depotId,
          depotDestinationId: formData.depotDestinationId,
          raison: formData.raison
        })
      });

      if (res.ok) {
        toast({
          title: 'Succès',
          description: 'Mercato proposé',
          status: 'success',
          duration: 3000
        });
        setFormData({ vehicleId: '', depotDestinationId: '', raison: '' });
        onClose();
        loadData();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la création');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    }
  }

  async function updateMercatoStatus(mercatoId, action, rejectionReason = '') {
    try {
      const endpoint =
        action === 'approve'
          ? `/api/mercatos/${mercatoId}/approve`
          : action === 'reject'
            ? `/api/mercatos/${mercatoId}/reject`
            : `/api/mercatos/${mercatoId}/complete`;

      const body =
        action === 'reject'
          ? { raison: rejectionReason }
          : {};

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast({
          title: 'Succès',
          description: `Mercato ${action}`,
          status: 'success',
          duration: 3000
        });
        loadData();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Erreur');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        duration: 3000
      });
    }
  }

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={6} p={6}>
      <Box>
        <Heading size="lg" mb={4}>
          Mercatos de Véhicules
        </Heading>

        <Button colorScheme="blue" onClick={onOpen} mb={4}>
          + Proposer un Mercato
        </Button>

        {mercatos.length > 0 ? (
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Véhicule</Th>
                <Th>De</Th>
                <Th>Vers</Th>
                <Th>Statut</Th>
                <Th>Raison</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {mercatos.map((m) => (
                <Tr key={m.id}>
                  <Td>{m.vehicleNumber}</Td>
                  <Td>{m.depotSourceName}</Td>
                  <Td>{m.depotDestinationName}</Td>
                  <Td>
                    <Badge colorScheme={STATUT_COLORS[m.statut]}>
                      {m.statut}
                    </Badge>
                  </Td>
                  <Td>{m.raison || '-'}</Td>
                  <Td>
                    <Stack spacing={1}>
                      {m.statut === 'EN_ATTENTE' && (
                        <>
                          <Button
                            size="sm"
                            colorScheme="green"
                            variant="outline"
                            onClick={() => updateMercatoStatus(m.id, 'approve')}
                          >
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => updateMercatoStatus(m.id, 'reject')}
                          >
                            Refuser
                          </Button>
                        </>
                      )}
                      {m.statut === 'APPROUVÉ' && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => updateMercatoStatus(m.id, 'complete')}
                        >
                          Marquer Transporté
                        </Button>
                      )}
                    </Stack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Alert status="info">
            <AlertIcon />
            Aucun mercato pour le moment
          </Alert>
        )}
      </Box>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Proposer un Mercato</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Véhicule</FormLabel>
                <Select
                  placeholder="Sélectionner un véhicule"
                  value={formData.vehicleId}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleId: e.target.value })
                  }
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.numero} - {v.type}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Dépôt Destination</FormLabel>
                <Select
                  placeholder="Sélectionner un dépôt"
                  value={formData.depotDestinationId}
                  onChange={(e) =>
                    setFormData({ ...formData, depotDestinationId: e.target.value })
                  }
                >
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nom}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Raison</FormLabel>
                <Textarea
                  placeholder="Raison du mercato"
                  value={formData.raison}
                  onChange={(e) =>
                    setFormData({ ...formData, raison: e.target.value })
                  }
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={proposeMercato}>
              Proposer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
