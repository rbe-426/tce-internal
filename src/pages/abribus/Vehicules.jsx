import { Link } from "react-router-dom";
import { FaWheelchair } from "react-icons/fa";
import React, { useState, useEffect } from "react";
import { useDisclosure, useToast } from "@chakra-ui/react";
import { vehiculesBase } from "../../data/vehiculesBase.js";
import { API_URL } from "../../config";
import ImportVehiclesCSV from "../../components/ImportVehiclesCSV";

const API = API_URL;

const getStatusColor = (statut) => {
  switch (statut) {
    case "Disponible":
      return "#096943";
    case "Indisponible":
    case "Aux Ateliers":
      return "#ff1900ff";
    case "Affecté":
      return "#0080f8ff";
    case "Au CT":
      return "#ff9100ff";
    case "Réformé":
    case "A VENIR":
      return "#000000ff";
    default:
      return "#7f8c8d";
  }
};

const Vehicules = () => {
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [etablissements, setEtablissements] = useState([]);
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
  const { isOpen: isMercatoOpen, onOpen: onMercatoOpen, onClose: onMercatoClose } = useDisclosure();
  const toast = useToast();
  
  // State for mercato modal
  const [mercatoModal, setMercatoModal] = useState({
    vehicleParc: '',
    depotDestinationId: '',
    motif: ''
  });
  const [selectedVehicleForMercato, setSelectedVehicleForMercato] = useState(null);

  // Formulaire d'ajout (on garde tes champs, même si tous ne partent pas au backend)
  const [newVeh, setNewVeh] = useState({
    parc: "",
    type: "",
    modele: "",
    immat: "",
    km: "",
    tauxSante: "",     // correspond à ton "etat" visuel
    statut: "",
    annee: "",
    boite: "",
    moteur: "",
    portes: "",
    girouette: "",
    clim: "",
    pmr: false,
    ct: "",
    etablissementId: "",
    photos: [],
  });

  // Fonction pour charger les véhicules
  const fetchVehicles = async () => {
    try {
      const r = await fetch(`${API}/api/vehicles`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setVehicles(data);
      localStorage.setItem("vehicules_cache", JSON.stringify(data));
    } catch (e) {
      // Fallback si API KO : cache localStorage puis vehiculesBase
      const cache = localStorage.getItem("vehicules_cache");
      if (cache) {
        setVehicles(JSON.parse(cache));
      } else {
        setVehicles(vehiculesBase || []);
      }
      setErr("API indisponible, affichage du cache/local.");
      console.error("Fetch vehicles failed:", e);
    }
  };

  // 1) Charger depuis l'API (persistance) avec fallback local
  useEffect(() => {
    let alive = true;
    (async () => {
      await fetchVehicles();
      // Charger aussi les établissements pour le mercato
      try {
        const res = await fetch(`${API}/api/etablissements`);
        if (res.ok) {
          const data = await res.json();
          setEtablissements(data.filter(d => d.type === 'Dépôt'));
        }
      } catch (e) {
        console.error('Erreur chargement établissements:', e);
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; }
  }, []);

  // 2) Filtre simple par parc
  const filteredVehicles = vehicles.filter((v) =>
    String(v.parc || "").toLowerCase().includes(search.toLowerCase())
  );

  // 3) Listes pour tes selects
  const vehicleStatus = [
    "Disponible",
    "Indisponible",
    "Aux Ateliers",
    "Affecté",
    "Au CT",
    "Réformé",
    "A VENIR",
  ];

  // Charger les types de véhicules depuis l'API
  useEffect(() => {
    const loadVehicleTypes = async () => {
      try {
        const res = await fetch(`${API}/api/vehicle-types`);
        if (res.ok) {
          const data = await res.json();
          setVehicleTypes(data.types || []);
        }
      } catch (e) {
        console.error('Erreur chargement types véhicules:', e.message);
      }
    };
    loadVehicleTypes();
  }, []);

  // Charger les établissements
  useEffect(() => {
    const loadEtablissements = async () => {
      try {
        const res = await fetch(`${API}/api/etablissements`);
        if (res.ok) {
          const data = await res.json();
          setEtablissements(data || []);
        }
      } catch (e) {
        console.error('Erreur chargement établissements:', e.message);
      }
    };
    loadEtablissements();
  }, []);

  // 4) Form handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "photos" && files) {
      // Pas d'upload côté backend pour l'instant : on garde en prévisualisation
      const urls = Array.from(files).map((f) => URL.createObjectURL(f));
      setNewVeh((prev) => ({ ...prev, photos: urls }));
      return;
    }
    setNewVeh((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 5) Ajouter un véhicule (POST sur l'API) → persistant en DB
const handleAddVehicle = async () => {
  const v = { ...newVeh };

  // Champs obligatoires
  if (!v.parc || !v.type || !v.modele || !v.immat) {
    alert("Merci de remplir Parc, Type, Modèle, Immat.");
    return;
  }

  // Normalisation → conforme au schéma Prisma
  const payload = {
    parc: String(v.parc).trim(),
    type: v.type,
    modele: v.modele,
    immat: v.immat.toUpperCase(),
    km: Number.isFinite(Number(v.km)) ? Number(v.km) : 0,
    tauxSante: Number.isFinite(Number(v.tauxSante)) ? Number(v.tauxSante) : 100,
    statut: v.statut || "Disponible",
    etablissementId: v.etablissementId || null,

    // champs additionnels synchronisés
    annee: v.annee !== "" ? Number(v.annee) : null,
    boite: v.boite || null,
    moteur: v.moteur || null,
    portes: v.portes !== "" ? Number(v.portes) : null,
    girouette: v.girouette || null,
    clim: v.clim || null,
    pmr: !!v.pmr,
    ct: v.ct || null, // converti côté serveur
    photos: Array.isArray(v.photos) ? v.photos : [],
  };

  try {
  const res = await fetch(`${API}/api/vehicles`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});


    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(`POST /api/vehicles: ${res.status} ${msg}`);
    }

    const saved = await res.json();

    // MAJ état + cache
    setVehicles((prev) => {
      const next = [...prev.filter(x => String(x.parc) !== String(saved.parc)), saved]
        .sort((a, b) => String(a.parc).localeCompare(String(b.parc)));
      localStorage.setItem("vehicules_cache", JSON.stringify(next));
      return next;
    });

    // Reset formulaire + fermer la modale
    setNewVeh({
      parc: "", type: "", modele: "", immat: "",
      km: "", tauxSante: "", statut: "",
      annee: "", boite: "", moteur: "", portes: "",
      girouette: "", clim: "", pmr: false, ct: "", photos: [],
    });
    setShowAddModal(false);

  } catch (e) {
    console.error("Erreur ajout/maj véhicule →", e);

    // Fallback : on ajoute quand même dans l’UI + cache local
    // (au prochain chargement avec API up, tu pourras resoumettre)
    setVehicles((prev) => {
      const next = [...prev.filter(x => String(x.parc) !== String(payload.parc)), payload]
        .sort((a, b) => String(a.parc).localeCompare(String(b.parc)));
      localStorage.setItem("vehicules_cache", JSON.stringify(next));
      return next;
    });

    alert("API indisponible : véhicule ajouté en cache local. Il sera à resynchroniser quand l’API sera de nouveau en ligne.");
    setShowAddModal(false);
  }
};


  if (loading) return <p style={{ padding: 24 }}>Chargement…</p>;

  return (
    <>
      <main
        style={{
          padding: "24px",
          fontFamily: "Montserrat",
          backgroundColor: "#f0f4f8",
          minHeight: "calc(100vh - 160px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "960px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h1 style={{ fontWeight: "700", fontSize: "2rem", color: "#2c3e50" }}>
            Page des véhicules
          </h1>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={onImportOpen}
              style={{
                padding: "10px 22px",
                fontWeight: "600",
                fontSize: "1rem",
                color: "#fff",
                backgroundColor: "#27ae60",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 3px 8px rgba(39, 174, 96, 0.5)",
              }}
            >
              Importer CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: "10px 22px",
                fontWeight: "600",
                fontSize: "1rem",
                color: "#fff",
                backgroundColor: "#2980b9",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 3px 8px rgba(41, 128, 185, 0.5)",
              }}
            >
              Déclarer un véhicule sur le Parc
            </button>
          </div>
        </div>

        {err && (
          <div style={{ color: "#c0392b", marginBottom: 12 }}>
            {err}
          </div>
        )}

        <input
          type="text"
          placeholder="Recherche par numéro de parc"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            marginBottom: "20px",
            padding: "12px 18px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            width: "100%",
            maxWidth: "960px",
            fontSize: "1rem",
          }}
        />

        <div
          style={{
            width: "100%",
            maxWidth: "960px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {filteredVehicles.map((veh) => (
            <div
              key={veh.parc}
              style={{
                backgroundColor: "#fff",
                color: "#111",
                padding: "18px 24px",
                borderRadius: "10px",
                boxShadow: "0 6px 12px rgba(0, 0, 0, 0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                to={`/abribus/vehicule/${veh.parc}`}
                style={{
                  fontWeight: "bold",
                  color: "#2c3e50",
                  textDecoration: "none",
                  flex: "1 0 80px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {veh.parc}
                {veh.pmr && <FaWheelchair style={{ color: "#007bff" }} />}
              </Link>
              {veh.etablissement && (
                <div style={{ flex: "1 0 150px", fontSize: "0.85rem", color: "#0080f8", fontWeight: 500 }}>
                  📍 {veh.etablissement.nom}
                </div>
              )}
              <div style={{ flex: "1.5 0 150px", fontSize: "0.95rem" }}>{veh.type}</div>
              <div style={{ flex: "2 0 150px" }}>{veh.modele}</div>
              <div style={{ flex: "1 0 120px" }}>{veh.immat}</div>
              <div style={{ flex: "1 0 100px" }}>
                {veh.etablissement?.nom || 'Aucun dépôt'}
              </div>
              <div style={{ flex: "1 0 100px" }}>
                {typeof veh.tauxSante === "number" ? veh.tauxSante : ""}
                {typeof veh.tauxSante === "number" ? "%" : ""}
              </div>

              <div
                style={{
                  flex: "1 0 100px",
                  color: "#fff",
                  backgroundColor: getStatusColor(veh.statut),
                  padding: "6px 12px",
                  borderRadius: "20px",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "0.9rem",
                }}
              >
                {veh.ct && new Date(veh.ct) < new Date() ? (
                  <span style={{ backgroundColor: "#e74c3c", padding: "4px 8px", borderRadius: "12px" }}>
                    CT Dépassé
                  </span>
                ) : (
                  veh.statut
                )}
              </div>
              {/* Note: Actions (Éditer, Changer état, Supprimer) sont disponibles en cliquant sur le véhicule */}
            </div>
          ))}
        </div>

        {showAddModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
              padding: "20px",
            }}
            onClick={() => setShowAddModal(false)}
          >
            <div
              style={{
                backgroundColor: "#fff",
                padding: "30px",
                borderRadius: "12px",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
                width: "100%",
                maxWidth: "480px",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginTop: 0, marginBottom: "24px", color: "#2c3e50" }}>
                Ajouter un véhicule
              </h2>

              {[
                "parc",
                "type",
                "modele",
                "immat",
                "km",
                "tauxSante",
                "statut",
                "annee",
                "boite",
                "moteur",
                "portes",
                "girouette",
                "clim",
              ].map((field) => (
                <div key={field}>
                  <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  {["type", "statut"].includes(field) ? (
                    <select
                      name={field}
                      value={newVeh[field]}
                      onChange={handleInputChange}
                      style={{ marginBottom: "16px", width: "100%", padding: "10px", borderRadius: "6px" }}
                    >
                      <option value="">-- Sélectionner --</option>
                      {(field === "type" ? vehicleTypes : vehicleStatus).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      name={field}
                      type={["tauxSante", "km", "annee", "portes"].includes(field) ? "number" : "text"}
                      value={newVeh[field]}
                      onChange={handleInputChange}
                      placeholder={field}
                      style={{ marginBottom: "16px", width: "100%", padding: "10px", borderRadius: "6px" }}
                    />
                  )}
                </div>
              ))}

              <div>
                <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>
                  Établissement / Dépôt
                </label>
                <select
                  name="etablissementId"
                  value={newVeh.etablissementId}
                  onChange={handleInputChange}
                  style={{ marginBottom: "16px", width: "100%", padding: "10px", borderRadius: "6px" }}
                >
                  <option value="">-- Aucun --</option>
                  {etablissements.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nom} ({e.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>
                  Prochain Contrôle Technique
                </label>
                <input
                  type="date"
                  name="ct"
                  value={newVeh.ct}
                  onChange={handleInputChange}
                  style={{ marginBottom: "16px", width: "100%", padding: "10px", borderRadius: "6px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: "600", marginBottom: "4px" }}>
                  Photos du véhicule
                </label>
                <input
                  type="file"
                  name="photos"
                  accept="image/*"
                  multiple
                  onChange={handleInputChange}
                  style={{ marginBottom: "16px", width: "100%" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
                  <input
                    type="checkbox"
                    name="pmr"
                    checked={newVeh.pmr}
                    onChange={handleInputChange}
                  />
                  Accessible PMR
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    backgroundColor: "#f0f0f0",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddVehicle}
                  style={{
                    padding: "8px 22px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: "#2980b9",
                    color: "#fff",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <ImportVehiclesCSV 
        isOpen={isImportOpen} 
        onClose={onImportClose}
        onSuccess={fetchVehicles}
      />
    </>
  );
};

export default Vehicules;
