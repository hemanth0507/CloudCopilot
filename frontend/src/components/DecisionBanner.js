import React, { useState, useEffect } from 'react';
import { getTopDecision } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const DecisionBanner = ({ onActionClick }) => {
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDecision = async () => {
      try {
        const response = await getTopDecision();
        if (response.data.status === 'success') {
          setDecision(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching top decision:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDecision();
  }, []);

  if (loading || !decision) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="decision-banner"
      >
        <div className="banner-content">
          <span className="banner-icon" style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </span>
          <span className="banner-text">{decision.banner_text}</span>
          <button 
            className="banner-action-btn"
            onClick={() => onActionClick(decision.resource_id)}
          >
            Take Action Now
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DecisionBanner;
