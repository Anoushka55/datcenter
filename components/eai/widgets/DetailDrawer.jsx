'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

// Shared right-side detail drawer — the one "show me more without leaving
// the page" pattern reused across every EAiQ widget/page. Renders a
// backdrop + slide-in panel with a header (icon/title/subtitle/close) and a
// scrollable body; `footer` is an optional pinned action row (e.g. a
// "Go to Operations Hub" link).
export default function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  icon,
  accentColor = '#0077C8',
  width = 440,
  footer,
  children,
}) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) { setEntered(false); return; }
    const id = requestAnimationFrame(() => setEntered(true));
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop — zIndex sits above other page-level modals (e.g. a fullscreen globe/map
          expand) so the drawer can be opened as a drill-down from within one. */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1998,
          background: 'rgba(16,24,40,0.32)',
          opacity: entered ? 1 : 0,
          transition: 'opacity 0.2s ease-out',
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'fixed', top: 0, right: 0, height: '100vh',
          width, maxWidth: '92vw',
          background: '#FFFFFF', borderLeft: '1px solid #E2E8F0',
          boxShadow: '-8px 0 32px rgba(16,24,40,0.16)',
          zIndex: 1999, display: 'flex', flexDirection: 'column',
          transform: entered ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.22s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
          padding: '18px 20px', borderBottom: '1px solid #E2E8F0', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {icon && (
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: accentColor + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {icon}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <h2 style={{
                fontSize: 15, fontWeight: 700, color: '#1A1F36', margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{title}</h2>
              {subtitle && <p style={{ fontSize: 11, color: '#6B7280', margin: '3px 0 0' }}>{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              border: '1px solid #E2E8F0', background: '#F8FAFC',
              color: '#6B7280', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F4F6F9'; e.currentTarget.style.color = '#1A1F36'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#6B7280'; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

// ── Reusable content pieces for drawer bodies ────────────────────────────────

// Simple 2-column data table for list/breakdown content.
export function DrawerTable({ columns, rows, keyField = 'id' }) {
  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ background: '#F8FAFC' }}>
            {columns.map(c => (
              <th key={c.key} style={{
                textAlign: c.align ?? 'left', padding: '8px 10px',
                fontSize: 9, fontWeight: 700, color: '#6B7280',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap',
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row[keyField] ?? i}
              onClick={row.__onClick}
              style={{
                borderBottom: i < rows.length - 1 ? '1px solid #E2E8F0' : 'none',
                cursor: row.__onClick ? 'pointer' : 'default',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (row.__onClick) e.currentTarget.style.background = '#F8FAFC'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {columns.map(c => (
                <td key={c.key} style={{
                  padding: '8px 10px', textAlign: c.align ?? 'left',
                  color: '#1A1F36', whiteSpace: 'nowrap',
                }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Labeled key/value stat row, used to lead off most drawer bodies.
export function DrawerStatRow({ items }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      {items.map(it => (
        <div key={it.label} style={{
          flex: '1 1 100px', background: '#F8FAFC', border: '1px solid #E2E8F0',
          borderRadius: 10, padding: '9px 12px',
        }}>
          <p style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{it.label}</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: it.color ?? '#1A1F36', fontFamily: 'ui-monospace,monospace', lineHeight: 1 }}>{it.value}</p>
        </div>
      ))}
    </div>
  );
}

// Small colored status pill, consistent with the rest of the platform.
export function DrawerPill({ label, color }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 9, fontWeight: 700,
      color, background: color + '18', border: `1px solid ${color}40`,
      borderRadius: 5, padding: '2px 7px',
    }}>{label}</span>
  );
}
