import { DONATION_STATUS, REQUEST_STATUS } from '../../utils/constants';
import type { DonationStatus, RequestStatus } from '../../types';

type Props =
  | { kind: 'donation'; status: DonationStatus }
  | { kind: 'request'; status: RequestStatus };

export default function StatusBadge(props: Props) {
  const cfg = props.kind === 'donation' ? DONATION_STATUS[props.status] : REQUEST_STATUS[props.status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
