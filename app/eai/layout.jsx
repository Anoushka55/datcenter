import EAIShell from '@/components/eai/EAIShell';

export const metadata = { title: 'EAiQ — Enterprise Asset Intelligence' };

export default function EAILayout({ children }) {
  return <EAIShell>{children}</EAIShell>;
}
