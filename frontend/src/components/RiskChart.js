import React from 'react';
import Plot from 'react-plotly.js';
import { motion } from 'framer-motion';

const RiskChart = ({ stats }) => {
  const labels = ['Critical', 'High', 'Medium', 'Low'];
  const values = [
    stats?.critical_count || 0,
    stats?.high_count || 0,
    stats?.medium_count || 0,
    stats?.low_count || 0,
  ];
  
  const colors = {
    'Critical': '#ef4444',
    'High': '#e67e22',
    'Medium': '#f59e0b',
    'Low': '#10b981'
  };

  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h3>Risk Insights</h3>
      <Plot
        data={[
          {
            labels: labels,
            values: values,
            type: 'pie',
            hole: 0.6,
            marker: {
              colors: labels.map(l => colors[l] || '#cbd5e1'),
              line: { width: 2, color: '#fff' }
            },
            textinfo: 'percent',
            hoverinfo: 'label+value',
            hovertemplate: '<b>%{label}</b><br>Count: %{value}<br>%{percent}<extra></extra>'
          },
        ]}
        layout={{ 
            autosize: true, 
            height: 300, 
            margin: { t: 20, b: 20, l: 20, r: 20 },
            template: 'plotly_white',
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Inter, sans-serif' },
            showlegend: true,
            legend: { orientation: 'h', y: -0.1 }
        }}
        useResizeHandler={true}
        style={{ width: "100%" }}
        config={{ displayModeBar: false }}
      />
    </motion.div>
  );
};

export default RiskChart;
