import React, { useState, useEffect } from 'react';
import { getResources, simulateChanges } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const Simulator = ({ preSelectedId }) => {
  const [resources, setResources] = useState([]);
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getResources();
        setResources(response.data.data);
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (preSelectedId) {
        setSelected(prev => {
            if (!prev.includes(preSelectedId)) return [preSelectedId];
            return prev;
        });
    }
  }, [preSelectedId]);

  const toggleSelect = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const runSimulation = async () => {
    if (selected.length === 0) return;
    setSimulating(true);
    try {
      const payload = { resource_ids: selected };
      console.log("Sending simulation payload:", payload);
      const response = await simulateChanges(payload);
      setResult(response.data);
    } catch (error) {
      console.error("Simulation error:", error.response?.data || error.message);
      alert("Failed to run simulation. Please verify backend connection and try again.");
    } finally {
      setSimulating(false);
    }
  };

  const applyFix = () => {
    alert("Remediation triggered! Infrastructure state updating...");
    setResult(null);
    setSelected([]);
  };

  if (loading) return <div className="loading">Initializing Simulator...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Intelligent What-If Simulator</h2>
        <p>Analyze pre-mitigation baseline vs. post-remediation projections.</p>
      </div>

      <div className="chart-row">
        <div className="card" style={{maxHeight: '400px', overflowY: 'auto'}}>
          <h3>Select Resources ({selected.length})</h3>
          <div style={{marginTop: '1rem'}}>
            {resources.map((res) => (
              <div 
                key={res.resource_id}
                className={`nav-item ${selected.includes(res.resource_id) ? 'active' : ''}`}
                style={{
                    margin: '4px 0', 
                    border: '1px solid #f1f5f9', 
                    background: selected.includes(res.resource_id) ? 'var(--accent)' : 'transparent',
                    color: selected.includes(res.resource_id) ? 'white' : 'inherit'
                }}
                onClick={() => toggleSelect(res.resource_id)}
              >
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <span style={{fontSize: '0.85rem', fontWeight: 700}}>{res.resource_name}</span>
                  <span style={{fontSize: '0.7rem', opacity: 0.8}}>{res.resource_id} | {res.resource_type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Active Decision Logic</h3>
          <p style={{margin: '1rem 0', fontSize: '0.9rem'}}> remit-intelligence-v2.5 enabled:</p>
          <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem'}}>
            <div className="logic-badge">✅ Rightsizing: CPU &lt; 30% Threshold</div>
            <div className="logic-badge">✅ Risk: CVSS Scaling Remediation</div>
            <div className="logic-badge">✅ ROI: Projected Monthly Yield</div>
          </div>
          
          <button 
            disabled={selected.length === 0 || simulating}
            onClick={runSimulation}
            className="action-button-primary"
            style={{ opacity: (selected.length === 0 || simulating) ? 0.5 : 1 }}
          >
            {simulating ? 'Calculating Decision Impact...' : 'Run Analysis Simulation'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="simulation-result-panel"
          >
            <div className="result-header">
                <h3>📊 Multi-Resource Impact Analysis</h3>
                <div style={{display: 'flex', gap: '10px'}}>
                    <span className="priority-badge" style={{ background: 'var(--success)' }}>ROI Validated</span>
                    <button className="apply-btn" onClick={applyFix}>Apply Proposed Fixes</button>
                </div>
            </div>
            
            <div className="summary-banner card-glow-blue">
                <div className="banner-metric">
                    <span>Target Monthly Savings</span>
                    <strong style={{color: 'var(--success)'}}>${result.summary.total_savings}</strong>
                </div>
                <div className="banner-metric">
                    <span>Risk Reduction</span>
                    <strong style={{color: 'var(--danger)'}}>-{result.summary.risk_reduction_count} findings</strong>
                </div>
                <div className="banner-metric">
                    <span>Compliance Lift</span>
                    <strong style={{color: 'var(--accent)'}}>{result.summary.compliance_improvement}</strong>
                </div>
            </div>

            <div className="impact-grid" style={{marginTop: '2rem'}}>
                {result.resources.map((item, idx) => (
                    <div key={idx} className="impact-card">
                        <div className="impact-card-header">
                            <strong>{item.resource_id}</strong>
                            <span className="action-tag">{item.action}</span>
                        </div>
                        <div className="before-after-grid">
                            <div className="impact-side">
                                <span className="side-label">BEFORE</span>
                                <div className="side-value">${item.cost_before}</div>
                                <div className="side-sub">Risk: {item.risk_before}</div>
                            </div>
                            <div className="impact-arrow">→</div>
                            <div className="impact-side after">
                                <span className="side-label">AFTER</span>
                                <div className="side-value">${item.cost_after}</div>
                                <div className="side-sub">Risk: {item.risk_after}</div>
                            </div>
                        </div>
                        <div className="impact-delta">
                            Delta: <span style={{color: 'var(--success)'}}>- ${item.savings}</span>
                        </div>
                    </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Simulator;
