import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface Props { title: string; description?: string; action?: ReactNode; icon?: ReactNode }

export default function EmptyState({ title, description, action, icon }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-2 py-14 text-center">
      <div className="text-brand-600">{icon ?? <Inbox size={36} />}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
