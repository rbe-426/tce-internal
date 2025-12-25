import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FRAISE from './pages/FRAISE';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Vehicules from './pages/abribus/Vehicules';
import VehiculeDetail from './pages/abribus/Vehicule';
import Atelier from './pages/abribus/Atelier';
import AtelierManager from './pages/abribus/AtelierManager';
import NotFound from './pages/NotFound';
import MainLayout from './layouts/MainLayout';
import MonProfil from "./pages/MonProfil";
import MaMessagerie from "./pages/MaMessagerie";
import MonCasier from "./pages/MonCasier";
import DiffusionInformations from "./pages/DiffusionInformations";
import JURHE from './pages/jurhe';
import TC360 from './pages/TC360';
import AbribusHome from './pages/AbribusHome';
import Statistiques from './pages/abribus/Statistiques';
import VehiculeEdit from "./pages/abribus/VehiculeEdit.jsx";
import Lignes from './pages/abribus/Lignes';
import LignesHierarchie from './pages/abribus/LignesHierarchie';
import Plannings from './pages/abribus/Plannings';
import GestionConducteurs from './pages/abribus/GestionConducteurs';
import SAEIV from './pages/abribus/SAEIV';
import Etablissements from './pages/abribus/Etablissements';
import EtablissementDetail from './pages/abribus/EtablissementDetail';
import PersonnelDepot from './pages/abribus/PersonnelDepot';
import VehicleMercatos from './pages/abribus/VehicleMercatos';
import VehicleNeeds from './pages/abribus/VehicleNeeds';
import InterDepotAuthorization from './pages/abribus/InterDepotAuthorization';
import AssignLinesToDepot from './pages/abribus/AssignLinesToDepot';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/fraise" element={<ProtectedRoute><MainLayout><FRAISE /></MainLayout></ProtectedRoute>} />
      <Route path="/jurhe" element={<ProtectedRoute><MainLayout><JURHE /></MainLayout></ProtectedRoute>} />
      <Route path="/tc360" element={<ProtectedRoute><MainLayout><TC360 /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus" element={<ProtectedRoute><MainLayout><AbribusHome /></MainLayout></ProtectedRoute>} />
      <Route path="/mon-profil" element={<ProtectedRoute><MainLayout><MonProfil /></MainLayout></ProtectedRoute>} />
      <Route path="/ma-messagerie" element={<ProtectedRoute><MainLayout><MaMessagerie /></MainLayout></ProtectedRoute>} />
      <Route path="/mon-casier" element={<ProtectedRoute><MainLayout><MonCasier /></MainLayout></ProtectedRoute>} />
      <Route path="/parametres-site" element={<ProtectedRoute><MainLayout><DiffusionInformations /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus/vehicules" element={<ProtectedRoute><MainLayout><Vehicules /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus/vehicule/:parc" element={<ProtectedRoute><VehiculeDetail /></ProtectedRoute>} />
      <Route path="/abribus/atelier" element={<ProtectedRoute><MainLayout><AtelierManager /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus/statistiques" element={<ProtectedRoute><MainLayout><Statistiques /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus/vehicule/:parc/edit" element={<ProtectedRoute><VehiculeEdit /></ProtectedRoute>} />
      <Route path="/abribus/lignes" element={<ProtectedRoute><MainLayout><Lignes /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus/lignes-hierarchie" element={<ProtectedRoute><MainLayout><LignesHierarchie /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus/plannings" element={<ProtectedRoute><MainLayout><Plannings /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus/conducteurs" element={<ProtectedRoute><MainLayout><GestionConducteurs /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus/saeiv" element={<ProtectedRoute><MainLayout><SAEIV /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus/etablissements" element={<ProtectedRoute><MainLayout><Etablissements /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus/etablissement/:id" element={<ProtectedRoute><MainLayout><EtablissementDetail /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus/personnel" element={<ProtectedRoute><MainLayout><PersonnelDepot /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus/mercatos" element={<ProtectedRoute><MainLayout><VehicleMercatos /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus/besoins-vehicules" element={<ProtectedRoute><MainLayout><VehicleNeeds /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus/autorisations-inter-depots" element={<ProtectedRoute><MainLayout><InterDepotAuthorization /></MainLayout></ProtectedRoute>} />
      <Route path="/abribus/affecter-lignes" element={<ProtectedRoute><MainLayout><AssignLinesToDepot /></MainLayout></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
