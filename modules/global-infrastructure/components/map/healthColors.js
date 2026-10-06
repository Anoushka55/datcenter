// Plain constant, no leaflet import — safe to use from server-rendered
// components like MapLegend that sit outside the ssr:false WorldMap boundary.
export const HEALTH_COLORS = {
  healthy: '#00A36C',
  warning: '#D4A017',
  critical: '#DC2626',
  commissioning: '#94A3B8',
};
