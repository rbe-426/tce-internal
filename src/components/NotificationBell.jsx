import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Divider,
  useDisclosure,
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import { FaExclamationCircle, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { API_URL } from '../config';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [hasNew, setHasNew] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [seenIds, setSeenIds] = useState(() => {
    const saved = localStorage.getItem('seen_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`);
      if (!response.ok) return;
      
      const data = await response.json();
      setNotifications(data);
      
      // Check if there are new unseen notifications
      const newNotifs = data.filter(n => !seenIds.includes(n.id));
      setHasNew(newNotifs.length > 0);
    } catch (error) {
      console.warn('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    
    // Listen for notification creation events
    const handleNotificationCreated = () => {
      fetchNotifications();
    };
    
    window.addEventListener('notification-created', handleNotificationCreated);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-created', handleNotificationCreated);
    };
  }, [seenIds]);

  const markAsSeen = () => {
    const newSeenIds = [...seenIds, ...notifications.map(n => n.id)];
    setSeenIds(newSeenIds);
    localStorage.setItem('seen_notifications', JSON.stringify(newSeenIds));
    setHasNew(false);
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'alerte':
        return {
          icon: <FaExclamationCircle color="red" />,
          color: 'red',
        };
      case 'avertissement':
        return {
          icon: <FaExclamationTriangle color="orange" />,
          color: 'orange',
        };
      case 'positif':
        return {
          icon: <FaCheckCircle color="green" />,
          color: 'green',
        };
      default:
        return {
          icon: null,
          color: 'gray',
        };
    }
  };

  return (
    <>
      {/* Cloche */}
      <Box position="relative">
        <IconButton
          icon={<BellIcon />}
          aria-label="Notifications"
          variant="ghost"
          color="white"
          _hover={{ bg: 'rgba(255,255,255,0.1)' }}
          fontSize="20px"
          onClick={() => {
            onOpen();
            markAsSeen();
          }}
          className={hasNew ? 'bell-blink' : ''}
          sx={hasNew ? {
            animation: 'blink 1s infinite',
            '@keyframes blink': {
              '0%, 49%': { color: 'white' },
              '50%, 100%': { color: '#ff69b4' },
            }
          } : {}}
        />
        {notifications.length > 0 && (
          <Badge
            position="absolute"
            top="-5px"
            right="-5px"
            colorScheme={hasNew ? 'pink' : 'gray'}
            borderRadius="full"
            fontSize="10px"
            padding="4px 6px"
          >
            {notifications.length}
          </Badge>
        )}
      </Box>

      {/* Modal centré, notifications en liste verticale */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent maxWidth="900px" width="90vw" maxH="75vh" overflowY="auto">
          <ModalHeader fontWeight="bold" fontSize="24px">
            Notifications ({notifications.length})
          </ModalHeader>
          <ModalCloseButton />
          <Divider />
          <ModalBody py={10} px={10}>
            {notifications.length === 0 ? (
              <Text textAlign="center" py={8} color="gray.500" fontSize="lg">
                Aucune notification
              </Text>
            ) : (
              <VStack spacing={6} align="stretch">
                {notifications.map((notif) => {
                  const { icon, color } = getTypeStyles(notif.type);
                  const isSeen = seenIds.includes(notif.id);
                  return (
                    <Box
                      key={notif.id}
                      width="100%"
                      maxWidth="700px"
                      mx="auto"
                      bg={isSeen ? 'gray.50' : 'blue.50'}
                      p={6}
                      borderRadius="lg"
                      borderLeft="6px"
                      borderColor={color}
                      boxShadow="md"
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      gap={5}
                    >
                      <Box fontSize="28px">{icon}</Box>
                      <Box flex="1">
                        <Text fontWeight="bold" fontSize="xl" color="black" mb={2}>
                          {notif.titre}
                        </Text>
                        <Text fontSize="md" color="gray.700">
                          {notif.message}
                        </Text>
                      </Box>
                    </Box>
                  );
                })}
                {/* Bouton 'Gérer les notifications' retiré */}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default NotificationBell;
