import React, { useState, useEffect } from 'react';
import { getRightsizing } from '../services/api';
import { motion } from 'framer-motion';

const Rightsizing = ({ onSimulate }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getRightsizing();
        setRecommendations(response.data.data);
      } catch (err) {
        console.error("Error fetching rightsizing:", err);
        setError(err.message || "Failed to load rightsizing recommendations");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Analyzing Utilization Patterns...</div>;

  if (error) return (
    <div className="page-container" style={{textAlign: 'center', marginTop: '4rem'}}>
      <h2>⚠️ Connection Error</h2>
      <p style={{color: 'var(--danger)'}}>{error}</p>
      <button className="simulate-btn" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Rightsizing Recommendations</h2>
        <p>Rule-based cost optimization using CPU/DB/Storage utilization patterns.</p>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Resource</th>
              <th>CPU Util</th>
              <th>Current Type</th>
              <th>Recommended Type</th>
              <th>Potential Savings</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {recommendations.map((item, index) => (
              <motion.tr 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td style={{fontWeight: 600}}>{item.resource}</td>
                <td style={{color: '#64748b'}}>{item.cpu_utilization}</td>
                <td style={{color: 'var(--danger)'}}>{item.current_type}</td>
                <td style={{color: 'var(--success)', fontWeight: 700}}>→ {item.recommended_type}</td>
                <td style={{fontWeight: 700}}>${item.savings}/mo</td>
                <td style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="simulate-btn"
                    onClick={() => onSimulate(item.resource_id || item.resource)}
                  >
                    Simulate
                  </button>
                  <button style={{padding: '4px 12px', borderRadius: '8px', border: 'none', background: 'var(--success)', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem'}}>
                    Execute
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card-glow-blue card" style={{marginTop: '1rem'}}>
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <div style={{fontSize: '2rem'}}>📈</div>
          <div>
            <h4 style={{margin: 0}}>Total Potential Saving Opportunity</h4>
            <p style={{margin: '0.25rem 0 0', fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)'}}>
              ${recommendations.reduce((sum, item) => sum + item.savings, 0).toFixed(2)} / month
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rightsizing;
