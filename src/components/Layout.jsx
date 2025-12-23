// src/components/Layout.jsx
import React from 'react';
import { Box } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import NotificationBanner from '../components/NotificationBanner';

const Layout = ({ children }) => {
  const location = useLocation();

  // Logo en fonction de l’URL
  const getLogoByPath = () => {
    if (location.pathname.startsWith('/exploitation')) return '/src/assets/mwj_exploitation.png';
    if (location.pathname.startsWith('/vtc')) return '/src/assets/mwj_vtc.png';
    if (location.pathname.startsWith('/import-export')) return '/src/assets/mwj_ie.png';
    if (location.pathname.startsWith('/achats')) return '/src/assets/mwj_ar.png';
    return '/src/assets/mwj_intranet.png';
  };

  return (
    <Box>
      <Header logo={getLogoByPath()} />
      {children}
    </Box>
  );
};

export default Layout;
