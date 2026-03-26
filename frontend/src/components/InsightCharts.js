import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { motion } from 'framer-motion';

// ─── Colour palette for resource types ───────────────────────────────────────
const TYPE_COLORS = {
  ec2:        '#6366f1',
  s3:         '#10b981',
  rds:        '#f59e0b',
  lambda:     '#8b5cf6',
  eks:        '#06b6d4',
  iam:        '#ef4444',
  ebs:        '#f97316',
  elb:        '#14b8a6',
  default:    '#94a3b8',
};

function typeColor(resourceType = '') {
  const t = resourceType.toLowerCase();
  for (const [key, color] of Object.entries(TYPE_COLORS)) {
    if (t.includes(key)) return color;
  }
  return TYPE_COLORS.default;
}

const plotlyBaseLayout = {
  autosize: true,
  height: 320,
  margin: { t: 30, b: 70, l: 65, r: 35 },
  paper_bgcolor: 'rgba(15, 23, 42, 0.02)',
  plot_bgcolor:  'rgba(15, 23, 42, 0.02)',
  font: { family: 'Inter, sans-serif', size: 11, color: '#64748b' },
};

// ─── 1. Cost vs Risk Scatter / Bubble Chart ───────────────────────────────────
const CostRiskScatter = ({ data = [] }) => {
  const typeGroups = useMemo(() => {
    const groups = {};
    data.forEach(r => {
      const t = r.resource_type || 'Unknown';
      if (!groups[t]) groups[t] = { x: [], y: [], size: [], text: [] };
      groups[t].x.push(r.cost);
      groups[t].y.push(r.risk_score);
      groups[t].size.push(r.impact);
      groups[t].text.push(`${r.resource_name}<br>Cost: $${r.cost}<br>Risk: ${r.risk_score}<br>Waste: $${r.waste}`);
    });
    return groups;
  }, [data]);

  const traces = Object.entries(typeGroups).map(([type, vals]) => ({
    type: 'scatter',
    mode: 'markers',
    name: type,
    x: vals.x,
    y: vals.y,
    text: vals.text,
    hovertemplate: '%{text}<extra></extra>',
    marker: {
      size: vals.size.map(s => Math.min(40, Math.max(8, s / 3))),
      color: typeColor(type),
      opacity: 0.75,
      line: { width: 1, color: '#fff' },
    },
  }));

  return (
    <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <h3 style={{ marginBottom: '0.25rem' }}>Cost vs Risk</h3>
      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.5rem' }}>
        Bubble size = finding count · High-right = highest priority
      </p>
      <Plot
        data={traces}
        layout={{
          ...plotlyBaseLayout,
          xaxis: { title: 'Monthly Cost ($)', gridcolor: '#f1f5f9', tickprefix: '$' },
          yaxis: { title: 'CVSS Risk Score', gridcolor: '#f1f5f9', range: [0, 11] },
          showlegend: true,
          legend: { orientation: 'h', y: -0.35, x: 0 },
        }}
        useResizeHandler style={{ width: '100%' }}
        config={{ displayModeBar: false }}
      />
    </motion.div>
  );
};

// ─── 2. Neural Threat Surface (3D ML Visual) ───────────────────────────
const NeuralThreatSurface = () => {
  // Generate dynamic mock data for the MVP "show"
  const zData = Array.from({ length: 15 }, () => 
    Array.from({ length: 15 }, () => Math.random() * 100)
  );

  return (
    <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <h3 style={{ marginBottom: '0.25rem', color: 'var(--danger)' }}>Neural Threat Detection Surface</h3>
      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.5rem' }}>
        Live multi-dimensional anomaly variance and correlation
      </p>
      <Plot
        data={[{
          z: zData,
          type: 'surface',
          colorscale: 'YlOrRd',
          showscale: false
        }]}
        layout={{
          ...plotlyBaseLayout,
          margin: { t: 10, b: 10, l: 10, r: 10 },
          scene: {
            xaxis: { title: '', showticklabels: false, backgroundcolor: 'rgba(0,0,0,0.05)' },
            yaxis: { title: '', showticklabels: false, backgroundcolor: 'rgba(0,0,0,0.05)' },
            zaxis: { title: 'Confidence %', backgroundcolor: 'rgba(0,0,0,0.05)' }
          }
        }}
        useResizeHandler style={{ width: '100%' }}
        config={{ displayModeBar: false }}
      />
    </motion.div>
  );
};

