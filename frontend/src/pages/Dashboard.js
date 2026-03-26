import React, { useState, useEffect } from 'react';
import { getCostSummary, getRiskStats, getAlerts, getResources, getDashboardScatter, getTimeTrend } from '../services/api';
import MetricsCards from '../components/MetricsCards';
import InsightCharts from '../components/InsightCharts';
import AlertsTable from '../components/AlertsTable';
import ResourceTable from '../components/ResourceTable';
import SystemImpact from '../components/SystemImpact';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const [costData, setCostData]       = useState(null);
  const [riskStats, setRiskStats]     = useState(null);
  const [alerts, setAlerts]           = useState([]);
  const [resources, setResources]     = useState([]);
  const [scatterData, setScatterData] = useState([]);
  const [trendData, setTrendData]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [isDimmed, setIsDimmed]       = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.allSettled([
          getCostSummary(),
          getRiskStats(),
          getAlerts(),
          getResources(),
          getDashboardScatter(),
          getTimeTrend(),
        ]);

        const [costRes, riskRes, alertRes, resourceRes, scatterRes, trendRes] = results;

        // Core data — fall back to safe defaults if individual endpoints fail
        setCostData(costRes.status === 'fulfilled'
          ? costRes.value.data.data
          : { total_monthly_cost: 0, total_wasted_cost: 0, waste_percentage: 0 });

        setRiskStats(riskRes.status === 'fulfilled'
          ? riskRes.value.data.data
          : { total_findings: 0, critical_count: 0, high_count: 0, medium_count: 0, low_count: 0 });

        setAlerts(alertRes.status === 'fulfilled' ? alertRes.value.data.data : []);
        setResources(resourceRes.status === 'fulfilled' ? resourceRes.value.data.data : []);

        // Insight chart data
        setScatterData(scatterRes.status === 'fulfilled' ? scatterRes.value.data.data : []);
        setTrendData(trendRes.status   === 'fulfilled' ? trendRes.value.data.data   : []);

        // Only fatal if ALL fail
        if (results.every(r => r.status === 'rejected')) {
          throw new Error("All data sources failed to connect. Check backend connection.");
        }

      } catch (err) {
        console.error("🔥 Fatal Dashboard Error:", err);
        setError(err.message || "Failed to fetch dashboard intelligence");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return (
    <div style={{padding: '5rem', textAlign: 'center'}}>
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{ fontSize: '3rem', marginBottom: '1rem' }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
      </motion.div>
      <h2 style={{color: 'var(--accent)', fontWeight: 800}}>Synchronizing Security Intelligence...</h2>
      <p style={{color: '#64748b'}}>GenAI Cloud Security Copilot is analyzing your infrastructure</p>
    </div>
  );

  if (error) return (
    <div style={{padding: '5rem', textAlign: 'center'}}>
      <h2>Connection Error</h2>
      <p style={{color: 'var(--danger)', marginBottom: '2rem'}}>{error}</p>
      <button className="simulate-btn" onClick={() => window.location.reload()}>Retry Connection</button>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`dashboard-container ${isDimmed ? 'dimmed-focus' : ''}`}
    >
      <div className="dashboard-header">
        <motion.h1 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          GenAI Cloud Security Copilot
        </motion.h1>
        <motion.p 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{color: '#64748b', margin: '0.5rem 0 0 0', fontWeight: 500}}
        >
          Real-time decision intelligence for cloud infrastructure
        </motion.p>
      </div>

      {/* KPI Cards — kept as before */}
      <MetricsCards 
        data={costData} 
        riskStats={riskStats} 
        onExpandChange={(expanded) => setIsDimmed(expanded)}
      />

      <SystemImpact costData={costData} riskStats={riskStats} />

      {/* ── New Insight Charts (replaces old static CostChart + RiskChart row) ── */}
      <InsightCharts
        scatterData={scatterData}
        trendData={trendData}
        riskStats={riskStats}
      />

      <ResourceTable resources={resources} />
      
      <AlertsTable alerts={alerts} />
      
      {/* Background Dimming Overlay */}
      <AnimatePresence>
        {isDimmed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="focus-overlay"
            onClick={() => setIsDimmed(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Dashboard;
