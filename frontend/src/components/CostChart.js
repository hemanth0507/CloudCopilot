import React from 'react';
import Plot from 'react-plotly.js';
import { motion } from 'framer-motion';

const CostChart = ({ data }) => {
  const total = data?.total_monthly_cost || 0;
  const wasted = data?.total_wasted_cost || 0;

  return (
    <motion.div 
      className="card"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h3>Cost Analysis</h3>
      <Plot
        data={[
          {
            x: ['Total Cost', 'Wasted Cost'],
            y: [total, wasted],
            type: 'bar',
            marker: { 
                color: ['#10b981', '#ef4444'],
                opacity: 0.8,
                line: { width: 1, color: '#fff' }
            },
            hovertemplate: '<b>%{x}</b><br>Amount: $%{y:,.2f}<extra></extra>'
          },
        ]}
        layout={{ 
            autosize: true, 
            height: 300, 
            margin: { t: 20, b: 40, l: 60, r: 20 },
            template: 'plotly_white',
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Inter, sans-serif' },
            yaxis: { gridcolor: '#f1f5f9', tickprefix: '$' },
            xaxis: { gridcolor: 'rgba(0,0,0,0)' }
        }}
        useResizeHandler={true}
        style={{ width: "100%" }}
        config={{ displayModeBar: false }}
      />
    </motion.div>
  );
};

export default CostChart;
