import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../../components/Header.jsx";
import { API_URL } from "../../config";
import {
  FaBus, FaFan, FaWheelchair, FaWifi, FaCamera, FaVolumeUp, FaPhone,
  FaSign, FaLightbulb, FaUsb, FaCheck, FaTimes
} from "react-icons/fa";

const API = API_URL;

const section = { background:"#fff", borderRadius:12, padding:16, boxShadow:"0 8px 18px rgba(0,0,0,.06)" };
const labelCss = { fontWeight:600, color:"#2c3e50", display:"block", marginBottom:6 };
const inputCss = { width:"100%", padding:"10px 12px", border:"1px solid #d8dee5", borderRadius:8, marginBottom:12 };
const row = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 };
const btn = { padding:"10px 16px", borderRadius:10, border:"none", fontWeight:700, cursor:"pointer" };
const primary = { ...btn, background:"#1f6feb", color:"#fff" };
const danger = { ...btn, background:"#e74c3c", color:"#fff" };
const ghost  = { ...btn, background:"#34495e", color:"#fff" };

export default function VehiculeEdit() {
  const { parc } = useParams();
  const nav = useNavigate();
  const [v, setV] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/api/vehicles/${parc}`);
        if (!r.ok) throw new Error("Véhicule introuvable");
        const data = await r.json();
        setV(deserialize(data));
      } catch (e) {
        setErr(e.message);
      } finally { setLoading(false); }
    })();
  }, [parc]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setV((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };
  const handleNumber = (name, val) => setV((p) => ({ ...p, [name]: val === "" ? "" : Number(val) || 0 }));
  const toggleOpt = (bucket, key) => setV((p) => ({ ...p, [bucket]: { ...p[bucket], [key]: !p[bucket]?.[key] } }));

  const save = async () => {
    try {
      const payload = serialize(v);
      const r = await fetch(`${API}/api/vehicles/${parc}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      nav(`/abribus/vehicule/${parc}`);
    } catch (e) {
      alert("Erreur: " + e.message);
    }
  };
  const del = async () => {
    if (!confirm(`Supprimer définitivement le véhicule ${parc} ?`)) return;
    try {
      const r = await fetch(`${API}/api/vehicles/${parc}`, { method: "DELETE" });
      if (!r.ok) throw new Error(await r.text());
      nav("/abribus/vehicules");
    } catch (e) { alert("Erreur: " + e.message); }
  };

  if (loading) return (<><Header /><main style={page}><p>Chargement…</p></main></>);
  if (err || !v) return (<><Header /><main style={page}><p style={{color:"#c0392b"}}>{err || "Introuvable"}</p></main></>);

  return (
    <>
      <Header />
      <main style={page}>
        <h1 style={title}>Éditer le véhicule n°{v.parc} – {v.modele}</h1>

        <section style={{...section, maxWidth:1100, width:"100%"}}>
          <h2 style={h2}>Informations de base</h2>
          <div style={row}>
            <div><label style={labelCss}>Type</label>
              <input name="type" value={v.type} onChange={handleChange} style={inputCss}/></div>
            <div><label style={labelCss}>Modèle</label>
              <input name="modele" value={v.modele} onChange={handleChange} style={inputCss}/></div>
            <div><label style={labelCss}>Immatriculation</label>
              <input name="immat" value={v.immat} onChange={handleChange} style={inputCss}/></div>
            <div><label style={labelCss}>Kilométrage</label>
              <input type="number" value={v.km} onChange={(e)=>handleNumber("km", e.target.value)} style={inputCss}/></div>

            {/* État unique = état technique */}
            <div><label style={labelCss}>État technique (%)</label>
              <input type="number" value={v.etatTechnique} onChange={(e)=>handleNumber("etatTechnique", e.target.value)} style={inputCss}/></div>

            <div><label style={labelCss}>Statut</label>
              <select name="statut" value={v.statut} onChange={handleChange} style={inputCss}>
                {["Disponible","Indisponible","Atelier","A VENIR","Affecté","Au CT","Réformé"].map(s=>(
                  <option key={s} value={s}>{s}</option>
                ))}
              </select></div>

            <div><label style={labelCss}>Année</label>
              <input type="number" value={v.annee ?? ""} onChange={(e)=>handleNumber("annee", e.target.value)} style={inputCss}/></div>
            <div><label style={labelCss}>Boîte</label>
              <input name="boite" value={v.boite ?? ""} onChange={handleChange} style={inputCss}/></div>
            <div><label style={labelCss}>Moteur</label>
              <input name="moteur" value={v.moteur ?? ""} onChange={handleChange} style={inputCss}/></div>
            <div><label style={labelCss}>Portes</label>
              <input type="number" value={v.portes ?? ""} onChange={(e)=>handleNumber("portes", e.target.value)} style={inputCss}/></div>
            <div><label style={labelCss}>Girouette</label>
              <input name="girouette" value={v.girouette ?? ""} onChange={handleChange} style={inputCss}/></div>
            <div><label style={labelCss}>Climatisation</label>
              <input name="clim" value={v.clim ?? ""} onChange={handleChange} style={inputCss}/></div>
            <div><label style={labelCss}>PMR</label>
              <div style={{display:"flex", alignItems:"center", gap:8}}>
                <input type="checkbox" checked={!!v.pmr} onChange={(e)=>setV(p=>({...p, pmr:e.target.checked}))}/>
                <FaWheelchair />
              </div></div>
            <div><label style={labelCss}>Prochain CT</label>
              <input type="date" value={v.ct || ""} onChange={(e)=>setV(p=>({...p, ct:e.target.value}))} style={inputCss}/></div>

            <div><label style={labelCss}>Propreté (%)</label>
              <input type="number" value={v.proprete} onChange={(e)=>handleNumber("proprete", e.target.value)} style={inputCss}/></div>
            <div><label style={labelCss}>État intérieur (%)</label>
              <input type="number" value={v.etatInterieur} onChange={(e)=>handleNumber("etatInterieur", e.target.value)} style={inputCss}/></div>
            <div><label style={labelCss}>Dépôt</label>
              <input name="depot" value={v.depot ?? ""} onChange={handleChange} style={inputCss}/></div>
          </div>
        </section>

        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, width:"100%", maxWidth:1100, marginTop:16}}>
          <OptionCard title="Option d'usine" items={[
            ["Agenouillement", <FaSign />],
            ["Emplacement UFR", <FaWheelchair />],
            ["Plateforme rétractable (électrique)", <FaWheelchair />],
            ["Climatisation", <FaFan />],
            ["Portes pneumatiques", <FaBus />],
            ["Pré-câblage self-service", <FaUsb />],
            ["Vitre anti-agression", <FaTimes />],
            ["Vitres teintées", <FaCheck />],
            ["Baies basses", <FaTimes />],
          ]} state={v.optionsUsine} onToggle={(k)=>toggleOpt("optionsUsine", k)} />

          <OptionCard title="Option d'atelier" items={[
            ["Balise priorité de feu", <FaLightbulb />],
            ["Boutons self-service", <FaUsb />],
            ["Boutons arrêts demandés suppl.", <FaUsb />],
            ["Caméra vidéo-protection", <FaCamera />],
            ["Panneau pub arrière", <FaSign />],
            ["Panneau pub avant", <FaSign />],
            ["Panneau pub latéral", <FaSign />],
            ["Éthylotest Anti-Démarrage", <FaTimes />],
            ["Radio FM", <FaVolumeUp />],
            ["Wifi", <FaWifi />],
            ["Ports USB", <FaUsb />],
          ]} state={v.optionsAtelier} onToggle={(k)=>toggleOpt("optionsAtelier", k)} />

          <OptionCard title="Option SAEIV" items={[
            ["Bandeau lumineux", <FaLightbulb />],
            ["Écran TFT", <FaSign />],
            ["Haut-parleurs", <FaVolumeUp />],
            ["Pupitre conducteur", <FaPhone />],
            ["Téléphone radio", <FaPhone />],
          ]} state={v.optionsSaeiv} onToggle={(k)=>toggleOpt("optionsSaeiv", k)} />
        </div>

        <div style={{maxWidth:1100, width:"100%", display:"flex", justifyContent:"space-between", marginTop:16}}>
          <div style={{display:"flex", gap:10}}>
            <button style={primary} onClick={save}>Enregistrer</button>
            <button style={ghost} onClick={()=>nav(`/abribus/vehicule/${parc}`)}>Annuler</button>
          </div>
          <button style={danger} onClick={del}>Supprimer</button>
        </div>
      </main>
    </>
  );
}

