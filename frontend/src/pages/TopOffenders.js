import React, { useState, useEffect } from 'react';
import { getTopOffenders } from '../services/api';
import { motion } from 'framer-motion';

const TopOffenders = ({ onSimulate }) => {
  const [offenders, setOffenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getTopOffenders();
        setOffenders(response.data.data);
      } catch (err) {
        console.error("Error fetching top offenders:", err);
        setError(err.message || "Failed to load top offenders");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return '#ef4444'; // Red
    if (score >= 60) return '#f59e0b'; // Orange
    if (score >= 40) return '#3b82f6'; // Blue
    return '#10b981'; // Green
  };

  if (loading) return <div className="loading">Loading Offenders...</div>;
  
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
        <h2>Top 10 Offenders</h2>
        <p>Resources with the highest combined cost, risk, and waste scores.</p>
      </div>

      <div className="card">
        <table className="offenders-table">
          <thead>
            <tr>
              <th>Resource Name</th>
              <th>Monthly Cost</th>
              <th>Risk Score</th>
              <th>Utilization</th>
              <th>Priority Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {offenders.map((item, index) => (
              <motion.tr 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={index === 0 ? 'top-priority-row' : ''}
              >
                <td style={{fontWeight: 600}}>
                  {item.resource_name}
                  {index === 0 && <span className="priority-badge">🔥 Highest Priority</span>}
                </td>
                <td>${item.cost}</td>
                <td>
                  <span className={`severity-pill ${item.risk >= 7 ? 'severity-high' : item.risk >= 4 ? 'severity-medium' : 'severity-low'}`}>
                    {item.risk} CVSS
                  </span>
                </td>
                <td>{item.utilization}</td>
                <td style={{fontWeight: 800, color: getScoreColor(item.score)}}>{item.score}</td>
                <td>
                   <button 
                    className="simulate-btn"
                    onClick={() => onSimulate(item.resource_id || item.resource_name)}
                   >
                     Simulate
                   </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card-glow-blue card" style={{marginTop: '1rem'}}>
        <h3>AI Insight</h3>
        <p>These 10 resources represent the highest ROI opportunities for optimization. Addressing them could reduce your monthly waste by up to 15% and mitigate several critical security risks.</p>
      </div>
    </div>
  );
};

export default TopOffenders;
