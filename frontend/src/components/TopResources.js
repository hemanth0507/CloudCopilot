import React from 'react';
import Plot from 'react-plotly.js';

const TopResources = ({ resources }) => {
  const names = resources?.map(r => r.resource_name) || [];
  const costs = resources?.map(r => r.monthly_cost_usd) || [];

  return (
    <div className="card">
      <h3>Top Costly Resources</h3>
      <Plot
        data={[
          {
            x: costs,
            y: names,
            type: 'bar',
            orientation: 'h',
            marker: { color: '#3498db' },
          },
        ]}
        layout={{ 
            autosize: true, 
            height: 350, 
            margin: { t: 20, b: 40, l: 150, r: 20 },
            yaxis: { autorange: 'reversed' },
            template: 'plotly_white'
        }}
        useResizeHandler={true}
        style={{ width: "100%" }}
      />
    </div>
  );
};

export default TopResources;
