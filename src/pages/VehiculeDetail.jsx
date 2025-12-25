import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { API_URL } from "../config";
import "./pages/style/VehiculeDetail.css";

const API = API_URL;

const Badge = ({ text, color }) => (
  <span style={{padding:"4px 10px",borderRadius:8,background:color,color:"#fff",fontWeight:700,fontSize:12}}>
    {text}
  </span>
);

const Bar = ({ label, value, onClick, actionLabel }) => (
  <div style={{ marginBottom: 22 }}>
    <h3 style={{ margin: "0 0 10px" }}>{label}</h3>
    <div style={{ height: 10, background: "#eef2f7", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value||0))}%`, height: "100%" }} />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
      <span style={{ opacity: .8 }}>{value ?? 0} %</span>
      {onClick && <button className="btn primary" onClick={onClick}>{actionLabel}</button>}
    </div>
  </div>
);

export default function VehiculeDetail() {
  const { parc } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext) || {};
  const [veh, setVeh] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showConfirmBack, setShowConfirmBack] = useState(false);

  const [showEtat, setShowEtat] = useState(false);
  const [newStatut, setNewStatut] = useState("");
  const [raison, setRaison] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/api/vehicles/${parc}`);
        if (!r.ok) throw new Error("Véhicule introuvable");
        setVeh(await r.json());
      } catch (e) { setErr(e.message); }
      finally { setLoading(false); }
    })();
  }, [parc]);

  const j = (s) => { try { return s ? JSON.parse(s) : null } catch { return null } };
  const lignes = j(veh?.lignesJson) || [];
  const optUsine = j(veh?.optionsUsineJson) || {};
  const optAtelier = j(veh?.optionsAtelierJson) || {};
  const optSaeiv = j(veh?.optionsSaeivJson) || {};

  const statutColor = (s="") => {
    s = s.toUpperCase();
    if (["DISPONIBLE","EN SERVICE"].includes(s)) return "#2ecc71";
    if (s==="A VENIR") return "#000";
    if (["INDISPONIBLE","AUX ATELIERS","ATELIER","IMMOBILISÉ"].includes(s)) return "#e74c3c";
    if (s==="AU CT") return "#f39c12";
    return "#7f8c8d";
  };

  const updateField = async (patch) => {
    const r = await fetch(`${API}/api/vehicles/${parc}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!r.ok) throw new Error(await r.text());
    setVeh(await r.json());
  };

  const handleChangeStatut = async () => {
    await updateField({ statut: newStatut }); // (option : PATCH /status pour historiser)
    setShowEtat(false); setNewStatut(""); setRaison("");
  };

  const toggleOption = async (bucket, key) => {
    const current = bucket==="usine" ? optUsine : bucket==="atelier" ? optAtelier : optSaeiv;
    const next = { ...current, [key]: !current[key] };
    const field = bucket==="usine" ? "optionsUsineJson" : bucket==="atelier" ? "optionsAtelierJson" : "optionsSaeivJson";
    await updateField({ [field]: next });
  };

  if (loading) return <p style={{ padding: 24 }}>Chargement…</p>;
  if (err) return <p style={{ padding: 24, color: "#c0392b" }}>{err}</p>;
  if (!veh) return <p style={{ padding: 24 }}>Véhicule introuvable.</p>;

  const photo = veh.photoUrl || (j(veh.photosJson)?.[0]) || "/public/images/vehicule_avant.jpg";

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", fontFamily: "Montserrat" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>VÉHICULE N°{veh.parc}</h1>
        <button 
          className="btn" 
          onClick={() => setShowConfirmBack(true)}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          ← Retour
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* colonne gauche */}
        <div>
          <h2>Informations de base</h2>
          <p><strong>N° :</strong> {veh.parc}</p>
          <p><strong>Marque :</strong> {veh.marque || "-"}</p>
          <p><strong>Modèle :</strong> {veh.modele}</p>
          <p><strong>Type :</strong> {veh.type}</p>
          <p><strong>Motorisation :</strong> {veh.moteur || "-"} {veh.motorisationInfo ? `(${veh.motorisationInfo})` : ""}</p>
          <p><strong>Nb places :</strong> {veh.places ?? "-"}</p>
          <p style={{ display:"flex",alignItems:"center",gap:8 }}>
            <strong>Immatriculation :</strong>
            <span style={{ border:"2px solid #111", borderRadius:6, padding:"2px 8px", fontWeight:700 }}>{veh.immat}</span>
          </p>
          <p><strong>Mise en service :</strong> {veh.miseEnService ? new Date(veh.miseEnService).toLocaleDateString() : "-"}</p>
          <p><strong>Kilomètres :</strong> {Number(veh.km||0).toLocaleString()} km</p>
          <p><strong>Dernière révision :</strong> {veh.derniereRevision ? new Date(veh.derniereRevision).toLocaleDateString() : "-"}</p>
          <p><strong>Prochain CT :</strong> {veh.ct ? <Badge text={new Date(veh.ct).toLocaleDateString()} color="#27ae60" /> : "-"}</p>
        </div>

        {/* colonne droite */}
        <div>
          <div style={{ width:"100%", aspectRatio:"16/9", overflow:"hidden", borderRadius:8, marginBottom:8 }}>
            <img src={photo} alt="Bus" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
          <p style={{ fontSize:12, opacity:.7, marginTop:0 }}>Photo : ©</p>

          <div style={{ display:"flex", alignItems:"center", gap:12, margin:"8px 0 4px" }}>
            <strong>État :</strong> <Badge text={veh.statut} color={statutColor(veh.statut)} />
          </div>
          <p><strong>Dépôt :</strong> {veh.depot || "-"}</p>

          {lignes.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:10 }}>
              {lignes.map((l,i) => (
                <span key={i} style={{ background:"#6c3483", color:"#fff", padding:"4px 8px", borderRadius:20, fontWeight:700, fontSize:12 }}>
                  {String(l)}
                </span>
              ))}
            </div>
          )}

          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {user?.role === "responsable" && (
              <>
                <button className="btn" onClick={() => setShowEtat(true)}>Échanger affectation</button>
                <button className="btn danger" onClick={() => updateField({ statut:"Indisponible" })}>Rendre indisponible</button>
                <button className="btn" onClick={() => alert("à implémenter")}>Désactiver les pubs</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* barres */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24, marginTop:28 }}>
        <Bar label="Propreté" value={veh.proprete} actionLabel="Laver"
             onClick={() => updateField({ proprete: Math.min(100,(veh.proprete||0)+10) })}/>
        <Bar label="État technique" value={veh.etatTechnique} actionLabel="Rénover"
             onClick={() => updateField({ etatTechnique: Math.min(100,(veh.etatTechnique||0)+10) })}/>
        <Bar label="État intérieur" value={veh.etatInterieur} actionLabel="Rénover"
             onClick={() => updateField({ etatInterieur: Math.min(100,(veh.etatInterieur||0)+10) })}/>
      </div>

      <hr style={{ margin:"28px 0" }} />

      {/* options */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
        <div>
          <h3>Option d'usine</h3>
          {Object.keys(optUsine).length===0 && <p style={{opacity:.6}}>Aucune option.</p>}
          {Object.entries(optUsine).map(([k,v]) => (
            <label key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <input type="checkbox" checked={!!v} onChange={() => toggleOption("usine",k)} /> {k}
            </label>
          ))}
          <button className="btn" onClick={() => toggleOption("usine","Agenouillement")}>+ Ajouter “Agenouillement”</button>
        </div>

        <div>
          <h3>Option d'atelier</h3>
          {Object.keys(optAtelier).length===0 && <p style={{opacity:.6}}>Aucune option.</p>}
          {Object.entries(optAtelier).map(([k,v]) => (
            <label key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <input type="checkbox" checked={!!v} onChange={() => toggleOption("atelier",k)} /> {k}
            </label>
          ))}
          <button className="btn" onClick={() => toggleOption("atelier","Ports USB")}>+ Ajouter “Ports USB”</button>
        </div>

        <div>
          <h3>Option SAEIV</h3>
          {Object.keys(optSaeiv).length===0 && <p style={{opacity:.6}}>Aucune option.</p>}
          {Object.entries(optSaeiv).map(([k,v]) => (
            <label key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <input type="checkbox" checked={!!v} onChange={() => toggleOption("saeiv",k)} /> {k}
            </label>
          ))}
          <button className="btn" onClick={() => toggleOption("saeiv","Pupitre conducteur")}>+ Ajouter “Pupitre conducteur”</button>
        </div>
      </div>

      {/* modale retour */}
      {showConfirmBack && (
        <div className="modalOverlay" onClick={() => setShowConfirmBack(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h2>Retour à la liste</h2>
            <p style={{ opacity: 0.8, marginBottom: 16 }}>Voulez-vous retourner à la liste des véhicules ?</p>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <button className="btn" onClick={()=>setShowConfirmBack(false)}>Continuer</button>
              <button className="btn primary" onClick={() => navigate("/vehicules")}>Retour</button>
            </div>
          </div>
        </div>
      )}

      {/* modale état */}
      {showEtat && (
        <div className="modalOverlay" onClick={() => setShowEtat(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <h2>Changer l'état du véhicule</h2>
            <input className="input" placeholder="Raison (optionnel)" value={raison} onChange={(e)=>setRaison(e.target.value)} />
            <select className="input" value={newStatut} onChange={(e)=>setNewStatut(e.target.value)}>
              <option value="">Sélectionnez</option>
              <option value="Disponible">Disponible</option>
              <option value="A VENIR">A VENIR</option>
              <option value="Indisponible">Indisponible</option>
              <option value="Atelier">Atelier</option>
              <option value="Immobilisé">Immobilisé</option>
            </select>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:12}}>
              <button className="btn" onClick={()=>setShowEtat(false)}>Annuler</button>
              <button className="btn primary" disabled={!newStatut} onClick={handleChangeStatut}>Valider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
