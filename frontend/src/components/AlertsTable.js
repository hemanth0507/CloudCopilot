import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AlertsTable = ({ alerts }) => {
  const [sortKey, setSortKey] = useState('last_seen');
  const [sortOrder, setSortOrder] = useState('desc');

  const sortedAlerts = useMemo(() => {
    if (!alerts) return [];
    
    const severityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    
    return [...alerts].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'severity') {
        valA = severityOrder[a.severity] || 0;
        valB = severityOrder[b.severity] || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [alerts, sortKey, sortOrder]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (key) => {
    if (sortKey !== key) return ' ↕️';
    return sortOrder === 'asc' ? ' 🔼' : ' 🔽';
  };

  return (
    <motion.div 
      className="card table-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>Alert Incident Table</h3>
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Sorted by: <strong>{sortKey.replace('_', ' ')}</strong>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th onClick={() => toggleSort('alert_type')}>Type{getSortIcon('alert_type')}</th>
            <th onClick={() => toggleSort('severity')}>Severity{getSortIcon('severity')}</th>
            <th onClick={() => toggleSort('occurrences')}>Occurrences{getSortIcon('occurrences')}</th>
            <th onClick={() => toggleSort('last_seen')}>Last Seen{getSortIcon('last_seen')}</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence mode="popLayout">
            {sortedAlerts.map((alert, i) => (
              <motion.tr 
                key={alert.alert_type + i}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <td>{alert.alert_type}</td>
                <td>
                  <span className={`severity-pill severity-${alert.severity?.toLowerCase()}`}>
                    {alert.severity}
                  </span>
                </td>
                <td>{alert.occurrences}</td>
                <td>{new Date(alert.last_seen).toLocaleString()}</td>
              </motion.tr>
            ))}
          </AnimatePresence>
          {(!alerts || alerts.length === 0) && (
            <tr>
              <td colSpan="4" style={{textAlign: 'center', padding: '3rem', color: '#64748b'}}>
                No alerts available currently. Environment is stable.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </motion.div>
  );
};

export default AlertsTable;
