import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  IconButton,
  Collapse,
  Badge,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { FaExclamationCircle, FaCheckCircle, FaExclamationTriangle, FaServerSlash } from 'react-icons/fa';
import { API_URL } from '../config';

export default function NotificationBanner() {
  const [notifications, setNotifications] = useState([]);
  const [visibleNotifications, setVisibleNotifications] = useState([]);
  const [serverStatus, setServerStatus] = useState('ok'); // 'ok', 'offline', 'loading'

  const CACHE_KEY = 'notifications_cache';
  const CACHE_EXPIRY_KEY = 'notifications_cache_expiry';
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Sauvegarder en cache
  const saveToCache = (notifs) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(notifs));
      localStorage.setItem(CACHE_EXPIRY_KEY, Date.now().toString());
    } catch (e) {
      console.warn('Erreur sauvegarde cache:', e);
    }
  };

  // Charger depuis le cache
  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
      
      if (!cached || !expiry) return null;

      const expiryTime = parseInt(expiry);
      if (Date.now() - expiryTime > CACHE_DURATION) {
        // Cache expiré
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_EXPIRY_KEY);
        return null;
      }

      return JSON.parse(cached);
    } catch (e) {
      console.warn('Erreur lecture cache:', e);
      return null;
    }
  };

  const fetchNotifications = async () => {
    setServerStatus('loading');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes timeout

      const response = await fetch(`${API_URL}/api/notifications`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Endpoint n'existe pas encore en production
          console.warn('Endpoint /api/notifications non disponible');
          setServerStatus('offline');
        } else {
          throw new Error(`Erreur ${response.status}`);
        }
      } else {
        const data = await response.json();
        setNotifications(data);
        saveToCache(data);
        setVisibleNotifications(data.map(n => n.id));
        setServerStatus('ok');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Timeout notifications');
      } else {
        console.warn('Erreur chargement notifications:', error);
      }
      setServerStatus('offline');
      
      // Essayer de charger depuis le cache
      const cached = loadFromCache();
      if (cached && cached.length > 0) {
        setNotifications(cached);
        setVisibleNotifications(cached.map(n => n.id));
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    
    // Écouter l'événement de création de notification
    const handleNotificationCreated = () => {
      console.log('[NotificationBanner] Notification créée détectée, rafraîchissement...');
      fetchNotifications();
    };
    
    window.addEventListener('notification-created', handleNotificationCreated);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-created', handleNotificationCreated);
    };
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

  // Afficher les notifications
  const hasVisibleNotifications = notifications.length > 0 && 
    notifications.some(n => visibleNotifications.includes(n.id));

  if (!hasVisibleNotifications && serverStatus === 'ok') return null;

  return (
    <VStack spacing={0} align="stretch">
      {/* Bande serveur offline */}
      {serverStatus === 'offline' && (
        <Box
          bg="gray.600"
          color="white"
          py={2}
          px={4}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          fontSize="xs"
        >
          <HStack spacing={2}>
            <FaServerSlash />
            <Text>
              ⚠️ Serveur indisponible - Notifications en cache (dernière sync: {loadFromCache() ? 'il y a moins de 30 min' : 'jamais'})
            </Text>
          </HStack>
        </Box>
      )}

      {/* Notifications */}
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
              position="relative"
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
                  {serverStatus === 'offline' && (
                    <Badge
                      colorScheme="gray"
                      fontSize="10px"
                      mt={1}
                    >
                      💾 En cache
                    </Badge>
                  )}
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
