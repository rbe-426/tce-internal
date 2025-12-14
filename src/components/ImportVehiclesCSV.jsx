import React, { useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Text,
  useToast,
  Box,
  Code,
  Divider,
} from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';
import { API_URL } from '../config';

const ImportVehiclesCSV = ({ isOpen, onClose, onSuccess }) => {
  const fileInputRef = useRef(null);
  const toast = useToast();

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/import/vehicles`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Erreur lors de l'import (${response.status})`);
      }

      toast({
        title: 'Import réussi',
        description: `${result.imported} véhicule(s) importé(s) avec succès`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur import:', error);
      toast({
        title: 'Erreur lors de l\'import',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = `parc,type,modele,immat,km,tauxSante,statut,annee,boite,moteur,portes,girouette,clim,pmr,ct
VEH001,TCP - Autobus Standard,Irisbus Citaro,AB-123-CD,125000,85,Actif,2015,Automatique,Diesel,2,Oui,Oui,Oui,2024-09-15
VEH002,TCP - Autobus articulé,Van Hool AG300,AB-124-CD,98000,92,Actif,2017,Automatique,Diesel,3,Oui,Oui,Oui,2024-08-10
VEH003,TCP - Midibus,Iveco Urbanway,AB-125-CD,156000,78,Entretien,2013,Manuelle,Diesel,2,Non,Oui,Non,2024-07-20
VEH004,TCP - Minibus,Renault Master,AB-126-CD,89000,88,Actif,2018,Automatique,Diesel,1,Non,Non,Oui,2024-10-05
VEH005,TCP - Autocars BC/NOC/EXPRESS,Scania K360,AB-127-CD,234000,95,Actif,2016,Automatique,Diesel,3,Oui,Oui,Non,2024-06-30
VEH006,TCP - Autobus Standard BHNS,Citaro BHNS,AB-128-CD,112000,90,Actif,2019,Automatique,Diesel,2,Oui,Oui,Oui,2024-11-15
VEH007,TCP - Autobus articulé BHNS,Van Hool BHNS,AB-129-CD,145000,87,Actif,2020,Automatique,Diesel,3,Oui,Oui,Oui,2024-12-01
VEH008,TCP - Midibus L (Heuliez),Heuliez BUS 300,AB-130-CD,167000,82,Suspendu,2014,Automatique,Diesel,2,Non,Oui,Non,2024-05-25`;

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/csv;charset=utf-8,' + encodeURIComponent(template)
    );
    element.setAttribute('download', 'template_vehicles.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Importer des véhicules (CSV)</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={2}>
                Format attendu du CSV :
              </Text>
              <Code display="block" p={2} borderRadius="md" overflow="auto" fontSize="xs" whiteSpace="pre-wrap">
                {`parc,type,modele,immat,km,tauxSante,statut,annee,boite,moteur,portes,girouette,clim,pmr,ct
VEH001,TCP - Autobus Standard,Irisbus Citaro,AB-123-CD,125000,85,Actif,2015,Automatique,Diesel,2,Oui,Non,Oui,2024-09-15`}
              </Code>
            </Box>

            <Box fontSize="sm" color="gray.600">
              <Text mb={1} fontWeight="bold">Colonnes requises :</Text>
              <Text ml={4} mb={2}>
                parc, type, modele, immat, km, tauxSante, statut
              </Text>

              <Text mb={1} fontWeight="bold">Colonnes optionnelles :</Text>
              <Text ml={4} mb={2}>
                annee, boite, moteur, portes, girouette, clim, pmr, ct
              </Text>

              <Divider my={2} />

              <Text mb={1}>
                <strong>Types de bus :</strong> TCP - Autocars BC/NOC/EXPRESS, TCP - Autobus Standard, TCP - Autobus articulé, TCP - Autobus Standard BHNS, TCP - Autobus articulé BHNS, TCP - Midibus, TCP - Midibus L (Heuliez), TCP - Minibus
              </Text>
              <Text mb={1}>
                <strong>Statut :</strong> Actif, Suspendu, Entretien, Retiré
              </Text>
              <Text mb={1}>
                <strong>Boîte :</strong> Automatique, Manuelle
              </Text>
              <Text mb={1}>
                <strong>Moteur :</strong> Diesel, Électrique, Hybride
              </Text>
              <Text mb={1}>
                <strong>PMR :</strong> Oui, Non
              </Text>
              <Text mb={1}>
                <strong>Girouette/Clim :</strong> Oui, Non
              </Text>
              <Text>
                <strong>CT (Contrôle technique) :</strong> Format date YYYY-MM-DD (ex: 2024-09-15)
              </Text>
            </Box>

            <Divider />

            <FormControl>
              <FormLabel htmlFor="csv-file">Sélectionner un fichier CSV</FormLabel>
              <Input
                id="csv-file"
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                p={1}
              />
            </FormControl>

            <Button
              leftIcon={<DownloadIcon />}
              colorScheme="blue"
              variant="outline"
              onClick={downloadTemplate}
              size="sm"
            >
              Télécharger le modèle
            </Button>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Fermer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImportVehiclesCSV;
