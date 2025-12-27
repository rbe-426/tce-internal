import React from 'react';
import { Box } from '@chakra-ui/react';

const BusIcon = ({ color = 'currentColor', boxSize = '32px' }) => {
  return (
    <Box as="svg" width={boxSize} height={boxSize} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      {/* Carrosserie principale du bus */}
      <rect x="50" y="120" width="380" height="200" rx="30" fill={color} />
      
      {/* Fenêtre avant gauche */}
      <rect x="80" y="140" width="100" height="70" rx="10" fill="white" />
      
      {/* Fenêtre avant droit */}
      <rect x="260" y="140" width="100" height="70" rx="10" fill="white" />
      
      {/* Fenêtre arrière */}
      <rect x="160" y="230" width="80" height="60" rx="8" fill="white" opacity="0.6" />
      
      {/* Roue avant gauche */}
      <circle cx="100" cy="340" r="35" fill={color} stroke="white" strokeWidth="8" />
      <circle cx="100" cy="340" r="20" fill="white" />
      
      {/* Roue avant droit */}
      <circle cx="380" cy="340" r="35" fill={color} stroke="white" strokeWidth="8" />
      <circle cx="380" cy="340" r="20" fill="white" />
      
      {/* Phare avant gauche */}
      <circle cx="60" cy="165" r="12" fill="white" opacity="0.8" />
      
      {/* Phare avant droit */}
      <circle cx="420" cy="165" r="12" fill="white" opacity="0.8" />
      
      {/* Pare-chocs avant */}
      <rect x="50" y="310" width="380" height="25" fill={color} opacity="0.8" />
      
      {/* Porte du bus */}
      <g>
        <rect x="200" y="240" width="70" height="80" rx="5" fill="white" opacity="0.4" stroke="white" strokeWidth="2" />
        <circle cx="235" cy="290" r="6" fill="white" opacity="0.6" />
      </g>
    </Box>
  );
};

export default BusIcon;