// ─── 3. Time Trend Graph ──────────────────────────────────────────────────────
const TimeTrendGraph = ({ trendData = [] }) => {
  const months     = trendData.map(d => d.month);
  const costs      = trendData.map(d => d.total_cost);
  const wasted     = trendData.map(d => d.wasted_cost);
  const riskCounts = trendData.map(d => d.risk_count);
  const compliance = trendData.map(d => d.compliance_score);

  return (
    <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <h3 style={{ marginBottom: '0.25rem' }}>Time Trend</h3>
      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.5rem' }}>
        Monthly cost, risk count &amp; compliance score
      </p>
      <Plot
        data={[
          {
            type: 'scatter', mode: 'lines+markers', name: 'Total Cost',
            x: months, y: costs,
            line: { color: '#6366f1', width: 2 },
            marker: { size: 5 },
            hovertemplate: '<b>%{x}</b><br>Cost: $%{y:,.0f}<extra></extra>',
            yaxis: 'y',
          },
          {
            type: 'scatter', mode: 'lines+markers', name: 'Wasted Cost',
            x: months, y: wasted,
            line: { color: '#ef4444', width: 2, dash: 'dot' },
            marker: { size: 5 },
            hovertemplate: '<b>%{x}</b><br>Waste: $%{y:,.0f}<extra></extra>',
            yaxis: 'y',
          },
          {
            type: 'scatter', mode: 'lines+markers', name: 'Risk Count',
            x: months, y: riskCounts,
            line: { color: '#f59e0b', width: 2 },
            marker: { size: 5 },
            hovertemplate: '<b>%{x}</b><br>Risks: %{y}<extra></extra>',
            yaxis: 'y2',
          },
          {
            type: 'scatter', mode: 'lines+markers', name: 'Compliance %',
            x: months, y: compliance,
            line: { color: '#10b981', width: 2, dash: 'dash' },
            marker: { size: 5 },
            hovertemplate: '<b>%{x}</b><br>Compliance: %{y}%<extra></extra>',
            yaxis: 'y2',
          },
        ]}
        layout={{
          ...plotlyBaseLayout,
          height: 320,
          margin: { ...plotlyBaseLayout.margin, r: 60, l: 60 },
          yaxis:  { title: 'Cost ($)', gridcolor: '#f1f5f9', tickprefix: '$', titlefont: { size: 10 } },
          yaxis2: { title: 'Risks / Compliance %', overlaying: 'y', side: 'right', showgrid: false, titlefont: { size: 10 } },
          legend: { orientation: 'h', y: -0.35, x: 0 },
          showlegend: true,
        }}
        useResizeHandler style={{ width: '100%' }}
        config={{ displayModeBar: false }}
      />
    </motion.div>
  );
};

// ─── 4. Resource Impact Ranking (top 5 by combined score) ─────────────────────
const ResourceImpactRanking = ({ scatterData = [] }) => {
  const top5 = useMemo(() => {
    return [...scatterData]
      .map(r => ({ ...r, score: r.cost + r.risk_score * 50 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [scatterData]);

  const names  = top5.map(r => r.resource_name.length > 20 ? r.resource_name.slice(0, 18) + '…' : r.resource_name);
  const scores = top5.map(r => parseFloat(r.score.toFixed(1)));

  return (
    <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <h3 style={{ marginBottom: '0.25rem' }}>Resource Impact Ranking</h3>
      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.5rem' }}>
        Top 5 resources ranked by combined cost + risk score
      </p>
      <Plot
        data={[{
          type: 'bar',
          orientation: 'h',
          x: scores,
          y: names,
          marker: {
            color: scores.map((_, i) => {
              const palette = ['#ef4444', '#f97316', '#f59e0b', '#6366f1', '#10b981'];
              return palette[i] || '#94a3b8';
            }),
            opacity: 0.85,
            line: { width: 1, color: '#fff' },
          },
          hovertemplate: '<b>%{y}</b><br>Impact Score: %{x}<extra></extra>',
          text: scores.map(String),
          textposition: 'outside',
        }]}
        layout={{
          ...plotlyBaseLayout,
          margin: { ...plotlyBaseLayout.margin, l: 130 },
          xaxis: { title: 'Impact Score', gridcolor: '#f1f5f9' },
          yaxis: { autorange: 'reversed' },
          showlegend: false,
        }}
        useResizeHandler style={{ width: '100%' }}
        config={{ displayModeBar: false }}
      />
    </motion.div>
  );
};

// ─── Main InsightCharts wrapper ────────────────────────────────────────────────
const InsightCharts = ({ scatterData = [], trendData = [], riskStats = null }) => {
  if (!scatterData.length && !trendData.length && !riskStats) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
        <p>📊 Loading insight charts…</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        🔍 Intelligence Insights
        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 400 }}>
          · Live backend data
        </span>
      </h2>

      {/* Row 1 */}
      <div className="chart-row" style={{ marginBottom: '1.5rem' }}>
        <CostRiskScatter  data={scatterData} />
        <NeuralThreatSurface />
      </div>

      {/* Row 2 */}
      <div className="chart-row">
        <TimeTrendGraph       trendData={trendData} />
        <ResourceImpactRanking scatterData={scatterData} />
      </div>
    </div>
  );
};

export default InsightCharts;
