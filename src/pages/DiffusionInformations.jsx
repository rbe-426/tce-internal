import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Heading,
  HStack,
  VStack,
  Text,
  Input,
  Textarea,
  Select,
  useToast,
  SimpleGrid,
  Badge,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, WarningIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { FaExclamationCircle, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { API_URL } from '../config';

export default function DiffusionInformations() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  // Formulaire
  const [formData, setFormData] = useState({
    type: 'avertissement',
    titre: '',
    message: '',
    dateFin: '',
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Charger les notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/notifications`);
      if (!response.ok) throw new Error('Erreur de chargement');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      type: 'avertissement',
      titre: '',
      message: '',
      dateFin: '',
    });
    setEditingId(null);
  };

  // Ouvrir le formulaire
  const handleOpenAdd = () => {
    resetForm();
    onOpen();
  };

  // Éditer une notification
  const handleEdit = (notif) => {
    setEditingId(notif.id);
    setFormData({
      type: notif.type,
      titre: notif.titre,
      message: notif.message,
      dateFin: notif.dateFin ? notif.dateFin.split('T')[0] : '',
    });
    onOpen();
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!formData.titre || !formData.message) {
      toast({
        title: 'Erreur',
        description: 'Titre et message sont requis',
        status: 'error',
        isClosable: true,
      });
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `${API_URL}/api/notifications/${editingId}`
        : `${API_URL}/api/notifications`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erreur');

      toast({
        title: 'Succès',
        description: editingId ? 'Notification mise à jour' : 'Notification créée',
        status: 'success',
        isClosable: true,
      });

      // Notifier la bannière de se rafraîchir immédiatement
      window.dispatchEvent(new Event('notification-created'));

      onClose();
      resetForm();
      fetchNotifications();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        isClosable: true,
      });
    }
  };

  // Supprimer une notification
  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr ?')) return;

    try {
      const response = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur');

      toast({
        title: 'Succès',
        description: 'Notification supprimée',
        status: 'success',
        isClosable: true,
      });

      fetchNotifications();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        isClosable: true,
      });
    }
  };

  // Désactiver une notification
  const handleDisable = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications/${id}/disable`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Erreur');

      toast({
        title: 'Succès',
        description: 'Notification désactivée',
        status: 'success',
        isClosable: true,
      });

      fetchNotifications();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message,
        status: 'error',
        isClosable: true,
      });
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'alerte':
        return <FaExclamationCircle color="red" />;
      case 'avertissement':
        return <FaExclamationTriangle color="orange" />;
      case 'positif':
        return <FaCheckCircle color="green" />;
      default:
        return null;
    }
  };

  const getTypeBg = (type) => {
    switch (type) {
      case 'alerte':
        return 'red.50';
      case 'avertissement':
        return 'orange.50';
      case 'positif':
        return 'green.50';
      default:
        return 'gray.50';
    }
  };

  const getTypeBorder = (type) => {
    switch (type) {
      case 'alerte':
        return 'red.200';
      case 'avertissement':
        return 'orange.200';
      case 'positif':
        return 'green.200';
      default:
        return 'gray.200';
    }
  };

  const getTypeBadgeColorScheme = (type) => {
    switch (type) {
      case 'alerte':
        return 'red';
      case 'avertissement':
        return 'orange';
      case 'positif':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Container maxW="1000px" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>📢 Diffusion d'Informations</Heading>
          <Text color="gray.600">
            Gérez les notifications affichées en haut du site pour tous les utilisateurs
          </Text>
        </Box>

        {/* Bouton ajouter */}
        <HStack>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={handleOpenAdd}
          >
            Créer une notification
          </Button>
        </HStack>

        {/* Liste des notifications */}
        {loading ? (
          <Text>Chargement...</Text>
        ) : notifications.length === 0 ? (
          <Card bg="gray.50">
            <CardBody textAlign="center">
              <Text color="gray.600">Aucune notification active</Text>
            </CardBody>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1 }} spacing={4}>
            {notifications.map(notif => (
              <Card
                key={notif.id}
                bg={getTypeBg(notif.type)}
                border="2px solid"
                borderColor={getTypeBorder(notif.type)}
              >
                <CardBody>
                  <VStack align="start" spacing={3}>
                    {/* Titre + Type */}
                    <HStack justify="space-between" w="full">
                      <HStack>
                        <Box fontSize="xl">{getTypeIcon(notif.type)}</Box>
                        <Heading size="sm">{notif.titre}</Heading>
                      </HStack>
                      <Badge colorScheme={getTypeBadgeColorScheme(notif.type)}>
                        {notif.type.toUpperCase()}
                      </Badge>
                    </HStack>

                    {/* Message */}
                    <Text fontSize="sm" color="gray.700">{notif.message}</Text>

                    {/* Dates */}
                    <HStack fontSize="xs" color="gray.600" spacing={4}>
                      <Text>
                        📅 Créée: {new Date(notif.createdAt).toLocaleString('fr-FR')}
                      </Text>
                      {notif.dateFin && (
                        <Text>
                          ⏰ Expire: {new Date(notif.dateFin).toLocaleString('fr-FR')}
                        </Text>
                      )}
                    </HStack>

                    {/* Statut */}
                    <HStack spacing={2}>
                      <Badge
                        colorScheme={notif.actif ? 'green' : 'gray'}
                      >
                        {notif.actif ? '✅ Actif' : '❌ Inactif'}
                      </Badge>
                    </HStack>

                    {/* Actions */}
                    <HStack spacing={2}>
                      <IconButton
                        size="sm"
                        icon={<EditIcon />}
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => handleEdit(notif)}
                        title="Éditer"
                      />
                      {notif.actif && (
                        <Button
                          size="sm"
                          colorScheme="orange"
                          variant="outline"
                          onClick={() => handleDisable(notif.id)}
                        >
                          Désactiver
                        </Button>
                      )}
                      <IconButton
                        size="sm"
                        icon={<DeleteIcon />}
                        colorScheme="red"
                        variant="outline"
                        onClick={() => handleDelete(notif.id)}
                        title="Supprimer"
                      />
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Modal formulaire */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingId ? '✏️ Éditer la notification' : '➕ Créer une notification'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              {/* Type */}
              <FormControl>
                <FormLabel fontWeight="bold">Type *</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="alerte">🔴 Alerte (rouge)</option>
                  <option value="avertissement">🟠 Avertissement (orange)</option>
                  <option value="positif">🟢 Message positif (vert)</option>
                </Select>
              </FormControl>

              {/* Titre */}
              <FormControl>
                <FormLabel fontWeight="bold">Titre *</FormLabel>
                <Input
                  placeholder="ex: Maintenance prévue"
                  value={formData.titre}
                  onChange={(e) => setFormData({...formData, titre: e.target.value})}
                />
              </FormControl>

              {/* Message */}
              <FormControl>
                <FormLabel fontWeight="bold">Message *</FormLabel>
                <Textarea
                  placeholder="ex: Le serveur sera indisponible de 22h à 23h..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  minH="120px"
                />
              </FormControl>

              {/* Date d'expiration */}
              <FormControl>
                <FormLabel fontWeight="bold">Date d'expiration (optionnel)</FormLabel>
                <Input
                  type="datetime-local"
                  value={formData.dateFin}
                  onChange={(e) => setFormData({...formData, dateFin: e.target.value})}
                />
                <Text fontSize="xs" color="gray.600" mt={1}>
                  La notification sera automatiquement masquée après cette date
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Annuler</Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              {editingId ? 'Mettre à jour' : 'Créer'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
