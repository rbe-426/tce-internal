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
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';
import { API_URL } from '../../config';

const ROLE_TYPES = [
  { value: 'DIRECTEUR_SITE', label: 'Directeur de Site', required: 1 },
  { value: 'RESPONSABLE_EXPLOITATION', label: 'Responsable d\'Exploitation', required: 1 },
  { value: 'REGULATEUR', label: 'Régulateur', required: 2 },
  { value: 'ASSUREUR', label: 'Assureur', required: 3 },
  { value: 'CONDUCTEUR', label: 'Conducteur', required: null }
];

const STATUS_COLORS = {
  OK: 'green',
  MANQUANT: 'red',
  INCOMPLET: 'orange'
};

export default function PersonnelDepot({ depotId, depotName }) {
  const [loading, setLoading] = useState(true);
  const [personnel, setPersonnel] = useState([]);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, [depotId]);

  async function loadData() {
    try {
      setLoading(true);
      // Charger les stats
      const statsRes = await fetch(`${API_URL}/api/depots/${depotId}/personnel/stats`);
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // Charger le personnel
      const personnelRes = await fetch(`${API_URL}/api/depots/${depotId}/personnel`);
      if (personnelRes.ok) {
        setPersonnel(await personnelRes.json());
      }

      // Charger les employés disponibles
      const empRes = await fetch(`${API_URL}/api/employes`);
      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data);
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

  async function assignRole() {
    if (!selectedEmployee || !selectedRole) {
      toast({
        title: 'Données manquantes',
        description: 'Veuillez sélectionner un employé et un rôle',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/depots/${depotId}/personnel/assign-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          role: selectedRole
        })
      });

      if (res.ok) {
        toast({
          title: 'Succès',
          description: 'Rôle assigné avec succès',
          status: 'success',
          duration: 3000
        });
        setSelectedEmployee('');
        setSelectedRole('');
        onClose();
        loadData();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de l\'assignation');
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
          Gestion du Personnel - {depotName}
        </Heading>

        {/* Stats */}
        {stats && (
          <Box mb={6} p={4} bg="gray.50" rounded="md">
            <Heading size="sm" mb={3}>
              État des Rôles
            </Heading>
            <HStack spacing={4} wrap="wrap">
              {Object.entries(stats).map(([role, status]) => (
                <Box key={role}>
                  <Badge colorScheme={STATUS_COLORS[status]}>
                    {role}: {status}
                  </Badge>
                </Box>
              ))}
            </HStack>
          </Box>
        )}

        {/* Bouton */}
        <Button colorScheme="blue" onClick={onOpen} mb={4}>
          + Assigner un Rôle
        </Button>

        {/* Tableau */}
        {personnel.length > 0 ? (
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Employé</Th>
                <Th>Rôle</Th>
                <Th>Assigné le</Th>
                <Th>Actif</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {personnel.map((p) => (
                <Tr key={p.id}>
                  <Td>{p.employeeName}</Td>
                  <Td>
                    <Badge colorScheme="blue">
                      {ROLE_TYPES.find((r) => r.value === p.role)?.label}
                    </Badge>
                  </Td>
                  <Td>{new Date(p.createdAt).toLocaleDateString('fr-FR')}</Td>
                  <Td>
                    <Badge colorScheme={p.isActif ? 'green' : 'red'}>
                      {p.isActif ? 'Actif' : 'Inactif'}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const res = await fetch(`${API_URL}/api/personnel/roles/${p.id}`, {
                            method: 'DELETE'
                          });
                          if (res.ok) {
                            toast({
                              title: 'Succès',
                              description: 'Rôle supprimé',
                              status: 'success',
                              duration: 3000
                            });
                            loadData();
                          }
                        } catch (error) {
                          toast({
                            title: 'Erreur',
                            description: error.message,
                            status: 'error',
                            duration: 3000
                          });
                        }
                      }}
                    >
                      Retirer
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Alert status="info">
            <AlertIcon />
            Aucun personnel assigné pour le moment
          </Alert>
        )}
      </Box>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assigner un Rôle</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Employé</FormLabel>
                <Select
                  placeholder="Sélectionner un employé"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.prenom} {emp.nom} ({emp.employe_type})
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Rôle</FormLabel>
                <Select
                  placeholder="Sélectionner un rôle"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {ROLE_TYPES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                      {role.required && ` (Requis: ${role.required})`}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={assignRole}>
              Assigner
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
