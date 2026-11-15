'use client';
import { Database, Link, Server, Globe, Boxes, Cloud, Network } from 'lucide-react';

const ICON_MAP = { Database, Link, Server, Globe, Boxes, Cloud, Network };

const LEGEND = [
  { label: 'Healthy',  color: '#00A36C' },
  { label: 'Warning',  color: '#F59E0B' },
  { label: 'Critical', color: '#EF4444' },
  { label: 'Inactive', color: '#6B7280' },
];

// SVG viewport dimensions that correspond to the % positions
const VW = 600;
const VH = 240;
const CX = 0.50 * VW; // center X
const CY = 0.50 * VH; // center Y

export default function IntegrationMapDiagram({ nodes = [], onViewFullMap }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Diagram area */}
      <div style={{ position: 'relative', width: '100%', height: 240, userSelect: 'none' }}>

        {/* SVG connection lines (rendered behind nodes) */}
        <svg
          viewBox={`0 0 ${VW} ${VH}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
        >
          {nodes.map(node => (
            <line
              key={node.key}
              x1={CX} y1={CY}
              x2={node.xPct / 100 * VW}
              y2={node.yPct / 100 * VH}
              stroke={node.healthColor}
              strokeWidth="1.5"
              strokeDasharray="6 4"
              opacity="0.40"
            />
          ))}
        </svg>

        {/* Center — EAiQ */}
        <div style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2, textAlign: 'center',
        }}>
          <div style={{
            width: 100, height: 62,
            background: 'linear-gradient(135deg, #00338D 0%, #0077C8 100%)',
            borderRadius: 12,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 3,
            boxShadow: '0 0 28px rgba(0,119,200,0.40)',
            border: '1.5px solid rgba(0,119,200,0.55)',
          }}>
            {/* White icon/text on the brand-gradient hub node — intentional, kept for contrast */}
            <Network size={16} style={{ color: '#fff' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>EAiQ</span>
          </div>
        </div>

        {/* Peripheral nodes */}
        {nodes.map(node => {
          const Icon = ICON_MAP[node.iconKey] ?? Network;
          return (
            <div key={node.key} style={{
              position: 'absolute',
              left: `${node.xPct}%`,
              top: `${node.yPct}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 1, textAlign: 'center',
            }}>
              <div style={{
                width: 84,
                background: '#FFFFFF',
                border: `1.5px solid ${node.healthColor}45`,
                boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
                borderRadius: 10,
                padding: '7px 8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={13} style={{ color: '#1A1F36' }} />
                </div>
                <p style={{ fontSize: 7, fontWeight: 600, color: '#6B7280', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                  {node.label}
                </p>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1F36', fontFamily: 'ui-monospace,monospace', lineHeight: 1 }}>
                  {node.count}
                </p>
                {/* Health dot */}
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: node.healthColor, display: 'inline-block',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 10, padding: '0 2px', flexWrap: 'wrap' }}>
        {LEGEND.map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#6B7280' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: l.color, display: 'inline-block', flexShrink: 0 }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
