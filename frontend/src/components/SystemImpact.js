import React from 'react';
import { motion } from 'framer-motion';

const SystemImpact = ({ costData, riskStats }) => {
  if (!costData || !riskStats) return null;

  // Calculate projected impact if all waste is removed
  const potentialSavings = costData.total_wasted_cost;
  const potentialRiskReduction = riskStats.critical_count + riskStats.high_count;
  const projectedCompliance = 98; // Target

  return (
    <div className="card card-glow-blue" style={{ marginTop: '2rem', background: 'linear-gradient(135deg, #f8fafc, #eff6ff)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          Projected Platform Impact
        </h3>
        <span className="priority-badge" style={{ background: 'var(--accent)' }}>Decision Outcome</span>
      </div>

      <div className="metrics-grid">
        <div className="metric-box">
          <div className="metric-label">Annual Savings Potential</div>
          <div className="metric-value" style={{ color: 'var(--success)' }}>
            ${(potentialSavings * 12).toLocaleString()}
          </div>
          <div className="progress-bar-bg">
            <motion.div 
              className="progress-bar-fill" 
              initial={{ width: 0 }}
              animate={{ width: '85%' }}
              style={{ background: 'var(--success)' }}
            />
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-label">Security Hardening</div>
          <div className="metric-value" style={{ color: 'var(--danger)' }}>
            -{potentialRiskReduction} Critical/High
          </div>
          <div className="progress-bar-bg">
            <motion.div 
              className="progress-bar-fill" 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              style={{ background: 'var(--danger)' }}
            />
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-label">Compliance Target</div>
          <div className="metric-value" style={{ color: 'var(--accent)' }}>
            {projectedCompliance}% Score
          </div>
          <div className="progress-bar-bg">
            <motion.div 
              className="progress-bar-fill" 
              initial={{ width: 0 }}
              animate={{ width: '92%' }}
              style={{ background: 'var(--accent)' }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b', textAlign: 'center' }}>
        * Estimates based on current infrastructure patterns and automated remediation logic.
      </div>
    </div>
  );
};

export default SystemImpact;
