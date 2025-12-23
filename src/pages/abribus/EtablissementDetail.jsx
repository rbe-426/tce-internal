import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { API_URL } from "../../config";

const API = API_URL;

const EtablissementDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [etab, setEtab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  // Charger détail établissement
  const fetchEtab = async () => {
    try {
      const r = await fetch(`${API}/api/etablissements/${id}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setEtab(data);
      setFormData({ nom: data.nom, type: data.type, adresse: data.adresse });
      setErr("");
    } catch (e) {
      setErr("Établissement non trouvé");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEtab();
  }, [id]);

  // Sauvegarder modifications
  const handleSave = async () => {
    try {
      const r = await fetch(`${API}/api/etablissements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      setEtab(data);
      setEditMode(false);
    } catch (e) {
      alert("Erreur sauvegarde: " + e.message);
    }
  };

  // Supprimer
  const handleDelete = async () => {
    if (!confirm("Supprimer définitivement cet établissement ?")) return;
    try {
      const r = await fetch(`${API}/api/etablissements/${id}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error(await r.text());
      navigate("/abribus/etablissements");
    } catch (e) {
      alert("Erreur suppression: " + e.message);
    }
  };

  if (loading) return <p>Chargement…</p>;
  if (err) return <p style={{ color: "red" }}>{err}</p>;
  if (!etab) return <p>Établissement non trouvé</p>;

  return (
    <div style={pageStyle}>
      <Link to="/abribus/etablissements" style={backLinkStyle}>
        ← Retour liste
      </Link>

      <h1>{etab.nom}</h1>

      <div style={cardStyle}>
        {editMode ? (
          <>
            <label>
              Nom
              <input
                type="text"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                style={inputStyle}
              />
            </label>
            <label>
              Type
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
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
                value={formData.adresse}
                onChange={(e) =>
                  setFormData({ ...formData, adresse: e.target.value })
                }
                style={inputStyle}
              />
            </label>
            <div style={btnGroupStyle}>
              <button onClick={handleSave} style={saveBtnStyle}>
                Sauvegarder
              </button>
              <button onClick={() => setEditMode(false)} style={cancelBtnStyle}>
                Annuler
              </button>
            </div>
          </>
        ) : (
          <>
            <p>
              <strong>Type:</strong> {etab.type}
            </p>
            <p>
              <strong>Adresse:</strong> {etab.adresse || "—"}
            </p>
            <div style={btnGroupStyle}>
              <button onClick={() => setEditMode(true)} style={editBtnStyle}>
                Modifier
              </button>
              <button onClick={handleDelete} style={deleteBtnStyle}>
                Supprimer
              </button>
            </div>
          </>
        )}
      </div>

      {/* Section Véhicules */}
      <h2>Véhicules ({etab.vehicles?.length || 0})</h2>
      <div style={cardStyle}>
        {etab.vehicles && etab.vehicles.length > 0 ? (
          <ul>
            {etab.vehicles.map((v) => (
              <li key={v.id}>
                <Link to={`/abribus/vehicule/${v.parc}`} style={linkStyle}>
                  {v.parc} - {v.type} ({v.modele})
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucun véhicule assigné</p>
        )}
      </div>

      {/* Section Personnel */}
      <h2>Personnel ({etab.employes?.length || 0})</h2>
      <div style={cardStyle}>
        {etab.employes && etab.employes.length > 0 ? (
          <ul>
            {etab.employes.map((e) => (
              <li key={e.id}>
                <strong>{e.nom}</strong> ({e.fonction || "—"})
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucun personnel assigné</p>
        )}
      </div>

      {/* Section Lignes */}
      <h2>Lignes ({etab.lignes?.length || 0})</h2>
      <div style={cardStyle}>
        {etab.lignes && etab.lignes.length > 0 ? (
          <ul>
            {etab.lignes.map((l) => (
              <li key={l.id}>
                <Link to={`/abribus/lignes`} style={linkStyle}>
                  Ligne {l.numero} - {l.nom}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune ligne assignée</p>
        )}
      </div>
    </div>
  );
};

const pageStyle = {
  padding: "20px",
  maxWidth: "800px",
  margin: "0 auto",
};

const backLinkStyle = {
  color: "#0080f8",
  textDecoration: "none",
  fontWeight: 600,
  marginBottom: "16px",
  display: "inline-block",
};

const cardStyle = {
  background: "#f9f9f9",
  padding: "16px",
  borderRadius: "8px",
  marginBottom: "20px",
  border: "1px solid #eee",
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
  boxSizing: "border-box",
};

const btnGroupStyle = {
  display: "flex",
  gap: "12px",
  marginTop: "16px",
};

const editBtnStyle = {
  padding: "8px 16px",
  background: "#0080f8",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: 600,
};

const saveBtnStyle = {
  padding: "8px 16px",
  background: "#27ae60",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: 600,
};

const cancelBtnStyle = {
  padding: "8px 16px",
  background: "#95a5a6",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

const deleteBtnStyle = {
  padding: "8px 16px",
  background: "#ff1900",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: 600,
};

const linkStyle = {
  color: "#0080f8",
  textDecoration: "none",
};

export default EtablissementDetail;
