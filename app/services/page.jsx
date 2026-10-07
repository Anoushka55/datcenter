'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X, Route } from 'lucide-react';
import ServiceRoute from '@/components/services/ServiceRoute';
import { SERVICE_STAGES } from '@/data/serviceRoute';

export default function ServicesPage() {
  const router = useRouter();
  const activeCount = SERVICE_STAGES.filter(s => s.active).length;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">

      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="flex-shrink-0 bg-white border-b border-grey-border px-5 py-3 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg border border-grey-border flex items-center justify-center hover:bg-grey-bg transition-colors flex-shrink-0"
          >
            <X size={14} className="text-text-secondary" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Route size={14} className="text-accent" />
            </div>
            <div className="min-w-0">
              <p
                className="font-extrabold text-text-primary text-sm leading-tight truncate"
                style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
              >
                Services
              </p>
              <p className="text-[9px] text-text-muted leading-tight">
                Deal Advisory · Full Lifecycle Service Map
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-success-light border border-grey-border rounded-lg">
            <span className="w-2 h-2 rounded-full bg-success flex-shrink-0" style={{ boxShadow: '0 0 6px #00B0A0' }} />
            <span className="text-sm font-black tabular-nums text-success">{activeCount}</span>
            <span className="text-[9px] text-text-secondary font-medium">Live agents</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-grey-bg border border-grey-border rounded-lg">
            <span className="text-sm font-black tabular-nums text-text-primary">{SERVICE_STAGES.length}</span>
            <span className="text-[9px] text-text-secondary font-medium">Service stops</span>
          </div>
        </div>
      </motion.div>

      {/* Route diagram — fits in one frame, no scrolling */}
      <div className="flex-1 relative overflow-hidden px-4 py-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="w-full h-full"
        >
          <ServiceRoute />
        </motion.div>
      </div>
    </div>
  );
}
