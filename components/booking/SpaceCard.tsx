import Link from 'next/link';
import type { Space } from '@/types/database';

const accentClasses = {
  terra: 'before:bg-terra text-terra',
  blue:  'before:bg-[#2c5e8e] text-[#2c5e8e]',
  moss:  'before:bg-moss text-moss',
} as const;

const dotClasses = {
  terra: 'bg-terra',
  blue:  'bg-[#2c5e8e]',
  moss:  'bg-moss',
} as const;

export default function SpaceCard({ space }: { space: Space }) {
  const accent = accentClasses[space.accent_color] || accentClasses.terra;
  const dotColor = dotClasses[space.accent_color] || dotClasses.terra;
  const features = Array.isArray(space.features) ? space.features : [];

  return (
    <article className="bg-bone border rounded-[18px] p-7 flex flex-col transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(29,25,22,0.18)]">
      <div className={`inline-flex items-center gap-2 text-[11.5px] uppercase tracking-[0.16em] mb-3.5 font-medium relative before:content-[''] before:w-5 before:h-px ${accent}`}>
        {space.tag}
      </div>
      <h3 className="font-serif font-normal text-[28px] leading-tight tracking-tight mb-3">
        {space.name}
      </h3>
      <p className="text-ink-soft text-sm leading-relaxed mb-5.5">{space.description}</p>

      <ul className="flex flex-col gap-1.5 text-[13px] text-ink-soft mb-5.5 flex-1 list-none">
        {features.slice(0, 5).map((f, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className={`w-1 h-1 rounded-full mt-2 flex-shrink-0 ${dotColor}`} />
            {f}
          </li>
        ))}
      </ul>

      <div className="flex justify-between items-end pt-4 border-t mb-4">
        <div>
          <div className="font-serif text-[28px] leading-none">
            ${space.base_price}
            <span className="text-[13px] text-ink-soft font-sans"> mxn</span>
          </div>
          <div className="text-[11.5px] text-ink-soft mt-1.5">
            {space.base_unit} · cap. {space.capacity}
          </div>
        </div>
      </div>

      <Link href={`/reservar/${space.id}`} className="btn btn-primary btn-full">
        Reservar
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </Link>
    </article>
  );
}
