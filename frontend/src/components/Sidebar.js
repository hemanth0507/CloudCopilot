import React from 'react';
import { motion } from 'framer-motion';

const Icons = {
  dashboard: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  offenders: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>,
  simulator: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM12 22V12M12 12L3.5 7.5M12 12l8.5-4.5"/></svg>,
  compliance: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  rightsizing: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  cloud: <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17.5 19h-11A5.5 5.5 0 014.2 8.4a7 7 0 0113.8 2.3 4.5 4.5 0 01-.5 8.3z"/></svg>
};

const Sidebar = ({ activePage, setActivePage }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard },
    { id: 'offenders', label: 'Top Offenders', icon: Icons.offenders },
    { id: 'simulator', label: 'What-If Simulator', icon: Icons.simulator },
    { id: 'compliance', label: 'Compliance', icon: Icons.compliance },
    { id: 'rightsizing', label: 'Rightsizing', icon: Icons.rightsizing },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="logo-icon" style={{ display: 'flex' }}>{Icons.cloud}</span>
        <span className="logo-text">Cloud Copilot</span>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.95 }}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {activePage === item.id && (
              <motion.div
                layoutId="active-pill"
                className="active-indicator"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-dot"></div>
          <span>System Optimized</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