function OptionCard({ title, items, state={}, onToggle }) {
  return (
    <section style={section}>
      <h3 style={{margin:"0 0 10px"}}>{title}</h3>
      <ul style={{listStyle:"none", margin:0, padding:0, display:"grid", gap:8}}>
        {items.map(([label, icon]) => {
          const k = label;
          const checked = !!state[k];
          return (
            <li key={k} style={{display:"flex", alignItems:"center", gap:8}}>
              <input type="checkbox" checked={checked} onChange={()=>onToggle(k)} />
              <span style={{width:18, display:"inline-grid", placeItems:"center"}}>{icon}</span>
              <span>{label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------- utils ----------

function deserialize(d) {
  const J = (x) => { try { return x ? JSON.parse(x) : {} } catch { return {} } };
  return {
    ...d,
    ct: d.ct ? new Date(d.ct).toISOString().slice(0,10) : "",
    // état technique unique (fallback sur tauxSante si ancien)
    etatTechnique: d.etatTechnique ?? d.tauxSante ?? 100,
    proprete: d.proprete ?? 100,
    etatInterieur: d.etatInterieur ?? 100,
    optionsUsine: J(d.optionsUsineJson),
    optionsAtelier: J(d.optionsAtelierJson),
    optionsSaeiv: J(d.optionsSaeivJson),
  };
}

function serialize(v) {
  const S = (o) => (o && Object.keys(o).length ? o : null);
  return {
    type: v.type,
    modele: v.modele,
    immat: (v.immat || "").toUpperCase(),
    km: Number(v.km) || 0,

    // etat unique
    etatTechnique: Number(v.etatTechnique) || 0,
    // compat
    tauxSante: Number(v.etatTechnique) || 0,

    statut: v.statut,
    annee: v.annee === "" ? null : Number(v.annee),
    boite: v.boite || null,
    moteur: v.moteur || null,
    portes: v.portes === "" ? null : Number(v.portes),
    girouette: v.girouette || null,
    clim: v.clim || null,
    pmr: !!v.pmr,
    ct: v.ct || null,

    proprete: Number(v.proprete) || 0,
    etatInterieur: Number(v.etatInterieur) || 0,
    depot: v.depot || null,

    optionsUsine: S(v.optionsUsine),
    optionsAtelier: S(v.optionsAtelier),
    optionsSaeiv: S(v.optionsSaeiv),
  };
}

const page = {
  padding:"24px",
  fontFamily:"Montserrat, system-ui, -apple-system, Segoe UI, Roboto",
  background:"#f0f4f8",
  minHeight:"calc(100vh - 160px)",
  display:"flex",
  flexDirection:"column",
  alignItems:"center"
};
const title = { width:"100%", maxWidth:1100, margin:"0 0 14px", fontWeight:800, color:"#2c3e50" };
const h2 = { margin:"0 0 10px", color:"#2c3e50" };
