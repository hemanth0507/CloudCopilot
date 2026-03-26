import React, { useState, useEffect } from 'react';
import { getCompliance } from '../services/api';
import { motion } from 'framer-motion';

const Compliance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getCompliance();
        setData(response.data.data);
      } catch (err) {
        console.error("Error fetching compliance:", err);
        setError(err.message || "Failed to load compliance intelligence");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading Compliance Intelligence...</div>;

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
        <h2>Compliance Score Cards</h2>
        <p>Real-time posture assessment against SOC2, ISO 27001, and PCI-DSS.</p>
      </div>

      <div className="grid-cols-3">
        {data.map((fw, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="card score-card"
          >
            <div className={`score-circle ${fw.score < 80 ? 'card-glow-orange' : ''}`}>
              {fw.score}%
            </div>
            <h3 style={{marginTop: '1rem'}}>{fw.framework}</h3>
            <p style={{fontSize: '0.8rem', color: '#64748b'}}>
              {fw.passed_controls} / {fw.total_controls} Controls Passed
            </p>
          </motion.div>
        ))}
      </div>

      <div className="card">
        <h3>Failed Controls</h3>
        <table style={{marginTop: '1rem'}}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {data.flatMap(fw => fw.failed_controls.map((ctrl, i) => (
              <tr key={`${fw.framework}-${i}`}>
                <td style={{fontWeight: 700}}>{ctrl.control_id}</td>
                <td>{ctrl.description}</td>
                <td>
                  <span className={`severity-pill ${ctrl.severity === 'Critical' ? 'severity-critical' : ctrl.severity === 'High' ? 'severity-high' : 'severity-medium'}`}>
                    {ctrl.severity}
                  </span>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Compliance;
