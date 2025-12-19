import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverHeader,
  PopoverCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Divider,
} from '@chakra-ui/react';
import { BellIcon } from '@chakra-ui/icons';
import { FaExclamationCircle, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { API_URL } from '../config';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [hasNew, setHasNew] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
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
    <Popover isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <PopoverTrigger>
        <Box
          position="relative"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) markAsSeen();
          }}
        >
          <IconButton
            icon={<BellIcon />}
            aria-label="Notifications"
            variant="ghost"
            color="white"
            _hover={{ bg: 'rgba(255,255,255,0.1)' }}
            fontSize="20px"
            className={hasNew ? 'bell-blink' : ''}
            sx={hasNew ? {
              animation: 'blink 1s infinite',
              '@keyframes blink': {
                '0%, 49%': { color: 'white' },
                '50%, 100%': { color: '#ff69b4' },
              }
            } : {}}
          />
          
          {/* Badge de notification */}
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
      </PopoverTrigger>

      <PopoverContent width="80vw" maxWidth="1200px" boxShadow="lg" position="fixed" zIndex="9999">
        <PopoverHeader fontWeight="bold" fontSize="16px">
          Notifications ({notifications.length})
        </PopoverHeader>
        <PopoverCloseButton />
        <Divider />
        <PopoverBody py={6}>
          {notifications.length === 0 ? (
            <Text textAlign="center" py={8} color="gray.500">
              Aucune notification
            </Text>
          ) : (
            <Box>
              {/* Notifications en ligne */}
              <Box display="flex" flexWrap="wrap" gap={4} mb={6}>
                {notifications.map(notif => {
                  const { icon, color } = getTypeStyles(notif.type);
                  const isSeen = seenIds.includes(notif.id);
                  
                  return (
                    <Box
                      key={notif.id}
                      flex="1"
                      minWidth="280px"
                      bg={isSeen ? 'gray.50' : 'blue.50'}
                      p={4}
                      borderRadius="md"
                      borderLeft="4px"
                      borderColor={color}
                      boxShadow="sm"
                    >
                      <HStack spacing={3} align="start" mb={3}>
                        <Box fontSize="20px">{icon}</Box>
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontWeight="bold" fontSize="15px" color="black">
                            {notif.titre}
                          </Text>
                          <Text fontSize="13px" color="gray.600">
                            {notif.message}
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>
                  );
                })}
              </Box>
              
              <Divider my={4} />
              
              <Button
                size="sm"
                colorScheme="blue"
                width="100%"
                onClick={() => window.location.href = '/diffusion-informations'}
              >
                Gérer les notifications
              </Button>
            </Box>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
