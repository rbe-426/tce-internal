import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { useNavigate } from 'react-router-dom';
import './atelierStyles.css';

const API = API_URL;

const getStatusColor = (statut) => {
  switch (statut) {
    case 'Disponible': return '#096943';
    case 'Indisponible': return '#ff6b6b';
    case 'Aux Ateliers': return '#ff1900';
    case 'Affecté': return '#0080f8';
    case 'Au CT': return '#ff9100';
    case 'Réformé': return '#000000';
    default: return '#7f8c8d';
  }
};

const AtelierManager = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filterStatut, setFilterStatut] = useState('Aux Ateliers');
  const [showInterventionForm, setShowInterventionForm] = useState(false);
  const [interventionData, setInterventionData] = useState({
    libelle: '',
    datePrevue: '',
    commentaire: '',
  });

  // Charger les véhicules
  useEffect(() => {
    fetchVehicles();
  }, [filterStatut]);

  const fetchVehicles = async () => {
    try {
      const r = await fetch(`${API}/api/vehicles`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setVehicles(data.filter(v => v.statut === filterStatut));
      setLoading(false);
    } catch (err) {
      console.error('Erreur chargement véhicules:', err);
      setLoading(false);
    }
  };

  const handleAddIntervention = async (parc) => {
    if (!interventionData.libelle) {
      alert('Le libellé de l\'intervention est obligatoire');
      return;
    }
    try {
      const r = await fetch(`${API}/api/vehicles/${parc}/interventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interventionData),
      });
      if (!r.ok) throw new Error(await r.text());
      
      // Recharger le véhicule
      const vehicleR = await fetch(`${API}/api/vehicles/${parc}`);
      const updatedVehicle = await vehicleR.json();
      setSelectedVehicle(updatedVehicle);
      setInterventionData({ libelle: '', datePrevue: '', commentaire: '' });
      setShowInterventionForm(false);
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleChangeStatus = async (parc, newStatus, comment) => {
    try {
      const r = await fetch(`${API}/api/vehicles/${parc}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatus }),
      });
      if (!r.ok) throw new Error(await r.text());
      
      // Ajouter à l'historique avec commentaire
      const historyR = await fetch(`${API}/api/vehicles/${parc}/state-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus: newStatus, note: comment }),
      });
      
      // Recharger
      await fetchVehicles();
      
      const vehicleR = await fetch(`${API}/api/vehicles/${parc}`);
      const updatedVehicle = await vehicleR.json();
      setSelectedVehicle(updatedVehicle);
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  const handleCompleteIntervention = async (parc, interventionId) => {
    try {
      const r = await fetch(`${API}/api/vehicles/${parc}/interventions/${interventionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'terminée' }),
      });
      if (!r.ok) throw new Error(await r.text());
      
      // Recharger
      const vehicleR = await fetch(`${API}/api/vehicles/${parc}`);
      const updatedVehicle = await vehicleR.json();
      setSelectedVehicle(updatedVehicle);
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  if (loading) return <div style={styles.loading}>Chargement…</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Gestion des Ateliers & Suivi des Réparations</h1>

      {/* Filtrage par statut */}
      <div style={styles.filterBar}>
        <div>
          <label>Filtrer par statut:</label>
          <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={styles.select}>
            <option>Aux Ateliers</option>
            <option>Indisponible</option>
            <option>Affecté</option>
            <option>Au CT</option>
          </select>
        </div>
        <div style={styles.stats}>
          Véhicules: <strong>{vehicles.length}</strong>
        </div>
      </div>

      <div style={styles.gridContainer}>
        {/* Liste des véhicules */}
        <div style={styles.vehicleList}>
          <h2>Véhicules en {filterStatut}</h2>
          {vehicles.length === 0 ? (
            <p style={styles.emptyMessage}>Aucun véhicule en {filterStatut}</p>
          ) : (
            vehicles.map(veh => (
              <div
                key={veh.parc}
                style={{
                  ...styles.vehicleCard,
                  borderLeftColor: getStatusColor(veh.statut),
                  background: selectedVehicle?.parc === veh.parc ? '#f0f8ff' : '#fff',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedVehicle(veh)}
              >
                <div style={styles.vehicleHeader}>
                  <strong>{veh.parc}</strong>
                  <span style={{ ...styles.badge, background: getStatusColor(veh.statut) }}>
                    {veh.statut}
                  </span>
                </div>
                <div style={styles.vehicleDetails}>
                  <small>{veh.type} • {veh.modele}</small>
                  <small>{veh.immat}</small>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Détail du véhicule sélectionné */}
        <div style={styles.vehicleDetail}>
          {selectedVehicle ? (
            <>
              <h2>Parc {selectedVehicle.parc} - {selectedVehicle.modele}</h2>

              {/* Infos générales */}
              <section style={styles.section}>
                <h3>Informations</h3>
                <div style={styles.infoGrid}>
                  <div><strong>Type:</strong> {selectedVehicle.type}</div>
                  <div><strong>Immat:</strong> {selectedVehicle.immat}</div>
                  <div><strong>Statut:</strong> <span style={{ ...styles.badge, background: getStatusColor(selectedVehicle.statut) }}>{selectedVehicle.statut}</span></div>
                  <div><strong>Km:</strong> {selectedVehicle.km.toLocaleString()}</div>
                  <div><strong>Santé:</strong> {selectedVehicle.tauxSante}%</div>
                </div>
              </section>

              {/* Actions de changement d'état */}
              <section style={styles.section}>
                <h3>Actions - Suivi des Réparations</h3>
                <div style={styles.statusFlow}>
                  {selectedVehicle.statut === 'Aux Ateliers' && (
                    <button
                      onClick={() => {
                        const comment = prompt('Commentaire sur le passage en Indisponible (ex: réparations en cours):', '');
                        if (comment !== null) handleChangeStatus(selectedVehicle.parc, 'Indisponible', comment);
                      }}
                      style={{ ...styles.btn, background: '#ff6b6b' }}
                    >
                      → Passer en Indisponible (réparations terminées)
                    </button>
                  )}
                  {selectedVehicle.statut === 'Indisponible' && (
                    <>
                      <button
                        onClick={() => {
                          const comment = prompt('Commentaire:', '');
                          if (comment !== null) handleChangeStatus(selectedVehicle.parc, 'Affecté', comment);
                        }}
                        style={{ ...styles.btn, background: '#0080f8' }}
                      >
                        → Passer en Affecté (remis en service)
                      </button>
                      <button
                        onClick={() => {
                          const comment = prompt('Commentaire (retour en ateliers):', '');
                          if (comment !== null) handleChangeStatus(selectedVehicle.parc, 'Aux Ateliers', comment);
                        }}
                        style={{ ...styles.btn, background: '#ff9100' }}
                      >
                        ← Retour aux Ateliers
                      </button>
                    </>
                  )}
                  {selectedVehicle.statut === 'Affecté' && (
                    <button
                      onClick={() => {
                        const comment = prompt('Commentaire:', '');
                        if (comment !== null) handleChangeStatus(selectedVehicle.parc, 'Indisponible', comment);
                      }}
                      style={{ ...styles.btn, background: '#ff6b6b' }}
                    >
                      ← Retour en Indisponible
                    </button>
                  )}
                </div>
              </section>

              {/* Interventions */}
              <section style={styles.section}>
                <h3>Interventions en Atelier</h3>
                {selectedVehicle.interventions && selectedVehicle.interventions.length > 0 ? (
                  <div style={styles.interventionsList}>
                    {selectedVehicle.interventions.map(inter => (
                      <div key={inter.id} style={{ ...styles.interventionCard, opacity: inter.statut === 'terminée' ? 0.7 : 1 }}>
                        <div style={styles.interventionHeader}>
                          <strong>{inter.libelle}</strong>
                          <span style={{ ...styles.badge, background: inter.statut === 'terminée' ? '#27ae60' : '#f39c12', fontSize: '11px' }}>
                            {inter.statut || 'planifiée'}
                          </span>
                        </div>
                        {inter.datePrevue && (
                          <div style={styles.interventionDate}>
                            Prévu: {new Date(inter.datePrevue).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                        {inter.commentaire && (
                          <div style={styles.interventionComment}>
                            {inter.commentaire}
                          </div>
                        )}
                        {inter.dateEffective && (
                          <div style={styles.interventionDate}>
                            Effectué: {new Date(inter.dateEffective).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                        {inter.statut !== 'terminée' && (
                          <button
                            onClick={() => handleCompleteIntervention(selectedVehicle.parc, inter.id)}
                            style={styles.btnSmall}
                          >
                            ✓ Marquer comme terminée
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={styles.emptyMessage}>Aucune intervention</p>
                )}

                {/* Ajouter une intervention */}
                {!showInterventionForm ? (
                  <button
                    onClick={() => setShowInterventionForm(true)}
                    style={{ ...styles.btn, background: '#27ae60', marginTop: '16px' }}
                  >
                    + Ajouter une intervention
                  </button>
                ) : (
                  <div style={styles.formSection}>
                    <label>
                      Libellé
                      <input
                        type="text"
                        value={interventionData.libelle}
                        onChange={(e) => setInterventionData({ ...interventionData, libelle: e.target.value })}
                        placeholder="Ex: Révision moteur, Changement pneus..."
                        style={styles.input}
                      />
                    </label>
                    <label>
                      Date prévue
                      <input
                        type="date"
                        value={interventionData.datePrevue}
                        onChange={(e) => setInterventionData({ ...interventionData, datePrevue: e.target.value })}
                        style={styles.input}
                      />
                    </label>
                    <label>
                      Commentaire
                      <textarea
                        value={interventionData.commentaire}
                        onChange={(e) => setInterventionData({ ...interventionData, commentaire: e.target.value })}
                        placeholder="Détails de l'intervention..."
                        style={styles.textarea}
                      />
                    </label>
                    <div style={styles.formActions}>
                      <button
                        onClick={() => handleAddIntervention(selectedVehicle.parc)}
                        style={{ ...styles.btn, background: '#27ae60' }}
                      >
                        Créer
                      </button>
                      <button
                        onClick={() => {
                          setShowInterventionForm(false);
                          setInterventionData({ libelle: '', datePrevue: '', commentaire: '' });
                        }}
                        style={{ ...styles.btn, background: '#95a5a6' }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Historique */}
              <section style={styles.section}>
                <h3>Historique des Mouvements</h3>
                {selectedVehicle.statesHistory && selectedVehicle.statesHistory.length > 0 ? (
                  <div style={styles.historyTimeline}>
                    {selectedVehicle.statesHistory.map((move, idx) => (
                      <div key={idx} style={styles.historyItem}>
                        <div style={{ ...styles.historyBadge, background: getStatusColor(move.toStatus) }}>
                          {move.toStatus}
                        </div>
                        <div style={styles.historyContent}>
                          <div style={styles.historyDate}>
                            {new Date(move.changedAt).toLocaleDateString('fr-FR')} à {new Date(move.changedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {move.note && <div style={styles.historyNote}>{move.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={styles.emptyMessage}>Pas d'historique</p>
                )}
              </section>
            </>
          ) : (
            <div style={styles.emptyMessage}>Sélectionnez un véhicule pour voir les détails</div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    background: '#f5f7fa',
    minHeight: '100vh',
    fontFamily: 'Montserrat, system-ui, -apple-system, Segoe UI, Roboto',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#2c3e50',
    marginBottom: '24px',
    textAlign: 'center',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#fff',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,.08)',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    marginLeft: '12px',
    fontFamily: 'inherit',
  },
  stats: {
    fontSize: '14px',
    color: '#666',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: '24px',
  },
  vehicleList: {
    background: '#fff',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,.08)',
    maxHeight: '80vh',
    overflowY: 'auto',
  },
  vehicleCard: {
    padding: '12px',
    marginBottom: '12px',
    borderRadius: '6px',
    borderLeft: '4px solid',
    background: '#f9f9f9',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  vehicleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  vehicleDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    color: '#666',
  },
  badge: {
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 700,
  },
  vehicleDetail: {
    background: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,.08)',
    overflowY: 'auto',
    maxHeight: '80vh',
  },
  section: {
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #eee',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginTop: '12px',
  },
  statusFlow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  btn: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
  },
  btnSmall: {
    padding: '6px 12px',
    background: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '12px',
    marginTop: '8px',
  },
  interventionsList: {
    marginTop: '12px',
  },
  interventionCard: {
    background: '#f9f9f9',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '12px',
    borderLeft: '4px solid #f39c12',
  },
  interventionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  interventionDate: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
  interventionComment: {
    fontSize: '13px',
    color: '#333',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #eee',
  },
  formSection: {
    background: '#f9f9f9',
    padding: '16px',
    borderRadius: '6px',
    marginTop: '12px',
  },
  input: {
    display: 'block',
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginTop: '6px',
    marginBottom: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  textarea: {
    display: 'block',
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    marginTop: '6px',
    marginBottom: '12px',
    fontSize: '14px',
    fontFamily: 'inherit',
    minHeight: '80px',
    boxSizing: 'border-box',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  historyTimeline: {
    marginTop: '12px',
  },
  historyItem: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid #eee',
  },
  historyBadge: {
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    minWidth: '100px',
    textAlign: 'center',
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2c3e50',
  },
  historyNote: {
    fontSize: '13px',
    color: '#666',
    marginTop: '4px',
  },
  loading: {
    padding: '24px',
    textAlign: 'center',
    fontSize: '16px',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#999',
    padding: '20px',
  },
};

export default AtelierManager;
