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

const ImportLignesCSV = ({ isOpen, onClose, onSuccess }) => {
  const fileInputRef = useRef(null);
  const toast = useToast();

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/import/lignes`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Erreur lors de l'import (${response.status})`);
      }

      toast({
        title: 'Import réussi',
        description: `${result.imported} ligne(s) importée(s) avec succès`,
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
    const template = `[LIGNES]
numéro de ligne,Nom de la ligne,Jours de fonctionnement,type,premier départ,dernier arrivé au dépôt,Sens,Direction,Trajet,Description Trajet,Service 1 Début,Service 1 Fin,Service 2 Début,Service 2 Fin
4201,SEMAINE_4201,L; M; M; J; V,Standard,04h37,00h10,Aller,Gare SNCF → Centre Ville,Gare-Centre,Itinéraire gare vers centre,06h30,14h00,14h30,22h45
4201,SEMAINE_4201,L; M; M; J; V,Standard,04h37,00h10,Retour,Centre Ville → Gare SNCF,Centre-Gare,Retour vers la gare,07h00,15h00,15h30,23h00
4202,SEMAINE_4202,L; M; M; J; V,Articulés,05h00,23h30,Aller,Aéroport → Centre,Aero-Centre,Vers le centre depuis aéroport,06h00,15h30,16h00,23h00
4202,SEMAINE_4202,L; M; M; J; V,Articulés,05h00,23h30,Retour,Centre → Aéroport,Centre-Aero,Vers aéroport depuis centre,06h30,16h00,16h30,23h30

[ARRETS]
Trajet,Ordre,Nom Arrêt,Temps depuis arrêt précédent (min)
Gare-Centre,1,Gare SNCF,0
Gare-Centre,2,Place Centrale,5
Gare-Centre,3,Marché,3
Gare-Centre,4,Centre Ville,2
Centre-Gare,1,Marché,0
Centre-Gare,2,Place Centrale,3
Centre-Gare,3,Gare SNCF,5
Aero-Centre,1,Aéroport,0
Aero-Centre,2,Route Nationale,8
Aero-Centre,3,Centre Ville,7
Centre-Aero,1,Centre Ville,0
Centre-Aero,2,Route Nationale,7
Centre-Aero,3,Aéroport,8`;

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:text/csv;charset=utf-8,' + encodeURIComponent(template)
    );
    element.setAttribute('download', 'template_lignes.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Importer des lignes (CSV)</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={2}>
                Format attendu du CSV (deux sections) :
              </Text>
              <Code display="block" p={2} borderRadius="md" overflow="auto" fontSize="xs" whiteSpace="pre-wrap">
                {`[LIGNES]
numéro de ligne,Nom de la ligne,Jours...,type,premier départ,dernier arrivé...,Sens,Direction,Trajet,Description Trajet,Service 1 Début,Service 1 Fin
4201,SEMAINE_4201,L; M; M; J; V,autobus,04h37,00h10,Aller,Gare SNCF → Centre,Gare-Centre,Itinéraire,06h30,14h00

[ARRETS]
Trajet,Ordre,Nom Arrêt,Temps depuis arrêt précédent (min)
Gare-Centre,1,Gare SNCF,0
Gare-Centre,2,Place Centrale,5`}
              </Code>
            </Box>

            <Box fontSize="sm" color="gray.600">
              <Text mb={1} fontWeight="bold">Section [LIGNES] - Colonnes requises :</Text>
              <Text ml={4} mb={2}>
                numéro de ligne, Nom de la ligne, Jours de fonctionnement, type, premier départ, dernier arrivé au dépôt
              </Text>
              
              <Text mb={1} fontWeight="bold">Section [LIGNES] - Colonnes optionnelles :</Text>
              <Text ml={4} mb={2}>
                Sens, Direction, Trajet (nom unique), Description Trajet, Service 1-20 Début/Fin
              </Text>

              <Text mb={1} fontWeight="bold">Section [ARRETS] - Colonnes requises :</Text>
              <Text ml={4} mb={2}>
                Trajet (nom du trajet), Ordre, Nom Arrêt, Temps depuis arrêt précédent (min)
              </Text>

              <Divider my={2} />

              <Text mb={1}>
                <strong>Jours :</strong> Format "L; M; M; J; V; S; D" (séparés par point-virgule et espace)
              </Text>
              <Text mb={1}>
                <strong>Heures :</strong> Format HHhMM (ex: 06h30, 14h00)
              </Text>
              <Text mb={1}>
                <strong>Type :</strong> Standard, Articulés, Midibus, minibus, Standard BHNS, Articulés BHNS
              </Text>
              <Text mb={1}>
                <strong>Trajet :</strong> Doit être unique et utilisé dans la section [ARRETS] pour lier les arrêts
              </Text>
              <Text>
                <strong>Ordre des arrêts :</strong> Numéroté séquentiellement par trajet (1, 2, 3, ...)
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

export default ImportLignesCSV;
