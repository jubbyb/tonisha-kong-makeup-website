const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface CalendarViewProps {
  year: number;
  month: number; // 0-indexed
  markedDates: string[]; // YYYY-MM-DD — dates with available slots
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

function getMonthCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon = 0, Sun = 6
  const cells: (number | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarView({
  year,
  month,
  markedDates,
  selectedDate,
  onDateSelect,
  onMonthChange,
}: CalendarViewProps) {
  const cells = getMonthCells(year, month);
  const todayStr = new Date().toISOString().split('T')[0];
  const marked = new Set(markedDates);
  const monthLabel = new Date(year, month, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const prev = () => {
    const d = new Date(year, month - 1, 1);
    onMonthChange(d.getFullYear(), d.getMonth());
  };
  const next = () => {
    const d = new Date(year, month + 1, 1);
    onMonthChange(d.getFullYear(), d.getMonth());
  };

  return (
    <div className="w-full select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button className="btn btn-ghost btn-sm text-lg" onClick={prev}>‹</button>
        <span className="font-semibold">{monthLabel}</span>
        <button className="btn btn-ghost btn-sm text-lg" onClick={next}>›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-base-content/50 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const dateStr = toDateStr(year, month, day);
          const isPast = dateStr < todayStr;
          const isMarked = marked.has(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;

          let cellClass =
            'aspect-square flex flex-col items-center justify-center rounded-full text-sm transition-colors ';

          if (isSelected) {
            cellClass += 'bg-primary text-primary-content font-semibold ';
          } else if (isMarked && !isPast) {
            cellClass += 'bg-success/20 hover:bg-success/40 cursor-pointer font-medium ';
          } else {
            cellClass += 'opacity-30 cursor-default ';
          }

          if (isToday && !isSelected) cellClass += 'ring-2 ring-primary ';

          return (
            <button
              key={idx}
              disabled={isPast || !isMarked}
              onClick={() => isMarked && !isPast && onDateSelect(dateStr)}
              className={cellClass}
            >
              {day}
              {isMarked && !isSelected && !isPast && (
                <span className="w-1 h-1 rounded-full bg-success mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs text-base-content/50">
        <span className="w-3 h-3 rounded-full bg-success/40 inline-block" />
        Available
      </div>
    </div>
  );
}
