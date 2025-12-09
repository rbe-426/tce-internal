import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FRAISE from './pages/FRAISE';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Vehicules from './pages/abribus/Vehicules';
import VehiculeDetail from './pages/abribus/Vehicule';
import Atelier from './pages/abribus/Atelier';
import NotFound from './pages/NotFound';
import MainLayout from './layouts/MainLayout';
import MonProfil from "./pages/MonProfil";
import MaMessagerie from "./pages/MaMessagerie";
import MonCasier from "./pages/MonCasier";
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


function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
      <Route path="/fraise" element={<MainLayout><FRAISE /></MainLayout>} />
      <Route path="/jurhe" element={<MainLayout><JURHE /></MainLayout>} />
      <Route path="/tc360" element={<MainLayout><TC360 /></MainLayout>} />
      <Route path="/abribus" element={<MainLayout><AbribusHome /></MainLayout>} />
      <Route path="/mon-profil" element={<MainLayout><MonProfil /></MainLayout>} />
      <Route path="/ma-messagerie" element={<MainLayout><MaMessagerie /></MainLayout>} />
      <Route path="/mon-casier" element={<MainLayout><MonCasier /></MainLayout>} />
      <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
      <Route path="/abribus/vehicules" element={<MainLayout><Vehicules /></MainLayout>} />
      <Route path="/abribus/vehicule/:parc" element={<VehiculeDetail />} />
      <Route path="/abribus/atelier" element={<MainLayout><Atelier /></MainLayout>} />
      <Route path="/abribus/statistiques" element={<MainLayout><Statistiques /></MainLayout>} />
      <Route path="/abribus/vehicule/:parc/edit" element={<VehiculeEdit />} />
      <Route path="/abribus/lignes" element={<MainLayout><Lignes /></MainLayout>} />
      <Route path="/abribus/lignes-hierarchie" element={<MainLayout><LignesHierarchie /></MainLayout>} />
      <Route path="/abribus/plannings" element={<MainLayout><Plannings /></MainLayout>} />
      <Route path="/abribus/conducteurs" element={<MainLayout><GestionConducteurs /></MainLayout>} />
      <Route path="/abribus/saeiv" element={<MainLayout><SAEIV /></MainLayout>} />
    </Routes>
  );
}

export default App;
