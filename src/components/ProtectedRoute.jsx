import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const ProtectedRoute = ({ children }) => {
  const { user, ready } = useContext(UserContext);

  // Tant que le chargement du user (localStorage) n'est pas fait, on ne redirige pas
  if (!ready) return null;

  // Si pas d'utilisateur connecté, rediriger vers login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
