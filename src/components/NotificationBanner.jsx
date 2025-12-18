import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  IconButton,
  Collapse,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { FaExclamationCircle, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { API_URL } from '../config';

export default function NotificationBanner() {
  const [notifications, setNotifications] = useState([]);
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`);
      if (!response.ok) throw new Error('Erreur');
      const data = await response.json();
      setNotifications(data);
      // Afficher toutes les notifications au chargement
      setVisibleNotifications(data.map(n => n.id));
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const dismissNotification = (id) => {
    setVisibleNotifications(prev => prev.filter(nId => nId !== id));
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'alerte':
        return {
          bg: 'red.500',
          icon: <FaExclamationCircle color="white" />,
          text: 'white',
        };
      case 'avertissement':
        return {
          bg: 'orange.500',
          icon: <FaExclamationTriangle color="white" />,
          text: 'white',
        };
      case 'positif':
        return {
          bg: 'green.500',
          icon: <FaCheckCircle color="white" />,
          text: 'white',
        };
      default:
        return {
          bg: 'gray.500',
          icon: null,
          text: 'white',
        };
    }
  };

  if (notifications.length === 0) return null;

  return (
    <VStack spacing={0} align="stretch">
      {notifications
        .filter(notif => visibleNotifications.includes(notif.id))
        .map(notif => {
          const styles = getTypeStyles(notif.type);
          return (
            <Box
              key={notif.id}
              bg={styles.bg}
              color={styles.text}
              py={3}
              px={4}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <HStack spacing={3} flex={1}>
                <Box fontSize="xl">{styles.icon}</Box>
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold" fontSize="sm">
                    {notif.titre}
                  </Text>
                  <Text fontSize="xs" opacity={0.9}>
                    {notif.message}
                  </Text>
                </VStack>
              </HStack>
              <IconButton
                icon={<CloseIcon />}
                size="sm"
                variant="ghost"
                color="white"
                _hover={{ bg: 'rgba(255,255,255,0.2)' }}
                onClick={() => dismissNotification(notif.id)}
                aria-label="Fermer"
              />
            </Box>
          );
        })}
    </VStack>
  );
}
