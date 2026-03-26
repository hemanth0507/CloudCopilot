import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ResourceTable = ({ resources }) => {
  const [sortKey, setSortKey] = useState('priority_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterType, setFilterType] = useState('All');

  const resourceTypes = useMemo(() => {
    const types = new Set(resources?.map(r => r.resource_type));
    return ['All', ...Array.from(types)];
  }, [resources]);

  const filteredAndSorted = useMemo(() => {
    if (!resources) return [];
    
    let filtered = resources;
    if (filterType !== 'All') {
      filtered = resources.filter(r => r.resource_type === filterType);
    }

    return [...filtered].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [resources, sortKey, sortOrder, filterType]);

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
      transition={{ delay: 0.7 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>Cloud Resource Inventory</h3>
        <select 
          value={filterType} 
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          {resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th onClick={() => toggleSort('resource_name')}>Resource ID{getSortIcon('resource_name')}</th>
            <th onClick={() => toggleSort('resource_type')}>Type{getSortIcon('resource_type')}</th>
            <th onClick={() => toggleSort('priority_score')}>Priority{getSortIcon('priority_score')}</th>
            <th onClick={() => toggleSort('cost_impact')}>Waste{getSortIcon('cost_impact')}</th>
            <th onClick={() => toggleSort('cvss_score')}>Risk{getSortIcon('cvss_score')}</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence mode="popLayout">
            {filteredAndSorted.map((res, i) => (
              <motion.tr 
                key={res.resource_id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ backgroundColor: "#f8fafc" }}
              >
                <td>
                  <div style={{ fontWeight: 600 }}>{res.resource_name || res.resource_id}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{res.resource_id}</div>
                </td>
                <td>{res.resource_type}</td>
                <td>
                  <span className={`severity-pill ${res.priority_score > 70 ? 'severity-critical' : res.priority_score > 40 ? 'severity-high' : 'severity-low'}`}>
                    {res.priority_score}
                  </span>
                </td>
                <td style={{ color: res.cost_impact > 50 ? 'var(--danger)' : 'var(--dark)' }}>
                  ${res.cost_impact?.toLocaleString()}
                </td>
                <td>
                  <span style={{ 
                    color: res.cvss_score > 7 ? 'var(--danger)' : res.cvss_score > 4 ? 'var(--warning)' : 'var(--success)',
                    fontWeight: 700 
                  }}>
                    {res.cvss_score || 0}
                  </span>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </motion.div>
  );
};

export default ResourceTable;
