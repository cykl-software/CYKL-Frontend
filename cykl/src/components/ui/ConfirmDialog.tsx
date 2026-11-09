import { Loader2 } from 'lucide-react';
import Modal from './Modal';

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel, danger, busy, onConfirm, onCancel }: Props) {
  return (
    <Modal title={title} onClose={busy ? () => {} : onCancel}>
      <p className="text-sm text-ink-soft">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn-outline" onClick={onCancel} disabled={busy}>Voltar</button>
        <button type="button" className={danger ? 'btn bg-red-700 text-white hover:bg-red-800' : 'btn-primary'} onClick={onConfirm} disabled={busy}>
          {busy && <Loader2 size={16} className="animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
