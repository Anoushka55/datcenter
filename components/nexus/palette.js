// Colour for every twin state, shared by the 3D view and the React legends.
export const BACKGROUND = '#070d18';

export const STATE_STYLE = {
  neutral: { color: '#4b6a8f' },
  free: { color: '#1e2d42' },
  blocked: { color: '#5b2a2a' },
  selected: { color: '#60a5fa', pulse: 'soft' },
  dimmed: { color: '#4b6a8f', dim: true },
  ok: { color: '#22c55e' },
  tight: { color: '#f59e0b', pulse: 'soft' },
  exceeded: { color: '#ef4444', pulse: 'strong' },
  redundancy_lost: { color: '#a855f7', outline: true },
  failed: { color: '#7f1d1d', outline: true },
  changed: { color: '#e2e8f0', pulse: 'soft' },
  deployable: { color: '#22c55e' },
  available: { color: '#f59e0b' },
  'occupied-eligible': { color: '#64748b' },
  'stranded-cooling': { color: '#f97316' },
  'stranded-space': { color: '#e11d48' },
  planned: { color: '#38bdf8' },
  'band-green': { color: '#22c55e' },
  'band-amber': { color: '#f59e0b' },
  'band-red': { color: '#ef4444' },
  alert: { color: '#ef4444', pulse: 'strong', outline: true },
};

export const COMPONENT_BASE = { electrical: '#5b7fa6', thermal: '#3f8f98', load: '#4b6a8f' };

export const LABEL_TONE = {
  exceeded: '#fca5a5', failed: '#fca5a5', redundancy_lost: '#d8b4fe', tight: '#fcd34d', ok: '#86efac',
  changed: '#f1f5f9', deployable: '#86efac', planned: '#7dd3fc', 'stranded-cooling': '#fdba74', 'stranded-space': '#fda4af',
  'band-green': '#86efac', 'band-amber': '#fcd34d', 'band-red': '#fca5a5', zone: '#64748b',
};

export const legendColor = (state) => (STATE_STYLE[state]?.dim ? '#334155' : STATE_STYLE[state]?.color ?? '#64748b');
