import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

const MetricsCards = ({ data, riskStats, onExpandChange }) => {
  const [expandedCard, setExpandedCard] = useState(null);

  const totalCost = data?.total_monthly_cost || 0;
  const wastedCost = data?.total_wasted_cost || 0;
  const wastePct = data?.waste_percentage || 0;
  const criticalRisks = riskStats?.critical_count || 0;

  const cardData = [
    { 
      id: 'total-cost', 
      label: 'Total Monthly Cost', 
      value: totalCost, 
      prefix: '$', 
      color: 'var(--primary)',
      glowClass: ''
    },
    { 
      id: 'wasted-cost', 
      label: 'Wasted Cost', 
      value: wastedCost, 
      prefix: '$', 
      color: wastedCost > 500 ? 'var(--danger)' : 'var(--warning)',
      glowClass: wastedCost > 500 ? 'card-glow-red' : 'card-glow-orange'
    },
    { 
      id: 'waste-pct', 
      label: 'Waste %', 
      value: wastePct, 
      suffix: '%', 
      color: wastePct > 50 ? 'var(--danger)' : 'var(--warning)',
      glowClass: wastePct > 50 ? 'card-glow-red' : 'card-glow-orange'
    },
    { 
      id: 'critical-risks', 
      label: 'Critical Risks', 
      value: criticalRisks, 
      color: criticalRisks > 0 ? 'var(--danger)' : 'var(--success)',
      glowClass: criticalRisks > 0 ? 'card-glow-red' : ''
    },
  ];

  const handleCardClick = (id) => {
    const isExpanding = expandedCard !== id;
    setExpandedCard(isExpanding ? id : null);
    if (onExpandChange) onExpandChange(isExpanding);
  };

  return (
    <div className="metrics-grid">
      <AnimatePresence>
        {cardData.map((card, index) => (
          <motion.div
            key={card.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.03, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            className={`card metric-card ${card.glowClass} ${expandedCard === card.id ? 'expanded' : ''}`}
            onClick={() => handleCardClick(card.id)}
          >
            <motion.div layout className="metric-label">{card.label}</motion.div>
            <motion.div layout className="metric-value" style={{ color: card.color }}>
              <AnimatedCounter value={card.value} prefix={card.prefix} suffix={card.suffix} />
            </motion.div>
            
            <AnimatePresence>
              {expandedCard === card.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}
                >
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    {card.id === 'wasted-cost' ? 'Click specifically on resources in the table below to see a detailed waste breakdown and optimization path.' : 
                     'Real-time data synchronization active. See AI Copilot for specific root-cause analysis.'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MetricsCards;
