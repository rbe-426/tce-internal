import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDisclosure } from "@chakra-ui/react";
import { API_URL } from "../../config";

const API = API_URL;

const Etablissements = () => {
  const [search, setSearch] = useState("");
  const [etablissements, setEtablissements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [newEtab, setNewEtab] = useState({
    nom: "",
    type: "Dépôt", // "Dépôt" ou "Établissement"
    adresse: "",
  });

  // Charger établissements
  const fetchEtablissements = async () => {
    try {
      const r = await fetch(`${API}/api/etablissements`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setEtablissements(data);
      setErr("");
    } catch (e) {
      setErr("Erreur chargement établissements");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEtablissements();
  }, []);

  // Ajouter établissement
  const handleAddEtab = async (e) => {
    e.preventDefault();
    if (!newEtab.nom) {
      alert("Le nom est obligatoire");
      return;
    }
    try {
      const r = await fetch(`${API}/api/etablissements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEtab),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setEtablissements([...etablissements, data]);
      setNewEtab({ nom: "", type: "Dépôt", adresse: "" });
      setShowAddModal(false);
    } catch (e) {
      alert("Erreur création: " + e.message);
    }
  };

  // Supprimer établissement
  const handleDeleteEtab = async (id) => {
    if (!confirm("Supprimer cet établissement ?")) return;
    try {
      const r = await fetch(`${API}/api/etablissements/${id}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error(await r.text());
      setEtablissements(etablissements.filter((e) => e.id !== id));
    } catch (e) {
      alert("Erreur suppression: " + e.message);
    }
  };

  const filtered = etablissements.filter((e) =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    (e.adresse && e.adresse.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <p>Chargement…</p>;

  return (
    <div style={pageStyle}>
      <h1>Établissements & Dépôts</h1>

      {err && <div style={errorStyle}>{err}</div>}

      <div style={headerRowStyle}>
        <input
          type="text"
          placeholder="Rechercher par nom ou adresse…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInputStyle}
        />
        <button onClick={() => setShowAddModal(true)} style={addBtnStyle}>
          + Ajouter
        </button>
      </div>

      {showAddModal && (
        <div style={modalOverlayStyle} onClick={() => setShowAddModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2>Nouvel Établissement</h2>
            <form onSubmit={handleAddEtab}>
              <label>
                Nom *
                <input
                  type="text"
                  value={newEtab.nom}
                  onChange={(e) =>
                    setNewEtab({ ...newEtab, nom: e.target.value })
                  }
                  style={inputStyle}
                  required
                />
              </label>
              <label>
                Type
                <select
                  value={newEtab.type}
                  onChange={(e) =>
                    setNewEtab({ ...newEtab, type: e.target.value })
                  }
                  style={inputStyle}
                >
                  <option>Dépôt</option>
                  <option>Établissement</option>
                </select>
              </label>
              <label>
                Adresse
                <input
                  type="text"
                  value={newEtab.adresse}
                  onChange={(e) =>
                    setNewEtab({ ...newEtab, adresse: e.target.value })
                  }
                  style={inputStyle}
                />
              </label>
              <div style={formBtnStyle}>
                <button type="submit" style={submitBtnStyle}>
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={cancelBtnStyle}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={tableContainerStyle}>
        {filtered.length === 0 ? (
          <p>Aucun établissement trouvé</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Adresse</th>
                <th>Véhicules</th>
                <th>Personnel</th>
                <th>Lignes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((etab) => (
                <tr key={etab.id}>
                  <td>
                    <Link to={`/abribus/etablissement/${etab.id}`}
                      style={{ color: "#0080f8", fontWeight: 600, textDecoration: "none" }}>
                      {etab.nom}
                    </Link>
                  </td>
                  <td>{etab.type}</td>
                  <td>{etab.adresse || "—"}</td>
                  <td>{etab.vehicles?.length || 0}</td>
                  <td>{etab.employes?.length || 0}</td>
                  <td>{etab.lignes?.length || 0}</td>
                  <td>
                    <button
                      onClick={() => handleDeleteEtab(etab.id)}
                      style={deleteBtnStyle}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const pageStyle = {
  padding: "20px",
  maxWidth: "1200px",
  margin: "0 auto",
};

const errorStyle = {
  padding: "12px",
  background: "#fee",
  color: "#c00",
  borderRadius: "6px",
  marginBottom: "16px",
};

const headerRowStyle = {
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
  alignItems: "center",
};

const searchInputStyle = {
  flex: 1,
  padding: "8px 12px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "14px",
};

const addBtnStyle = {
  padding: "8px 16px",
  background: "#0080f8",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 600,
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "#fff",
  padding: "24px",
  borderRadius: "8px",
  maxWidth: "400px",
  width: "90%",
  boxShadow: "0 4px 12px rgba(0,0,0,.15)",
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "8px 12px",
  marginTop: "6px",
  marginBottom: "16px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  fontSize: "14px",
  fontFamily: "inherit",
};

const formBtnStyle = {
  display: "flex",
  gap: "12px",
  justifyContent: "flex-end",
};

const submitBtnStyle = {
  padding: "8px 16px",
  background: "#0080f8",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: 600,
};

const cancelBtnStyle = {
  padding: "8px 16px",
  background: "#eee",
  color: "#333",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const tableContainerStyle = {
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
};

const deleteBtnStyle = {
  padding: "4px 8px",
  background: "#ff1900",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
};

export default Etablissements;
