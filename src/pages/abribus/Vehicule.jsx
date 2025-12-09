import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/Header.jsx";
import { API_URL } from "../../config";

const API = API_URL;

const getStatusColor = (statut = "") => {
  switch (statut) {
    case "Disponible": return "#096943";
    case "Indisponible":
    case "Aux Ateliers": return "#ff1900ff";
    case "Affecté": return "#0080f8ff";
    case "Au CT": return "#ff9100ff";
    case "Réformé":
    case "A venir": return "#000000ff";
    default: return "#7f8c8d";
  }
};

const Badge = ({ children, color }) => (
  <span style={{
    display: "inline-block", padding: "6px 12px", borderRadius: 999,
    background: color, color: "#fff", fontWeight: 700, fontSize: 13
  }}>{children}</span>
);

// ——— Carrousel réduit (à droite)
const Carousel = ({ images = [], alt = "" }) => {
  const [idx, setIdx] = useState(0);
  if (!images.length) return null;
  return (
    <div style={{
      position: "relative",
      maxWidth: 520, width: "100%", aspectRatio: "4/3",
      marginLeft: "auto", overflow: "hidden", borderRadius: 12,
      boxShadow: "0 6px 16px rgba(0,0,0,.12)", background: "#eee",
    }}>
      <img src={images[idx]} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <button aria-label="Précédent" onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)} style={arrowStyle("left")}>‹</button>
      <button aria-label="Suivant" onClick={() => setIdx((i) => (i + 1) % images.length)} style={arrowStyle("right")}>›</button>
      <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
        {images.map((_, i) => (
          <span key={i} onClick={() => setIdx(i)} style={{
            width: 8, height: 8, borderRadius: 10, cursor: "pointer",
            background: i === idx ? "white" : "rgba(255,255,255,.6)",
            outline: i === idx ? "2px solid rgba(0,0,0,.15)" : "none",
          }}/>
        ))}
      </div>
    </div>
  );
};
const arrowStyle = (side) => ({
  position: "absolute", top: "50%", transform: "translateY(-50%)",
  [side]: 8, width: 34, height: 34, borderRadius: 999, border: "none",
  background: "rgba(0,0,0,.45)", color: "#fff", fontSize: 20, fontWeight: 700,
  lineHeight: "34px", cursor: "pointer", display: "grid", placeItems: "center",
});

// ——— Barre remplie (couleur paramétrable)
const Bar = ({ value = 0, color = "#27ae60" }) => (
  <div>
    <div style={{ height: 10, background: "#eef2f7", borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: "100%", background: color }} />
    </div>
    <div style={{ textAlign: "right", opacity: .8 }}>{value}%</div>
  </div>
);

