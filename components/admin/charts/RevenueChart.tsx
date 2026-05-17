'use client';

interface DataPoint {
  date: string;
  label: string;
  revenue: number;
}

interface Props {
  data: DataPoint[];
}

export default function RevenueChart({ data }: Props) {
  const max = Math.max(...data.map(d => d.revenue), 1);
  // Redondear el max al siguiente múltiplo de 1000 para que se vea limpio
  const yMax = Math.ceil(max / 1000) * 1000 || 1000;
  const ySteps = [yMax, yMax * 0.75, yMax * 0.5, yMax * 0.25, 0];

  return (
    <div className="flex">
      {/* Y axis */}
      <div className="flex flex-col justify-between pb-7 pr-2 text-[10.5px] text-ink-soft text-right min-w-[44px]">
        {ySteps.map(s => (
          <span key={s}>${(s / 1000).toFixed(1)}k</span>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 flex items-end gap-2 h-[200px] pt-2 pb-7 relative">
        {/* Grid lines */}
        <div className="absolute inset-0 pb-7 flex flex-col justify-between pointer-events-none">
          {ySteps.map((_, i) => (
            <div key={i} className="h-px bg-ink/8 w-full" />
          ))}
        </div>

        {/* Bars */}
        {data.map((d, i) => {
          const heightPct = max > 0 ? (d.revenue / yMax) * 100 : 0;
          return (
            <div
              key={i}
              className="flex-1 relative group"
              style={{ height: '100%' }}
            >
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-terra-deep to-terra rounded-t-md transition-all hover:brightness-110 cursor-pointer"
                style={{ height: `${Math.max(heightPct, 1.5)}%` }}
                title={`${d.date}: $${d.revenue.toLocaleString('es-MX')}`}
              />
              <div className="absolute -bottom-6 left-0 right-0 text-center text-[10.5px] text-ink-soft">
                {d.label}
              </div>
              {/* Tooltip on hover */}
              {d.revenue > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-ink text-paper text-[10.5px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  ${d.revenue.toLocaleString('es-MX')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
