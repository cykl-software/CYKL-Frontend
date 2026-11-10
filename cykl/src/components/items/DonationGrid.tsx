import type { Donation } from '../../types';
import DonationCard from './DonationCard';

export default function DonationGrid({ donations }: { donations: Donation[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {donations.map((d) => <li key={d.id} className="flex"><div className="flex w-full flex-col [&>a]:flex-1"><DonationCard donation={d} /></div></li>)}
    </ul>
  );
}