const Vehicule = () => {
  const { parc } = useParams();
  const navigate = useNavigate();

  const [vehicule, setVehicule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // modal état
  const [showEtat, setShowEtat] = useState(false);
  const [nouvelEtat, setNouvelEtat] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`${API}/api/vehicles/${parc}`);
        if (!r.ok) throw new Error("Véhicule introuvable");
        const data = await r.json();
        if (mounted) setVehicule(data);
      } catch (e) {
        setErr(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [parc]);

  const images = useMemo(() => {
    let arr = [];
    try { arr = vehicule?.photosJson ? JSON.parse(vehicule.photosJson) : []; } catch {}
    if (!arr?.length) {
      arr = [
        "/images/vehicule_avant.jpg",
        "/images/vehicule_interieur.jpg",
        "/images/vehicule_profil_gauche.jpg",
        "/images/vehicule_profil_droit.jpg",
        "/images/vehicule_arriere.jpg",
      ];
    }
    return arr;
  }, [vehicule]);

  const updateField = async (patch) => {
    const r = await fetch(`${API}/api/vehicles/${parc}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!r.ok) throw new Error(await r.text());
    setVehicule(await r.json());
  };

  const handleChangeEtat = async () => {
    if (!nouvelEtat) return;
    try {
      await updateField({ statut: nouvelEtat });
      setShowEtat(false);
      setNouvelEtat("");
    } catch (e) {
      alert("Erreur: " + e.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer définitivement le véhicule ${parc} ? Avez-vous préparé la sortie de parc ?`)) return;
    try {
      const r = await fetch(`${API}/api/vehicles/${parc}`, { method: "DELETE" });
      if (!r.ok) throw new Error(await r.text());
      navigate("/abribus/vehicules"); // retour liste
    } catch (e) {
      alert("Erreur: " + e.message);
    }
  };

  if (loading) return (<><Header /><main style={pageStyle}><p>Chargement…</p></main></>);
  if (err || !vehicule) {
    return (
      <>
        <Header />
        <main style={pageStyle}>
          <h1 style={titleStyle}>Véhicule introuvable</h1>
          <p>Le numéro de parc <strong>{parc}</strong> ne correspond à aucun véhicule connu.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main style={pageStyle}>
        {/* Titre gras */}
        <h1 style={titleStyle}>VÉHICULE N°{vehicule.parc} – {vehicule.modele}</h1>

        {/* grille : infos à gauche / carrousel réduit à droite */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 520px",
          gap: 28,
          alignItems: "start",
          width: "100%",
          maxWidth: 1100,
        }}>
          {/* Infos de base (gauche) */}
          <section>
            <h2 style={h2Style}>Informations de base</h2>
            <InfoRow label="Numéro de Parc" value={vehicule.parc} />
            <InfoRow label="Modèle" value={vehicule.modele} />
            <InfoRow label="Type" value={vehicule.type} />
            <InfoRow label="Moteur" value={vehicule.moteur || "-"} />
            <InfoRow label="Immatriculation" value={vehicule.immat} badge />
            <InfoRow label="Mise en Service" value={vehicule.miseEnService ? new Date(vehicule.miseEnService).toLocaleDateString() : "-"} />
            <InfoRow label="Km" value={`${Number(vehicule.km || 0).toLocaleString()} km`} highlight />
            <InfoRow label="Prochain CT" value={vehicule.ct ? new Date(vehicule.ct).toLocaleDateString() : "-"} chip />
          </section>

          {/* Carrousel + statut (droite) */}
          <aside>
            <Carousel images={images} alt={`Véhicule ${vehicule.parc}`} />
            <div style={{ marginTop: 10 }}>
              <Badge color={getStatusColor(vehicule.statut)}>{vehicule.statut}</Badge>
            </div>
          </aside>
        </div>

        {/* ——— BLOC ACTIONS : 1 bouton "Changer l'état" ——— */}
        <div style={{
          width: "100%", maxWidth: 1100, display: "flex",
          gap: 12, flexWrap: "wrap", marginTop: 18, marginBottom: 6
        }}>
          <button className="btn" onClick={() => setShowEtat(true)}>
            CHANGER L’ÉTAT
          </button>
        </div>
<div style={{ width: "100%", maxWidth: 1100, display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18, marginBottom: 6 }}>
  <button className="btn" onClick={() => setShowEtat(true)}>Changer l’état</button>
</div>
        {/* ——— Jauges (remplies) ——— */}
        <hr style={{ margin: "18px 0" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, width: "100%", maxWidth: 1100 }}>
          <Card title="Propreté"><Bar value={vehicule.proprete ?? 100} color="#096943" /></Card>
          <Card title="État technique"><Bar value={vehicule.etatTechnique ?? 100} color="#096943" /></Card>
          <Card title="État intérieur"><Bar value={vehicule.etatInterieur ?? 100} color="#096943" /></Card>
        </div>

        {/* ——— Options ——— */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18, width: "100%", maxWidth: 1100, marginTop: 18 }}>
          <Card title="Options d'usine"><SmallList jsonText={vehicule.optionsUsineJson} /></Card>
          <Card title="Options d'atelier"><SmallList jsonText={vehicule.optionsAtelierJson} /></Card>
          <Card title="Options SAEIV"><SmallList jsonText={vehicule.optionsSaeivJson} /></Card>
        </div>

        {/* ——— Pied de page : Edit / Supprimer ——— */}
        <div style={{ width: "100%", maxWidth: 1100, display: "flex", justifyContent: "space-between", marginTop: 24 }}>
  <button className="btn primary" onClick={() => navigate(`/abribus/vehicule/${parc}/edit`)}>
    Éditer le véhicule
  </button>
  <button
    className="btn danger"
    onClick={async () => {
      if (!confirm(`Supprimer définitivement le véhicule ${parc} ?`)) return;
      const r = await fetch(`${API}/api/vehicles/${parc}`, { method: 'DELETE' });
      if (r.ok) navigate('/abribus/vehicules');
      else alert(await r.text());
    }}
  >
    Supprimer
  </button>
