import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Container,
  VStack,
  HStack,
  Button,
  Input,
  Card,
  CardBody,
  Badge,
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
  Checkbox,
  Stack,
  useToast,
  Spinner,
  Collapse,
  IconButton,
  Text,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { API_URL } from '../../config';

const typesVehicules = ['Autobus', 'Minibus', 'Autocar', 'Van'];

const LignesHierarchie = () => {
  const [lignes, setLignes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLignes, setExpandedLignes] = useState({});
  const [expandedSens, setExpandedSens] = useState({});
  const [expandedTrajets, setExpandedTrajets] = useState({});
  
  // Modal states
  const { isOpen: isAddLigneOpen, onOpen: onAddLigneOpen, onClose: onAddLigneClose } = useDisclosure();
  const { isOpen: isEditLigneOpen, onOpen: onEditLigneOpen, onClose: onEditLigneClose } = useDisclosure();
  const { isOpen: isAddSensOpen, onOpen: onAddSensOpen, onClose: onAddSensClose } = useDisclosure();
  const { isOpen: isAddServiceOpen, onOpen: onAddServiceOpen, onClose: onAddServiceClose } = useDisclosure();
  const { isOpen: isAddTrajetOpen, onOpen: onAddTrajetOpen, onClose: onAddTrajetClose } = useDisclosure();
  const { isOpen: isAddArretOpen, onOpen: onAddArretOpen, onClose: onAddArretClose } = useDisclosure();
  
  // Form states
  const [newLigne, setNewLigne] = useState({ numero: '', nom: '', typesVehicules: [] });
  const [editingLigne, setEditingLigne] = useState(null);
  const [newSens, setNewSens] = useState({ nom: '', direction: '' });
  const [selectedLigneForSens, setSelectedLigneForSens] = useState(null);
  const [newService, setNewService] = useState({ heureDebut: '', heureFin: '' });
  const [selectedSensForService, setSelectedSensForService] = useState(null);
  const [newTrajet, setNewTrajet] = useState({ nom: '', description: '' });
  const [selectedLigneForTrajet, setSelectedLigneForTrajet] = useState(null);
  const [newArret, setNewArret] = useState({ nom: '', adresse: '', tempsArriveeAntecedent: 0 });
  const [selectedTrajetForArret, setSelectedTrajetForArret] = useState(null);
  const [trajets, setTrajets] = useState({});
  
  const toast = useToast();

  // Fetch lignes with sens
  useEffect(() => {
    fetchLignes();
  }, []);

  const fetchLignes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/lignes`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      
      // Compter les services chargés
      let totalServices = 0;
      data.forEach(ligne => {
        if (ligne.sens && Array.isArray(ligne.sens)) {
          ligne.sens.forEach(sens => {
            if (sens.services && Array.isArray(sens.services)) {
              totalServices += sens.services.length;
            }
          });
        }
      });
      console.log(`[FETCH LIGNES] ${data.length} lignes chargées, ${totalServices} services total au BD`);
      
      setLignes(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les lignes',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const parseJSON = (jsonStr) => {
    try {
      return jsonStr ? JSON.parse(jsonStr) : [];
    } catch {
      return [];
    }
  };

  const toggleExpand = (ligneId) => {
    setExpandedLignes(prev => ({
      ...prev,
      [ligneId]: !prev[ligneId]
    }));
    // Charger les trajets si ce n'est pas déjà fait
    if (!trajets[ligneId]) {
      fetchTrajets(ligneId);
    }
  };

  const toggleExpandSens = (sensId) => {
    setExpandedSens(prev => ({
      ...prev,
      [sensId]: !prev[sensId]
    }));
  };

  const toggleExpandTrajet = (trajetId) => {
    setExpandedTrajets(prev => ({
      ...prev,
      [trajetId]: !prev[trajetId]
    }));
  };

  const fetchTrajets = async (ligneId) => {
    try {
      const response = await fetch(`${API_URL}/api/trajets/ligne/${ligneId}`);
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setTrajets(prev => ({
        ...prev,
        [ligneId]: data
      }));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleEditLigne = (ligne) => {
    // Parse calendrier (default to all days true if not set)
    let calendrier = { lundi: true, mardi: true, mercredi: true, jeudi: true, vendredi: true, samedi: true, dimanche: true };
    if (ligne.calendrierJson) {
      try {
        calendrier = JSON.parse(ligne.calendrierJson);
      } catch (e) {
        console.error('Erreur parsing calendrier:', e);
      }
    }

    // Parse contraintes (default to empty array)
    let contraintes = [];
    if (ligne.contraintes) {
      try {
        contraintes = JSON.parse(ligne.contraintes);
      } catch (e) {
        console.error('Erreur parsing contraintes:', e);
      }
    }

    setEditingLigne({
      id: ligne.id,
      numero: ligne.numero,
      nom: ligne.nom,
      typesVehicules: parseJSON(ligne.typesVehicules),
      heureDebut: ligne.heureDebut || '',
      heureFin: ligne.heureFin || '',
      calendrier: calendrier,
      contraintes: contraintes,
    });
    onEditLigneOpen();
  };

  const handleUpdateLigne = async () => {
    if (!editingLigne.numero || !editingLigne.nom) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/lignes/${editingLigne.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: editingLigne.numero,
          nom: editingLigne.nom,
          typesVehicules: editingLigne.typesVehicules,
          heureDebut: editingLigne.heureDebut,
          heureFin: editingLigne.heureFin,
          calendrierJson: JSON.stringify(editingLigne.calendrier),
          contraintes: JSON.stringify(editingLigne.contraintes),
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      const updated = await response.json();

      setLignes(lignes.map(l => l.id === editingLigne.id ? updated : l));
      setEditingLigne(null);
      onEditLigneClose();

      toast({
        title: 'Succès',
        description: `Ligne ${updated.numero} modifiée`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier la ligne',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddLigne = async () => {
    if (!newLigne.numero || !newLigne.nom || newLigne.typesVehicules.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/lignes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: newLigne.numero,
          nom: newLigne.nom,
          typesVehicules: newLigne.typesVehicules,
          statut: 'Actif',
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la création');
      const created = await response.json();

      setLignes([...lignes, { ...created, sens: [] }]);
      setNewLigne({ numero: '', nom: '', typesVehicules: [] });
      onAddLigneClose();

      toast({
        title: 'Succès',
        description: `Ligne ${created.numero} créée`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter la ligne',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddSens = async () => {
    if (!newSens.nom) {
      toast({
        title: 'Erreur',
        description: 'Le nom du sens est obligatoire',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/sens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ligneId: selectedLigneForSens,
          nom: newSens.nom,
          direction: newSens.direction,
          statut: 'Actif',
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la création');
      const created = await response.json();

      setLignes(lignes.map(l => 
        l.id === selectedLigneForSens 
          ? { ...l, sens: [...(l.sens || []), created] }
          : l
      ));

      setNewSens({ nom: '', direction: '' });
      onAddSensClose();

      toast({
        title: 'Succès',
        description: `Sens ${created.nom} créé`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le sens',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddService = async () => {
    if (!newService.heureDebut || !newService.heureFin) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir les horaires',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Vérifier la contrainte de 10h maximum
    const [hDebut, mDebut] = newService.heureDebut.split(':').map(Number);
    const [hFin, mFin] = newService.heureFin.split(':').map(Number);
    const minutesDebut = hDebut * 60 + mDebut;
    const minutesFin = hFin * 60 + mFin;
    const dureeService = minutesFin - minutesDebut;

    if (dureeService > 600) { // 600 minutes = 10 heures
      toast({
        title: 'Erreur de durée',
        description: 'Un service ne peut pas dépasser 10 heures (départ du dépôt à retour au dépôt inclus)',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    if (dureeService <= 0) {
      toast({
        title: 'Erreur de durée',
        description: 'L\'heure de fin doit être après l\'heure de début',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Trouver la ligne parent
      const ligne = lignes.find(l => l.sens?.some(s => s.id === selectedSensForService));

      // Vérifier les limites horaires de la ligne
      if (ligne.heureDebut && ligne.heureFin) {
        const [hLigneDebut, mLigneDebut] = ligne.heureDebut.split(':').map(Number);
        const [hLigneFin, mLigneFin] = ligne.heureFin.split(':').map(Number);
        const minutesLigneDebut = hLigneDebut * 60 + mLigneDebut;
        const minutesLigneFin = hLigneFin * 60 + mLigneFin;

        // La ligne passe minuit si heureFin < heureDebut
        // Ex: 22:00 - 06:00 ou 05:00 - 02:00
        const lignePasseMinuit = minutesLigneFin < minutesLigneDebut;

        // Logique simplifiée:
        // Si ligne passe minuit (ex: 05h-02h, 22h-06h):
        //   - Service peut être: heureDebut à 23h59 OU 00h00 à heureFin
        //   - Service peut aussi passer minuit: heureDebut à heureFin (via minuit)
        // Si ligne ne passe pas minuit (ex: 06h-22h):
        //   - Service doit être entre heureDebut et heureFin

        if (lignePasseMinuit) {
          // Pour une ligne 05h-02h, on accepte:
          // - Service 05h-14h: commence à 05h (OK) et finit à 14h (qui est entre 05h et 02h+24h)
          // - Service 22h-23h: commence à 22h (OK) et finit à 23h (OK)
          // - Service 01h-02h: commence à 01h (qui est entre 00h et 02h, OK) et finit à 02h (OK)

          if (minutesDebut >= minutesLigneDebut) {
            // Service commence après heureDebut: 05h-14h ou 22h-23h
            // Accepté tant que c'est plausible (moins de 10h)
            // OK
          } else if (minutesDebut <= minutesLigneFin) {
            // Service commence avant heureFin (après minuit): 01h-02h
            // OK
          } else {
            toast({
              title: 'Erreur d\'horaires',
              description: `Le service doit être entre ${ligne.heureDebut} et ${ligne.heureFin} (lendemain)`,
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
            return;
          }

          // Vérifier que le service ne dépasse pas les limites
          if (minutesFin > minutesLigneFin && minutesDebut >= minutesLigneDebut && minutesFin < minutesDebut) {
            // Service passe minuit mais fin > heureFin: ❌
            toast({
              title: 'Erreur d\'horaires',
              description: `Le service ne peut pas finir après ${ligne.heureFin}`,
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
            return;
          }
        } else {
          // Horaires normaux: heureDebut < heureFin (même jour)
          if (minutesDebut < minutesLigneDebut) {
            toast({
              title: 'Erreur d\'horaires',
              description: `Le service doit commencer à partir de ${ligne.heureDebut}`,
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
            return;
          }

          if (minutesFin > minutesLigneFin) {
            toast({
              title: 'Erreur d\'horaires',
              description: `Le service doit terminer avant ${ligne.heureFin}`,
              status: 'error',
              duration: 3000,
              isClosable: true,
            });
            return;
          }
        }
      }

      // Créer des services seulement pour les jours de fonctionnement de la ligne
      // Récupérer la date d'aujourd'hui depuis le serveur (en heure de Paris)
      let todayStr;
      try {
        const todayResponse = await fetch(`${API_URL}/api/today`);
        const { today } = await todayResponse.json();
        todayStr = today;
      } catch (e) {
        console.error('Erreur récupération date serveur:', e);
        todayStr = new Date().toISOString().split('T')[0];
      }

      // Parser la date de Paris en objet Date (attention: new Date("2025-12-07") donne minuit UTC!)
      // On doit créer une date locale
      const [year, month, day] = todayStr.split('-').map(Number);
      const today = new Date(year, month - 1, day);
      const dayOfWeek = today.getDay();
      // Si dimanche (0), on part du dimanche d'aujourd'hui
      // Si lundi-samedi (1-6), on part du lundi de cette semaine
      const daysToMonday = dayOfWeek === 0 ? 0 : dayOfWeek - 1;
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysToMonday);

      // Parser le calendrier de la ligne
      let calendrier = {};
      if (ligne.calendrierJson) {
        try {
          calendrier = JSON.parse(ligne.calendrierJson);
        } catch (e) {
          console.warn('Calendrier invalide, création pour tous les jours');
          calendrier = { lundi: true, mardi: true, mercredi: true, jeudi: true, vendredi: true, samedi: false, dimanche: false };
        }
      } else {
        // Si pas de calendrier, créer par défaut lun-ven
        calendrier = { lundi: true, mardi: true, mercredi: true, jeudi: true, vendredi: true, samedi: false, dimanche: false };
      }

      const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const createdServices = [];
      let servicesCount = 0;

      for (let i = 0; i < 7; i++) {
        const serviceDate = new Date(weekStart);
        serviceDate.setDate(weekStart.getDate() + i);
        const dateStr = serviceDate.toISOString().split('T')[0];
        const dayName = dayNames[serviceDate.getDay()]; // 0=dimanche...6=samedi

        // Vérifier si la ligne fonctionne ce jour
        if (!calendrier[dayName]) {
          continue;
        }

        servicesCount++;

        try {
          // Créer la date à midi (12:00) pour éviter les problèmes de timezone
          const dateWithTime = `${dateStr}T12:00:00`;
          
          const response = await fetch(`${API_URL}/api/services-hierarchie`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sensId: selectedSensForService,
              ligneId: ligne.id,
              heureDebut: newService.heureDebut,
              heureFin: newService.heureFin,
              statut: 'Planifiée',
              date: dateWithTime, // Date + heure midi pour éviter décalage timezone
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error(`❌ Erreur création service ${servicesCount}:`, errorData);
            throw new Error(`Service ${dayName} - ${errorData.error || 'Erreur inconnue'}`);
          }
          const created = await response.json();
          createdServices.push(created);
        } catch (e) {
          console.error(`❌ ERREUR à la création du service ${servicesCount}:`, e);
          throw e;
        }
      }

      toast({ description: `✅ ${createdServices.length} services créés`, status: 'success' });

      // Rafraîchir les lignes depuis le serveur pour garantir la persistance
      await fetchLignes();

      setNewService({ heureDebut: '', heureFin: '' });
      onAddServiceClose();

      toast({
        title: 'Succès',
        description: `${createdServices.length} services créés pour les jours de fonctionnement (durée: ${(dureeService / 60).toFixed(1)}h)`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le service',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteService = async (serviceId, sensId, ligneId) => {
    try {
      const response = await fetch(`${API_URL}/api/services-hierarchie/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      setLignes(lignes.map(l =>
        l.id === ligneId
          ? {
              ...l,
              sens: (l.sens || []).map(s =>
                s.id === sensId
                  ? { ...s, services: (s.services || []).filter(srv => srv.id !== serviceId) }
                  : s
              )
            }
          : l
      ));

      toast({
        title: 'Succès',
        description: 'Service supprimé',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le service',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteSens = async (sensId, ligneId) => {
    try {
      const response = await fetch(`${API_URL}/api/sens/${sensId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      setLignes(lignes.map(l => 
        l.id === ligneId 
          ? { ...l, sens: (l.sens || []).filter(s => s.id !== sensId) }
          : l
      ));

      toast({
        title: 'Succès',
        description: 'Sens supprimé',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le sens',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteLigne = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/lignes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      setLignes(lignes.filter(l => l.id !== id));
      toast({
        title: 'Succès',
        description: 'Ligne supprimée',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la ligne',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddTrajet = async () => {
    if (!newTrajet.nom) {
      toast({
        title: 'Erreur',
        description: 'Le nom du trajet est obligatoire',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/trajets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ligneId: selectedLigneForTrajet,
          nom: newTrajet.nom,
          description: newTrajet.description,
          statut: 'Actif',
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la création');
      const created = await response.json();

      // Charger les trajets à jour
      await fetchTrajets(selectedLigneForTrajet);
      setNewTrajet({ nom: '', description: '' });
      onAddTrajetClose();

      toast({
        title: 'Succès',
        description: `Trajet ${created.nom} créé`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le trajet',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddArret = async () => {
    if (!newArret.nom) {
      toast({
        title: 'Erreur',
        description: 'Le nom de l\'arrêt est obligatoire',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Trouver la ligneId pour le trajet
      let ligneIdForArret = null;
      
      for (const [currentLigneId, trajetsList] of Object.entries(trajets)) {
        if (Array.isArray(trajetsList)) {
          if (trajetsList.some(t => t.id === selectedTrajetForArret)) {
            ligneIdForArret = currentLigneId;
            break;
          }
        }
      }

      if (!ligneIdForArret) {
        toast({
          title: 'Erreur',
          description: 'Ligne du trajet non trouvée',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/arrets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trajetId: selectedTrajetForArret,
          nom: newArret.nom,
          adresse: newArret.adresse,
          // L'ordre est calculé automatiquement par le backend
          tempsArriveeAntecedent: parseInt(newArret.tempsArriveeAntecedent) || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }
      
      const created = await response.json();

      // Rafraîchir les trajets
      await fetchTrajets(ligneIdForArret);

      setNewArret({ nom: '', adresse: '', tempsArriveeAntecedent: 0 });
      onAddArretClose();

      toast({
        title: 'Succès',
        description: `Arrêt ${created.nom} créé (position ${created.ordre})`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter l\'arrêt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteTrajet = async (trajetId, ligneId) => {
    try {
      const response = await fetch(`${API_URL}/api/trajets/${trajetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      await fetchTrajets(ligneId);

      toast({
        title: 'Succès',
        description: 'Trajet supprimé',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le trajet',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteArret = async (arretId, trajetId, ligneId) => {
    try {
      const response = await fetch(`${API_URL}/api/arrets/${arretId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      await fetchTrajets(ligneId);

      toast({
        title: 'Succès',
        description: 'Arrêt supprimé',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'arrêt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const filteredLignes = lignes.filter(ligne =>
    ligne.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ligne.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="center" justify="center" minH="400px">
          <Spinner size="xl" color="blue.500" />
          <Box>Chargement des lignes...</Box>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Titre */}
        <Box>
          <Heading as="h1" size="2xl" mb={2}>
            📍 Gestion des Lignes (Hiérarchie)
          </Heading>
          <Text color="gray.600" mb={4}>
            Lignes → Sens → Services
          </Text>
          <HStack justify="space-between">
            <Box>Total : <strong>{lignes.length}</strong> lignes</Box>
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={onAddLigneOpen}
            >
              Ajouter une ligne
            </Button>
          </HStack>
        </Box>

        {/* Recherche */}
        <Input
          placeholder="Rechercher par numéro ou nom..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="lg"
        />

        {/* Organigramme des lignes */}
        <VStack spacing={4} align="stretch">
          {filteredLignes.map((ligne) => (
            <Card key={ligne.id} borderLeft="4px" borderLeftColor="blue.500">
              <CardBody>
                {/* Ligne Header */}
                <HStack justify="space-between" mb={expandedLignes[ligne.id] ? 4 : 0} align="center">
                  <HStack flex={1} align="center" spacing={4}>
                    <IconButton
                      icon={expandedLignes[ligne.id] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      onClick={() => toggleExpand(ligne.id)}
                      variant="ghost"
                      size="sm"
                    />
                    <Box flex={1}>
                      <HStack spacing={3} mb={1}>
                        <Heading size="md">{ligne.numero}</Heading>
                        <Text color="gray.600">{ligne.nom}</Text>
                        <Badge colorScheme={ligne.statut === 'Actif' ? 'green' : 'gray'}>
                          {ligne.statut}
                        </Badge>
                      </HStack>
                      <HStack spacing={2} mt={2} fontSize="sm">
                        {parseJSON(ligne.typesVehicules).map((type, idx) => (
                          <Badge key={idx} colorScheme="purple" variant="outline">{type}</Badge>
                        ))}
                        {ligne.heureDebut && (
                          <Badge colorScheme="orange">
                            🕐 {ligne.heureDebut} - {ligne.heureFin}
                          </Badge>
                        )}
                      </HStack>
                    </Box>
                  </HStack>
                  
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      leftIcon={<EditIcon />}
                      onClick={() => handleEditLigne(ligne)}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      leftIcon={<DeleteIcon />}
                      onClick={() => handleDeleteLigne(ligne.id)}
                    >
                      Supprimer
                    </Button>
                  </HStack>
                </HStack>

                {/* Expanded section - Sens */}
                <Collapse in={expandedLignes[ligne.id]} animateOpacity>
                  <Box borderTop="2px" borderTopColor="gray.200" pt={4} mt={4}>
                    {/* Sens list */}
                    <VStack spacing={3} align="stretch" ml={8} mb={4}>
                      {(ligne.sens || []).map((sens) => (
                        <Card key={sens.id} bg="gray.50" borderLeft="3px" borderLeftColor="green.500">
                          <CardBody>
                            {/* Sens Header */}
                            <HStack justify="space-between" mb={expandedSens[sens.id] ? 3 : 0} align="center">
                              <HStack flex={1} align="center" spacing={3}>
                                <IconButton
                                  icon={expandedSens[sens.id] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                  onClick={() => toggleExpandSens(sens.id)}
                                  variant="ghost"
                                  size="xs"
                                />
                                <Box flex={1}>
                                  <HStack spacing={2} mb={1}>
                                    <Heading size="sm">📍 {sens.nom}</Heading>
                                    <Badge colorScheme="green">{sens.statut}</Badge>
                                  </HStack>
                                  {sens.direction && (
                                    <Text fontSize="xs" color="gray.600">{sens.direction}</Text>
                                  )}
                                </Box>
                              </HStack>
                              
                              <HStack spacing={1}>
                                <Button
                                  size="xs"
                                  colorScheme="green"
                                  variant="outline"
                                  leftIcon={<AddIcon />}
                                  onClick={() => {
                                    setSelectedSensForService(sens.id);
                                    setNewService({ heureDebut: '', heureFin: '' });
                                    onAddServiceOpen();
                                  }}
                                >
                                  Service
                                </Button>
                                <Button
                                  size="xs"
                                  colorScheme="red"
                                  variant="outline"
                                  leftIcon={<DeleteIcon />}
                                  onClick={() => handleDeleteSens(sens.id, ligne.id)}
                                >
                                  Supprimer
                                </Button>
                              </HStack>
                            </HStack>

                            {/* Services list */}
                            <Collapse in={expandedSens[sens.id]} animateOpacity>
                              <VStack spacing={2} align="stretch" ml={8} mt={3}>
                                {(sens.services || []).map((service) => (
                                  <Card key={service.id} bg="blue.50" size="sm">
                                    <CardBody>
                                      <HStack justify="space-between" align="center">
                                        <HStack spacing={3}>
                                          <Badge colorScheme="blue">
                                            🕐 {service.heureDebut} - {service.heureFin}
                                          </Badge>
                                          <Badge colorScheme="gray">{service.statut}</Badge>
                                        </HStack>
                                        <Button
                                          size="xs"
                                          colorScheme="red"
                                          variant="ghost"
                                          leftIcon={<DeleteIcon />}
                                          onClick={() => handleDeleteService(service.id, sens.id, ligne.id)}
                                        >
                                          Supprimer
                                        </Button>
                                      </HStack>
                                    </CardBody>
                                  </Card>
                                ))}
                              </VStack>
                            </Collapse>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>

                    {/* Add Sens Button */}
                    <Button
                      leftIcon={<AddIcon />}
                      colorScheme="green"
                      variant="outline"
                      size="sm"
                      ml={8}
                      onClick={() => {
                        setSelectedLigneForSens(ligne.id);
                        setNewSens({ nom: '', direction: '' });
                        onAddSensOpen();
                      }}
                    >
                      Ajouter un sens
                    </Button>

                    {/* Trajets Section */}
                    <Box borderTop="2px" borderTopColor="gray.300" pt={4} mt={6}>
                      <HStack justify="space-between" mb={3} ml={8}>
                        <Heading size="sm">🛣️ Trajets (Itinéraires)</Heading>
                        <Button
                          leftIcon={<AddIcon />}
                          colorScheme="purple"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLigneForTrajet(ligne.id);
                            setNewTrajet({ nom: '', description: '' });
                            onAddTrajetOpen();
                          }}
                        >
                          Ajouter un trajet
                        </Button>
                      </HStack>

                      <VStack spacing={2} align="stretch" ml={8} mt={3}>
                        {(trajets[ligne.id] || []).map((trajet) => (
                          <Card key={trajet.id} bg="purple.50" borderLeft="3px" borderLeftColor="purple.500">
                            <CardBody>
                              <HStack justify="space-between" mb={expandedTrajets[trajet.id] ? 2 : 0} align="center">
                                <HStack flex={1} align="center" spacing={2}>
                                  <IconButton
                                    icon={expandedTrajets[trajet.id] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                    onClick={() => toggleExpandTrajet(trajet.id)}
                                    variant="ghost"
                                    size="xs"
                                  />
                                  <Box flex={1}>
                                    <Heading size="xs">{trajet.nom}</Heading>
                                    {trajet.description && (
                                      <Text fontSize="xs" color="gray.600">{trajet.description}</Text>
                                    )}
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                      {trajet.arrets?.length || 0} arrêt(s)
                                    </Text>
                                  </Box>
                                </HStack>
                                <Button
                                  size="xs"
                                  colorScheme="red"
                                  variant="ghost"
                                  leftIcon={<DeleteIcon />}
                                  onClick={() => handleDeleteTrajet(trajet.id, ligne.id)}
                                >
                                  Supprimer
                                </Button>
                              </HStack>

                              {/* Arrêts list */}
                              <Collapse in={expandedTrajets[trajet.id]} animateOpacity>
                                <VStack spacing={2} align="stretch" ml={6} mt={3}>
                                  {(trajet.arrets || []).map((arret, idx) => (
                                    <Card key={arret.id} bg="white" size="sm" borderLeft="2px" borderLeftColor="purple.300">
                                      <CardBody>
                                        <HStack justify="space-between" align="start" spacing={3}>
                                          <VStack align="start" flex={1} spacing={1}>
                                            <HStack>
                                              <Badge colorScheme="purple" fontSize="xs">
                                                Arrêt {arret.ordre}
                                              </Badge>
                                              <Text fontWeight="bold" fontSize="sm">{arret.nom}</Text>
                                            </HStack>
                                            {arret.adresse && (
                                              <Text fontSize="xs" color="gray.600">📍 {arret.adresse}</Text>
                                            )}
                                            {idx > 0 && (
                                              <Text fontSize="xs" color="blue.600">
                                                ⏱️ +{arret.tempsArriveeAntecedent} min depuis arrêt précédent
                                              </Text>
                                            )}
                                          </VStack>
                                          <Button
                                            size="xs"
                                            colorScheme="red"
                                            variant="ghost"
                                            leftIcon={<DeleteIcon />}
                                            onClick={() => handleDeleteArret(arret.id, trajet.id, ligne.id)}
                                          >
                                            Supprimer
                                          </Button>
                                        </HStack>
                                      </CardBody>
                                    </Card>
                                  ))}
                                  <Button
                                    leftIcon={<AddIcon />}
                                    colorScheme="purple"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => {
                                      setSelectedTrajetForArret(trajet.id);
                                      setNewArret({ nom: '', adresse: '', tempsArriveeAntecedent: 0 });
                                      onAddArretOpen();
                                    }}
                                  >
                                    Ajouter un arrêt
                                  </Button>
                                </VStack>
                              </Collapse>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    </Box>
                  </Box>
                </Collapse>
              </CardBody>
            </Card>
          ))}
        </VStack>
      </VStack>

      {/* Modal - Add/Edit Ligne */}
      <Modal isOpen={isAddLigneOpen || isEditLigneOpen} onClose={isEditLigneOpen ? onEditLigneClose : onAddLigneClose}>
        <ModalOverlay />
        <ModalContent maxW="600px">
          <ModalHeader>{editingLigne ? 'Modifier la ligne' : 'Ajouter une nouvelle ligne'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Numéro de ligne</FormLabel>
                <Input
                  placeholder="Ex: 815"
                  value={editingLigne ? editingLigne.numero : newLigne.numero}
                  onChange={(e) => editingLigne 
                    ? setEditingLigne({ ...editingLigne, numero: e.target.value })
                    : setNewLigne({ ...newLigne, numero: e.target.value })
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Nom de la ligne</FormLabel>
                <Input
                  placeholder="Ex: Gare SNCF - Centre Ville"
                  value={editingLigne ? editingLigne.nom : newLigne.nom}
                  onChange={(e) => editingLigne 
                    ? setEditingLigne({ ...editingLigne, nom: e.target.value })
                    : setNewLigne({ ...newLigne, nom: e.target.value })
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Premier départ du dépôt (HH:mm)</FormLabel>
                <Input
                  type="time"
                  value={editingLigne ? editingLigne.heureDebut : ''}
                  onChange={(e) => editingLigne 
                    ? setEditingLigne({ ...editingLigne, heureDebut: e.target.value })
                    : null
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Dernier arrivé au dépôt (HH:mm)</FormLabel>
                <Input
                  type="time"
                  value={editingLigne ? editingLigne.heureFin : ''}
                  onChange={(e) => editingLigne 
                    ? setEditingLigne({ ...editingLigne, heureFin: e.target.value })
                    : null
                  }
                />
              </FormControl>

              {/* Calendar Section - Only for editing */}
              {editingLigne && (
                <FormControl>
                  <FormLabel>📅 Jours d'exploitation</FormLabel>
                  <HStack spacing={2} wrap="wrap">
                    {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map((jour) => (
                      <Checkbox
                        key={jour}
                        isChecked={editingLigne.calendrier[jour] || false}
                        onChange={(e) => {
                          setEditingLigne({
                            ...editingLigne,
                            calendrier: {
                              ...editingLigne.calendrier,
                              [jour]: e.target.checked,
                            }
                          });
                        }}
                      >
                        {jour.charAt(0).toUpperCase() + jour.slice(1, 3)}
                      </Checkbox>
                    ))}
                  </HStack>
                </FormControl>
              )}

              {/* Constraints Section - Only for editing */}
              {editingLigne && (
                <FormControl>
                  <FormLabel>⚠️ Contraintes</FormLabel>
                  <Text fontSize="xs" color="gray.600" mb={2}>
                    Tapez une contrainte et appuyez sur Entrée (Ex: "Vacances scolaires", "Navette professionnelle")
                  </Text>
                  <HStack spacing={2} mb={2}>
                    {editingLigne.contraintes.map((contrainte, idx) => (
                      <Badge key={idx} colorScheme="orange" display="flex" alignItems="center" gap={1}>
                        {contrainte}
                        <IconButton
                          size="xs"
                          icon={<DeleteIcon />}
                          variant="ghost"
                          onClick={() => {
                            setEditingLigne({
                              ...editingLigne,
                              contraintes: editingLigne.contraintes.filter((_, i) => i !== idx),
                            });
                          }}
                        />
                      </Badge>
                    ))}
                  </HStack>
                  <Input
                    placeholder="Nouvelle contrainte..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        setEditingLigne({
                          ...editingLigne,
                          contraintes: [...editingLigne.contraintes, e.target.value.trim()],
                        });
                        e.target.value = '';
                      }
                    }}
                  />
                </FormControl>
              )}

              {!editingLigne && (
                <FormControl>
                  <FormLabel>Types de véhicules</FormLabel>
                  <Stack spacing={2}>
                    {typesVehicules.map((type) => (
                      <Checkbox
                        key={type}
                        isChecked={newLigne.typesVehicules.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewLigne({
                              ...newLigne,
                              typesVehicules: [...newLigne.typesVehicules, type],
                            });
                          } else {
                            setNewLigne({
                              ...newLigne,
                              typesVehicules: newLigne.typesVehicules.filter(t => t !== type),
                            });
                          }
                        }}
                      >
                        {type}
                      </Checkbox>
                    ))}
                  </Stack>
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={editingLigne ? onEditLigneClose : onAddLigneClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={editingLigne ? handleUpdateLigne : handleAddLigne}>
              {editingLigne ? 'Modifier' : 'Ajouter'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal - Add Sens */}
      <Modal isOpen={isAddSensOpen} onClose={onAddSensClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ajouter un sens</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Nom du sens</FormLabel>
                <Input
                  placeholder="Ex: Aller, Retour, Bidirectionnel"
                  value={newSens.nom}
                  onChange={(e) => setNewSens({ ...newSens, nom: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Direction (optionnel)</FormLabel>
                <Input
                  placeholder="Ex: Gare SNCF → Centre Ville"
                  value={newSens.direction}
                  onChange={(e) => setNewSens({ ...newSens, direction: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddSensClose}>
              Annuler
            </Button>
            <Button colorScheme="green" onClick={handleAddSens}>
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal - Add Service */}
      <Modal isOpen={isAddServiceOpen} onClose={onAddServiceClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ajouter un service</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Heure de début (HH:mm)</FormLabel>
                <Input
                  type="time"
                  value={newService.heureDebut}
                  onChange={(e) => setNewService({ ...newService, heureDebut: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Heure de fin (HH:mm)</FormLabel>
                <Input
                  type="time"
                  value={newService.heureFin}
                  onChange={(e) => setNewService({ ...newService, heureFin: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddServiceClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={handleAddService}>
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal - Add Trajet */}
      <Modal isOpen={isAddTrajetOpen} onClose={onAddTrajetClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ajouter un trajet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Nom du trajet</FormLabel>
                <Input
                  placeholder="Ex: Gare SNCF - Centre Ville"
                  value={newTrajet.nom}
                  onChange={(e) => setNewTrajet({ ...newTrajet, nom: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description (optionnel)</FormLabel>
                <Input
                  placeholder="Ex: Trajet aller en priorité scolaire"
                  value={newTrajet.description}
                  onChange={(e) => setNewTrajet({ ...newTrajet, description: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddTrajetClose}>
              Annuler
            </Button>
            <Button colorScheme="purple" onClick={handleAddTrajet}>
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal - Add Arrêt */}
      <Modal isOpen={isAddArretOpen} onClose={onAddArretClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ajouter un arrêt</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Nom de l'arrêt</FormLabel>
                <Input
                  placeholder="Ex: Gare SNCF"
                  value={newArret.nom}
                  onChange={(e) => setNewArret({ ...newArret, nom: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Adresse (optionnel)</FormLabel>
                <Input
                  placeholder="Ex: Place de la Gare"
                  value={newArret.adresse}
                  onChange={(e) => setNewArret({ ...newArret, adresse: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Temps d'arrivée depuis l'arrêt précédent (minutes)</FormLabel>
                <Input
                  type="number"
                  placeholder="0"
                  value={newArret.tempsArriveeAntecedent}
                  onChange={(e) => setNewArret({ ...newArret, tempsArriveeAntecedent: parseInt(e.target.value) || 0 })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddArretClose}>
              Annuler
            </Button>
            <Button colorScheme="purple" onClick={handleAddArret}>
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default LignesHierarchie;
