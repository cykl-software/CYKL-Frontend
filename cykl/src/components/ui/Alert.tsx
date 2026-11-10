import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const STYLES = {
  error: { cls: 'border-red-200 bg-red-50 text-red-800', Icon: AlertCircle },
  success: { cls: 'border-brand-200 bg-brand-50 text-brand-900', Icon: CheckCircle2 },
  info: { cls: 'border-sky-200 bg-sky-50 text-sky-900', Icon: Info },
};

export default function Alert({ kind = 'info', children }: { kind?: keyof typeof STYLES; children: ReactNode }) {
  const { cls, Icon } = STYLES[kind];
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`flex gap-2 rounded-lg border px-3 py-2.5 text-sm ${cls}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
