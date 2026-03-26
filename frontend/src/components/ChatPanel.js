import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { askAI, getResourceExplanation } from '../services/api';

const TypingEffect = ({ text, speed = 15 }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}<span className="typing-cursor" /></span>;
};

const ChatPanel = ({ activeResourceId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (activeResourceId) {
      triggerAdvisor(activeResourceId);
    }
  }, [activeResourceId]);

  const triggerAdvisor = async (id) => {
    setLoading(true);
    try {
      const response = await getResourceExplanation(id);
      const explanation = response.data.explanation;
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: explanation,
        insight: "Decision prioritization based on cost-waste and security-risk correlation.",
        recommendation: "Review the 'Before vs After' metrics in the Simulator to validate impact."
      }]);
    } catch (error) {
      console.error("Advisor Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textOverride) => {
// ... existing handleSend logic ...
    const textToSend = textOverride || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = textToSend;
    if (!textOverride) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
        const response = await askAI(userMsg);
        const resData = response.data;
        
        const aiResponse = resData.response;
        const insight = resData.insight;
        const recommendation = resData.recommendation;

        if (aiResponse) {
          setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: aiResponse,
              insight: insight,
              recommendation: recommendation
          }]);
        } else {
          setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: "I'm sorry, I received an empty response."
          }]);
        }
    } catch (error) {
        setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'Error: Could not reach the AI Copilot.' 
        }]);
    } finally {
        setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
    setInput(e.target.value);
  };

  const quickPrompts = [
    { label: 'Top risks', text: 'What are my top security risks right now?' },
    { label: 'Reduce cost', text: 'How can I reduce my cloud costs today?' },
    { label: 'Best action', text: 'What is the single most important action I should take?' }
  ];

  return (
    <div className="chat-panel-container modern-chat">
      <div className="chat-header">
        <h3>AI Security Copilot</h3>
        <div className="header-actions">
          <div className="status-indicator">
            <span className="dot"></span> Online
          </div>
          {onClose && (
            <button className="chat-close-btn" onClick={onClose} title="Close Chat">
              ×
            </button>
          )}
        </div>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="welcome-message"
            >
              <div className="avatar">🤖</div>
              <p>Welcome! I'm your AI Security Copilot. I analyze your resource telemetry to provide cost and security insights.</p>
              <div className="quick-prompts-hint">Try asking one of these:</div>
              <div className="quick-prompts">
                {quickPrompts.map((p, i) => (
                  <button key={i} onClick={() => handleSend(p.text)}>{p.label}</button>
                ))}
              </div>
            </motion.div>
          )}
          {messages.map((m, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`message-bubble ${m.role}`}
            >
              <div className="bubble-content">
                {m.role === 'assistant' && i === messages.length - 1 ? (
                  <TypingEffect text={m.content} />
                ) : m.content}
                
                {m.insight && (
                  <div className="bubble-insight">
                    <strong>Insight:</strong> {m.insight}
                  </div>
                )}
                {m.recommendation && (
                  <div className="bubble-recommendation">
                    <strong>✅ Action:</strong> {m.recommendation}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="loading-indicator">
            <div className="pulse-dot" />
            <span>Analyzing infrastructure...</span>
          </motion.div>
        )}
      </div>

      <div className="chat-input-section">
        <div className="input-wrapper">
          <textarea 
            ref={textareaRef}
            rows="1"
            value={input} 
            onChange={autoResize}
            placeholder="Ask about cloud cost, risks, or optimization..."
            onKeyDown={handleKeyDown}
          />
          <button 
            className={`send-button ${input.trim() ? 'active' : ''}`}
            onClick={() => handleSend()} 
            disabled={loading || !input.trim()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
