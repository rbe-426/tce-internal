import React, { useContext } from 'react';
import {
  Box,
  Flex,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Image,
  Icon,
  Center,
} from '@chakra-ui/react';
import { UserContext } from '../context/UserContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import NotificationBell from './NotificationBell';

import abriBusLogo from '../assets/ABRIBUS.png';
import logoIntranet from '../assets/wbm_intranet.png';
import logoExploitation from '../assets/mwj_exploitation.png';
import logoFraise from '../assets/wbm_fraise.png';
import logoJurhe from '../assets/wbm_jurhe.png';
import logoAbribus from '../assets/wbm_abribus.png';
import logoTC360 from '../assets/wbm_tc960.png';

const Header = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  // Section actuelle d'après l'URL
  const section = location.pathname.split('/')[1];

  // Logo central dynamique
  let logoToDisplay = logoIntranet;
  if (section === 'exploitation') logoToDisplay = logoExploitation;
  else if (section === 'fraise') logoToDisplay = logoFraise;
  else if (section === 'jurhe') logoToDisplay = logoJurhe;
  else if (section === 'abribus') logoToDisplay = logoAbribus;
  else if (section === 'tc360') logoToDisplay = logoTC360;

  return (
    <Box fontFamily="Montserrat">
      {/* Bande supérieure */}
      <Flex
        bg="gray.700"
        color="white"
        align="center"
        height="90px"
        justify="center"
        position="relative"
        zIndex="4"
      >
        {/* Logo fixe à gauche (collé à la bordure) */}
        <Image
          src={abriBusLogo}
          alt="Abribus du groupe"
          height="90px"
          position="absolute"
          left="0"
          top="0"
          objectFit="contain"
        />

        {/* Logo central dynamique */}
        <Center flex="1" height="100%">
          <Image
            src={logoToDisplay}
            alt="Logo section"
            height="125px"
            objectFit="contain"
            mt="10px"
          />
        </Center>

        {/* Menu utilisateur à droite */}
        <Box position="absolute" right="20px" top="50%" transform="translateY(-50%)">
          <Flex align="center" gap={2}>
            {/* Cloche de notifications */}
            <NotificationBell />
            
            {/* Menu utilisateur */}
            <Menu>
              <MenuButton
                _hover={{ cursor: 'pointer', color: 'black', bg: 'gray.300' }}
                color="white"
                fontWeight="semibold"
              >
                Bonjour, {user ? `${user.prenom} ${user.nom.toUpperCase()}` : 'Invité'}
              </MenuButton>
            <MenuList
              bg="white"
              color="black"
              borderColor="gray.300"
              minWidth="160px"
              fontWeight="semibold"
              zIndex="999"
            >
              <MenuItem as={Link} to="/MonProfil" _hover={{ bg: 'gray.800', color: 'white' }}>
                Mon Profil
              </MenuItem>
              <MenuItem as={Link} to="/MaMessagerie" _hover={{ bg: 'gray.800', color: 'white' }}>
                Ma Messagerie
              </MenuItem>
              <MenuItem as={Link} to="/MonCasier" _hover={{ bg: 'gray.800', color: 'white' }}>
                Mon Casier
              </MenuItem>
              <MenuItem as={Link} to="/parametres-site" _hover={{ bg: 'gray.800', color: 'white' }}>
                ⚙️ Paramètres du site
              </MenuItem>
              <MenuItem
                onClick={handleLogout}
                _hover={{ bg: 'red.700', color: 'white' }}
                color="red.600"
                fontWeight="bold"
              >
                Déconnexion
              </MenuItem>
            </MenuList>
            </Menu>
          </Flex>
        </Box>
      </Flex>

      {/* Bande inférieure */}
      <Flex
        bg="white"
        color="black"
        px={10}
        py={2}
        gap={6}
        justify="center"
        fontWeight="bold"
        align="center"
        borderBottom="1px solid #ccc"
        position="relative"
        zIndex="1"
      >
        <Link to="/dashboard">
          <Icon
            as={FaHome}
            boxSize={6}
            color="black"
            _hover={{ color: 'white', bg: 'gray.800', borderRadius: 'md' }}
            p={1}
          />
        </Link>

        {/* Menu Exploitation */}
        <Link to="/abribus">
  <Text
    px={3}
    py={1}
    borderRadius="md"
    _hover={{ color: 'white', bg: 'gray.800', cursor: 'pointer' }}
  >
    ABRIBUS
  </Text>
</Link>

        {/* Lien FRAISE */}
        <Link to="/fraise">
          <Text
            px={3}
            py={1}
            borderRadius="md"
            _hover={{ color: 'white', bg: 'gray.800', cursor: 'pointer' }}
          >
            FRAISE
          </Text>
        </Link>

        {/* Lien Stats */}
        <Link to="/abribus/statistiques">
          <Text
            px={3}
            py={1}
            borderRadius="md"
            _hover={{ color: 'white', bg: 'gray.800', cursor: 'pointer' }}
          >
            Statistiques
          </Text>
        </Link>

        {/* Lien JURHE */}
        <Link to="/jurhe">
          <Text
            px={3}
            py={1}
            borderRadius="md"
            _hover={{ color: 'white', bg: 'gray.800', cursor: 'pointer' }}
          >
            JURHE
          </Text>
        </Link>

        {/* Lien TC 360+ */}
        <Link to="/tc360">
          <Text
            px={3}
            py={1}
            borderRadius="md"
            _hover={{ color: 'white', bg: 'gray.800', cursor: 'pointer' }}
            display="flex"
            alignItems="center"
            gap={0}
          >
            <span style={{ color: 'black' }}>TC 360</span>
            <span style={{ color: '#ff8888', fontStyle: 'italic', marginLeft: '2px' }}>+</span>
          </Text>
        </Link>
      </Flex>
    </Box>
  );
};

export default Header;