</div>
        {/* ——— Modal Changer l'état ——— */}
        {showEtat && (
          <div className="modalOverlay" onClick={() => setShowEtat(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Changer l’état du véhicule</h2>
              <select className="input" value={nouvelEtat} onChange={(e) => setNouvelEtat(e.target.value)}>
                <option value="">Sélectionner un état</option>
                <option value="Disponible">Disponible</option>
                <option value="Indisponible">Indisponible</option>
                <option value="Atelier">Atelier</option>
                <option value="A VENIR">A VENIR</option>
                <option value="Affecté">Affecté</option>
                <option value="Au CT">Au CT</option>
                <option value="Réformé">Réformé</option>
              </select>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                <button className="btn" onClick={() => setShowEtat(false)}>Annuler</button>
                <button className="btn primary" disabled={!nouvelEtat} onClick={handleChangeEtat}>Valider</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

/* ——— helpers UI ——— */

const pageStyle = {
  padding: "24px",
  fontFamily: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto",
  backgroundColor: "#f0f4f8",
  minHeight: "calc(100vh - 160px)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};
const titleStyle = {
  fontWeight: 800, fontSize: "1.8rem", color: "#2c3e50",
  textAlign: "left", width: "100%", maxWidth: 1100, margin: "4px auto 20px",
};
const h2Style = { margin: "0 0 10px", fontSize: "1.1rem", color: "#2c3e50" };

const InfoRow = ({ label, value, badge, highlight, chip }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0" }}>
    <span style={{ minWidth: 160, color: "#6b7785" }}><strong>{label} :</strong></span>
    {badge ? (
      <span style={{ border: "2px solid #111", borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>{value}</span>
    ) : chip ? (
      <span style={{ background: "#27ae60", color: "#fff", padding: "4px 8px", borderRadius: 8, fontWeight: 700 }}>
        {value}
      </span>
    ) : (
      <span style={{
        fontWeight: 600, color: highlight ? "#1a1a1a" : "#2c3e50",
        background: highlight ? "#FEF3C7" : "transparent",
        padding: highlight ? "2px 6px" : 0, borderRadius: 6
      }}>{value}</span>
    )}
  </div>
);

const Card = ({ title, children }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 8px 20px rgba(0,0,0,.06)" }}>
    <h3 style={{ margin: "0 0 10px", color: "#2c3e50" }}>{title}</h3>
    {children}
  </div>
);

const SmallList = ({ jsonText }) => {
  let data = null;
  try { data = jsonText ? JSON.parse(jsonText) : null; } catch {}
  if (!data) return <p style={{ opacity: .6 }}>Aucune donnée.</p>;
  if (Array.isArray(data)) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {data.map((x, i) => (
          <span key={i} style={{
            background: "#6c3483", color: "#fff", padding: "4px 8px",
            borderRadius: 20, fontWeight: 700, fontSize: 12
          }}>{String(x)}</span>
        ))}
      </div>
    );
  }
  const entries = Object.entries(data);
  if (!entries.length) return <p style={{ opacity: .6 }}>Aucune option.</p>;
  return (
    <ul style={{ margin: 0, paddingLeft: 16 }}>
      {entries.map(([k, v]) => (
        <li key={k} style={{ margin: "4px 0" }}>
          {k} {v === true ? "✓" : v === false ? "✗" : `: ${String(v)}`}
        </li>
      ))}
    </ul>
  );
};

export default Vehicule;
