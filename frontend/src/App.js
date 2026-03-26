import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TopOffenders from './pages/TopOffenders';
import Simulator from './pages/Simulator';
import Compliance from './pages/Compliance';
import Rightsizing from './pages/Rightsizing';
import ChatPanel from './components/ChatPanel';
import DecisionBanner from './components/DecisionBanner';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleDecisionAction = (resId) => {
    setSelectedResourceId(resId);
    setActivePage('simulator');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'offenders': return <TopOffenders onSimulate={(id) => { setSelectedResourceId(id); setActivePage('simulator'); }} />;
      case 'simulator': return <Simulator preSelectedId={selectedResourceId} />;
      case 'compliance': return <Compliance />;
      case 'rightsizing': return <Rightsizing onSimulate={(id) => { setSelectedResourceId(id); setActivePage('simulator'); }} />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} setActivePage={(page) => { setActivePage(page); if(page !== 'simulator' && page !== 'offenders' && page !== 'rightsizing') setSelectedResourceId(null); }} />
      <div className="main-content">
        <DecisionBanner onActionClick={handleDecisionAction} />
        {renderPage()}
      </div>

      {/* Floating Chat Button */}
      <button 
        className="floating-chat-btn" 
        onClick={() => setIsChatOpen(true)}
        style={{ display: isChatOpen ? 'none' : 'flex' }}
      >
        <span className="floating-chat-icon" style={{ display: 'flex' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </span>
      </button>

      {/* Chat Popup Overlay */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="chat-popup-wrapper"
          >
            <ChatPanel 
              activeResourceId={selectedResourceId} 
              onSimulationComplete={(res) => console.log("Simulated:", res)} 
              onClose={() => setIsChatOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
