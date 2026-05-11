import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { buildWhatsAppUrl, defaultBookingMessage } from '../lib/whatsapp';

interface Artist {
  id: number;
  name: string;
  bio: string | null;
  specialties: string | null;
  photo_url: string | null;
  whatsapp_number: string | null;
  industries: { slug: string; name: string }[];
}

interface Slot {
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
}

interface CatalogService {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  duration_min: number;
  subcategory_id: number;
  subcategory_name: string;
  category_id: number;
  category_name: string;
}

type BookingStep = 'service' | 'schedule' | 'details' | 'success';

interface BookingFlowProps {
  preselectedArtistId: number;
  preselectedService?: string;
  classDatetime?: string; // ISO datetime like "2025-08-10T14:00"
  classDuration?: number; // minutes, default 60
  onClose?: () => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M10 4L6 8L10 12"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M6 4L10 8L6 12"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--ink-2)',
      fontSize: '0.72rem',
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      marginBottom: '1.75rem',
      padding: 0,
    }}
  >
    <ChevronLeft />
    Back
  </button>
);

const BookingFlow: React.FC<BookingFlowProps> = ({
  preselectedService,
  preselectedArtistId,
  classDatetime,
  classDuration,
  onClose,
}) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const { user, token } = useAuth();

  // ── Step ────────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<BookingStep>('service');

  // ── Artist (preselected; fetched once for display info) ─────────────────────
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  // ── Service ──────────────────────────────────────────────────────────────────
  const [artistCatalog, setArtistCatalog] = useState<CatalogService[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<CatalogService | null>(null);

  // ── Schedule ────────────────────────────────────────────────────────────────
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // ── Details ─────────────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [conflictSlots, setConflictSlots] = useState<Slot[] | null>(null);

  // ── Pre-populate details from user profile ───────────────────────────────────
  useEffect(() => {
    if (step !== 'details' || !user || !token) return;
    if (name || email) return; // already filled (user typed something)
    apiFetch<{ name: string; email: string; phone: string | null }>('/api/user/profile')
      .then((profile) => {
        setName(profile.name);
        setEmail(profile.email);
        setPhone(profile.phone ?? '');
      })
      .catch(() => {
        // fall back to JWT claims
        setName(user.name);
        setEmail(user.email);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateEmail = (v: string) => {
    if (!v.trim()) return 'Email is required.';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Please enter a valid email address.';
  };

  const validatePhone = (v: string) => {
    if (!v.trim()) return '';
    return /^[+\d][\d\s\-().]{6,19}$/.test(v.trim())
      ? ''
      : 'Please enter a valid phone number (digits, spaces, dashes, parentheses).';
  };

  const validateFields = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    const phoneErr = validatePhone(phone);
    if (phoneErr) errs.phone = phoneErr;
    return errs;
  };

  // ── Fetch the preselected artist on mount ───────────────────────────────────
  useEffect(() => {
    fetch(`/api/artists/${preselectedArtistId}`)
      .then((r) => r.json() as Promise<Artist>)
      .then(setSelectedArtist)
      .catch(() => {});
  }, [preselectedArtistId]);

  // ── Fetch artist's offered services when artist changes ──────────────────────
  useEffect(() => {
    if (!selectedArtist) return;
    if (classDatetime) return; // class mode: use synthetic service, skip catalog fetch
    setCatalogLoading(true);
    setSelectedService(null);
    fetch(`/api/artists/${selectedArtist.id}/services`)
      .then((r) => r.json() as Promise<CatalogService[]>)
      .then((data) => {
        setArtistCatalog(data);
        setCatalogLoading(false);
      })
      .catch(() => setCatalogLoading(false));
  }, [selectedArtist, classDatetime]);

  // ── Auto-select preselected service once catalog loads ───────────────────────
  useEffect(() => {
    if (!preselectedService || catalogLoading || artistCatalog.length === 0) return;
    if (classDatetime) return; // class mode handles this separately
    const match = artistCatalog.find(
      (s) => s.name.toLowerCase() === preselectedService.toLowerCase(),
    );
    if (match) {
      setSelectedService(match);
      setStep('schedule');
    }
  }, [preselectedService, artistCatalog, catalogLoading, classDatetime]);

  // ── Class mode: auto-select date/time + synthetic service, skip to details ──
  useEffect(() => {
    if (!classDatetime || !selectedArtist) return;

    const dateStr = classDatetime.split('T')[0];
    const startTime = classDatetime.split('T')[1]?.slice(0, 5) ?? '09:00';
    const dur = classDuration ?? 60;
    const [h, m] = startTime.split(':').map(Number);
    const endMin = h * 60 + m + dur;
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

    setSelectedDate(dateStr);
    setSelectedSlot({ date: dateStr, start: startTime, end: endTime });
    setSelectedService({
      id: -1,
      name: preselectedService ?? '',
      description: null,
      price: null,
      duration_min: dur,
      subcategory_id: -1,
      subcategory_name: '',
      category_id: -1,
      category_name: '',
    });
    setStep('details');
  }, [classDatetime, classDuration, selectedArtist, preselectedService]);

  // ── Fetch slots when artist or month changes ─────────────────────────────────
  useEffect(() => {
    if (!selectedArtist || step !== 'schedule') return;
    setSlotsLoading(true);
    setSelectedDate(null);
    setSelectedSlot(null);

    const from = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
    const to = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const durationParam = selectedService ? `&duration=${selectedService.duration_min}` : '';
    fetch(`/api/artists/${selectedArtist.id}/slots?from=${from}&to=${to}${durationParam}`)
      .then((r) => r.json() as Promise<Slot[]>)
      .then((data) => {
        setSlots(data);
        setSlotsLoading(false);
      })
      .catch(() => setSlotsLoading(false));
  }, [selectedArtist, calYear, calMonth, step, selectedService]);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const availableDates = useMemo(() => {
    const s = new Set<string>();
    for (const slot of slots) s.add(slot.date);
    return s;
  }, [slots]);

  const dateSlots = useMemo(() => {
    if (!selectedDate) return [];
    return slots.filter((s) => s.date === selectedDate);
  }, [slots, selectedDate]);

  // ── Calendar grid ─────────────────────────────────────────────────────────────
  const calendarCells = useMemo(() => {
    const firstDayJS = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
    const startPad = (firstDayJS + 6) % 7; // shift to Mon=0
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: Array<number | null> = Array(startPad).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [calYear, calMonth]);

  const toDateStr = (day: number) =>
    `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const canGoPrev =
    calYear > today.getFullYear() ||
    (calYear === today.getFullYear() && calMonth > today.getMonth());

  const goPrev = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else setCalMonth((m) => m - 1);
  };

  const goNext = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else setCalMonth((m) => m + 1);
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedArtist || !selectedService) return;

    // Validate before submitting
    const errs = validateFields();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setConflictSlots(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          service: selectedService.name,
          artist_id: selectedArtist.id,
          date: selectedSlot.date,
          start_time: selectedSlot.start,
          end_time: (() => {
            const [h, m] = selectedSlot.start.split(':').map(Number);
            const endMin = h * 60 + m + selectedService.duration_min;
            return `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
          })(),
          message: notes,
        }),
      });
      if (res.status === 409) {
        await loadConflictAlternatives(selectedSlot, selectedService);
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        const { error: err } = (await res.json()) as { error: string };
        throw new Error(err ?? 'Booking failed');
      }
      setStep('success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit booking.');
    } finally {
      setSubmitting(false);
    }
  };

  // Refetch slots for the next week starting at the conflicted day; pick 3 alternatives
  const loadConflictAlternatives = async (taken: Slot, svc: CatalogService) => {
    if (!selectedArtist) return;
    const from = taken.date;
    const toDate = new Date(taken.date + 'T00:00:00');
    toDate.setDate(toDate.getDate() + 7);
    const to = toDate.toISOString().split('T')[0];
    try {
      const res = await fetch(
        `/api/artists/${selectedArtist.id}/slots?from=${from}&to=${to}&duration=${svc.duration_min}`,
      );
      if (!res.ok) {
        setSubmitError('That slot was just taken. Please pick another time.');
        return;
      }
      const all = (await res.json()) as Slot[];
      const others = all.filter((s) => !(s.date === taken.date && s.start === taken.start));
      const sameDay = others.filter((s) => s.date === taken.date);
      const otherDays = others.filter((s) => s.date !== taken.date);
      const picks = [...sameDay, ...otherDays].slice(0, 3);
      if (picks.length === 0) {
        setSubmitError(
          'That slot was just taken and nothing else is open this week. Try another date.',
        );
        return;
      }
      setConflictSlots(picks);
    } catch {
      setSubmitError('That slot was just taken. Please pick another time.');
    }
  };

  // ── Format helpers ────────────────────────────────────────────────────────────
  const fmtDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const fmtTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h < 12 ? 'AM' : 'PM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  // ── Step indicator ────────────────────────────────────────────────────────────
  const visibleSteps: BookingStep[] = classDatetime
    ? ['details']
    : ['service', 'schedule', 'details'];
  const stepLabels: Record<BookingStep, string> = {
    service: 'Service',
    schedule: 'Schedule',
    details: 'Details',
    success: 'Confirmed',
  };

  const renderStepIndicator = () => {
    if (step === 'success') return null;
    const currentIdx = visibleSteps.indexOf(step);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '2.5rem' }}>
        {visibleSteps.map((s, i) => {
          const isDone = currentIdx > i;
          const isCurrent = s === step;
          return (
            <React.Fragment key={s}>
              {i > 0 && (
                <div
                  style={{
                    flex: 1,
                    height: '1px',
                    background: isDone ? 'var(--accent)' : 'var(--line-2)',
                    transition: 'background 0.4s',
                  }}
                />
              )}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <div
                  style={{
                    width: '22px',
                    height: '22px',
                    border: `1px solid ${isCurrent || isDone ? 'var(--accent)' : 'var(--line-2)'}`,
                    background: isDone ? 'var(--accent)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}
                >
                  {isDone ? (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="var(--bg)"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.58rem',
                        color: isCurrent ? 'var(--accent)' : 'var(--ink-3)',
                        lineHeight: 1,
                      }}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '0.55rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: isCurrent ? 'var(--accent)' : isDone ? 'var(--ink-2)' : 'var(--ink-3)',
                  }}
                >
                  {stepLabels[s]}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ── STEP: Service ─────────────────────────────────────────────────────────────
  if (step === 'service') {
    // Group services by category > subcategory
    const categoryMap = new Map<string, Map<string, CatalogService[]>>();
    for (const svc of artistCatalog) {
      if (!categoryMap.has(svc.category_name)) categoryMap.set(svc.category_name, new Map());
      const subMap = categoryMap.get(svc.category_name)!;
      if (!subMap.has(svc.subcategory_name)) subMap.set(svc.subcategory_name, []);
      subMap.get(svc.subcategory_name)!.push(svc);
    }

    return (
      <div>
        {renderStepIndicator()}

        <p
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: '0.35rem',
          }}
        >
          {selectedArtist?.name}
        </p>
        <h3
          className="font-display"
          style={{ fontSize: '1.6rem', fontWeight: 300, color: 'var(--ink)', marginBottom: '2rem' }}
        >
          Choose a Service
        </h3>

        {catalogLoading ? (
          <p style={{ color: 'var(--ink-2)', fontSize: '0.82rem', letterSpacing: '0.08em' }}>
            Loading services...
          </p>
        ) : artistCatalog.length === 0 ? (
          <p style={{ color: 'var(--ink-2)', fontSize: '0.88rem', lineHeight: 1.7 }}>
            No services listed for this artist yet. Please{' '}
            <a href="/contact" style={{ color: 'var(--accent)' }}>
              contact us
            </a>{' '}
            directly.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {Array.from(categoryMap.entries()).map(([catName, subMap]) => (
              <div key={catName}>
                <p
                  style={{
                    fontSize: '0.58rem',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                    marginBottom: '1rem',
                  }}
                >
                  {catName}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {Array.from(subMap.entries()).map(([subName, svcs]) => (
                    <div key={subName}>
                      <p
                        style={{
                          fontSize: '0.65rem',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'var(--ink-2)',
                          marginBottom: '0.6rem',
                          paddingLeft: '0.1rem',
                        }}
                      >
                        {subName}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {svcs.map((svc) => (
                          <button
                            key={svc.id}
                            onClick={() => {
                              setSelectedService(svc);
                              setStep('schedule');
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '1rem',
                              padding: '1rem 1.25rem',
                              background: 'transparent',
                              border: '1px solid var(--line-2)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'border-color 0.2s, background 0.2s',
                              width: '100%',
                            }}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.borderColor = 'var(--accent)';
                              el.style.background = 'var(--bg-card)';
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.borderColor = 'var(--line-2)';
                              el.style.background = 'transparent';
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <p
                                className="font-display"
                                style={{
                                  fontSize: '1rem',
                                  fontWeight: 400,
                                  color: 'var(--ink)',
                                  marginBottom: '0.15rem',
                                }}
                              >
                                {svc.name}
                              </p>
                              {svc.description && (
                                <p
                                  style={{
                                    fontSize: '0.72rem',
                                    color: 'var(--ink-2)',
                                    lineHeight: 1.55,
                                  }}
                                >
                                  {svc.description}
                                </p>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              {svc.price != null && (
                                <p
                                  style={{
                                    fontSize: '0.88rem',
                                    color: 'var(--ink)',
                                    fontWeight: 500,
                                  }}
                                >
                                  ${svc.price}
                                </p>
                              )}
                              <p
                                style={{
                                  fontSize: '0.68rem',
                                  color: 'var(--ink-2)',
                                  marginTop: '0.1rem',
                                }}
                              >
                                {svc.duration_min} min
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── STEP: Schedule ────────────────────────────────────────────────────────────
  if (step === 'schedule') {
    return (
      <div>
        {renderStepIndicator()}
        <BackButton onClick={() => setStep('service')} />

        <p
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: '0.35rem',
          }}
        >
          {selectedArtist?.name} · {selectedService?.name}
        </p>
        <h3
          className="font-display"
          style={{ fontSize: '1.6rem', fontWeight: 300, color: 'var(--ink)', marginBottom: '2rem' }}
        >
          Choose a Date & Time
        </h3>

        {/* Month navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
          }}
        >
          <button
            onClick={goPrev}
            disabled={!canGoPrev}
            style={{
              background: 'none',
              border: 'none',
              cursor: canGoPrev ? 'pointer' : 'not-allowed',
              color: canGoPrev ? 'var(--ink-2)' : 'var(--ink-3)',
              padding: '0.4rem',
            }}
          >
            <ChevronLeft />
          </button>
          <p
            className="font-display"
            style={{
              fontSize: '1.05rem',
              fontWeight: 300,
              color: 'var(--ink)',
              letterSpacing: '0.08em',
            }}
          >
            {MONTH_NAMES[calMonth]} {calYear}
          </p>
          <button
            onClick={goNext}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink-2)',
              padding: '0.4rem',
            }}
          >
            <ChevronRight />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
            marginBottom: '2px',
          }}
        >
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              style={{
                textAlign: 'center',
                fontSize: '0.58rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--ink-3)',
                padding: '0.3rem 0',
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        {slotsLoading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 0',
              fontSize: '0.72rem',
              color: 'var(--ink-2)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Loading availability...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {calendarCells.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} />;
              const dateStr = toDateStr(day);
              const isPast = dateStr < todayStr;
              const isAvail = availableDates.has(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={day}
                  onClick={() =>
                    !isPast && isAvail && (setSelectedDate(dateStr), setSelectedSlot(null))
                  }
                  disabled={isPast || !isAvail}
                  style={{
                    padding: '0.55rem 0.2rem',
                    textAlign: 'center',
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--accent)' : isToday ? 'var(--line)' : 'transparent'}`,
                    cursor: isPast || !isAvail ? 'default' : 'pointer',
                    color: isSelected
                      ? 'var(--bg)'
                      : isAvail && !isPast
                        ? 'var(--ink)'
                        : 'var(--ink-3)',
                    fontSize: '0.8rem',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isPast && isAvail && !isSelected) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = 'var(--accent)';
                      el.style.color = 'var(--accent)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isPast && isAvail && !isSelected) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = 'transparent';
                      el.style.color = 'var(--ink)';
                    }
                  }}
                >
                  {day}
                  {isAvail && !isPast && !isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '3px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '3px',
                        height: '3px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* No availability message */}
        {!slotsLoading && slots.length === 0 && (
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--ink-2)',
              textAlign: 'center',
              marginTop: '1.5rem',
            }}
          >
            No availability this month — try the next month.
          </p>
        )}

        {/* Time slots for selected date */}
        {selectedDate && (
          <div
            style={{
              marginTop: '2rem',
              borderTop: '1px solid var(--line-2)',
              paddingTop: '1.5rem',
            }}
          >
            <p
              style={{
                fontSize: '0.58rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--ink-3)',
                marginBottom: '1rem',
              }}
            >
              Available Times · {fmtDate(selectedDate)}
            </p>
            {dateSlots.length === 0 ? (
              <p style={{ color: 'var(--ink-2)', fontSize: '0.82rem' }}>
                No slots available for this date.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
                  gap: '0.5rem',
                }}
              >
                {dateSlots.map((slot) => (
                  <button
                    key={slot.start}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setStep('details');
                    }}
                    style={{
                      padding: '0.65rem 0.5rem',
                      border: '1px solid var(--line-2)',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--ink-2)',
                      fontSize: '0.78rem',
                      letterSpacing: '0.05em',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = 'var(--accent)';
                      el.style.color = 'var(--accent)';
                      el.style.background = 'var(--bg-card)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = 'var(--line-2)';
                      el.style.color = 'var(--ink-2)';
                      el.style.background = 'transparent';
                    }}
                  >
                    {fmtTime(slot.start)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── STEP: Details ─────────────────────────────────────────────────────────────
  if (step === 'details') {
    return (
      <div>
        {renderStepIndicator()}
        <BackButton onClick={() => setStep('schedule')} />

        {/* Booking summary card */}
        {selectedSlot && selectedArtist && (
          <div
            style={{
              padding: '1.1rem 1.4rem',
              border: '1px solid var(--line-2)',
              background: 'var(--bg-card)',
              marginBottom: '2rem',
            }}
          >
            <p
              style={{
                fontSize: '0.58rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: '0.6rem',
              }}
            >
              Your Booking
            </p>
            <p
              className="font-display"
              style={{ fontSize: '1rem', color: 'var(--ink)', marginBottom: '0.3rem' }}
            >
              {selectedArtist.name}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-2)', marginBottom: '0.2rem' }}>
              {fmtDate(selectedSlot.date)}&ensp;·&ensp;{fmtTime(selectedSlot.start)} –{' '}
              {fmtTime(selectedSlot.end)}
            </p>
            {selectedService && (
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>
                {selectedService.name}
                {selectedService.price != null && (
                  <span style={{ color: 'var(--accent)', marginLeft: '0.5rem' }}>
                    ${selectedService.price}
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        {conflictSlots && conflictSlots.length > 0 && (
          <div
            role="alert"
            style={{
              padding: '1.1rem 1.4rem',
              border: '1px solid var(--accent)',
              background: 'var(--bg-card)',
              marginBottom: '2rem',
            }}
          >
            <p
              style={{
                fontSize: '0.58rem',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: '0.6rem',
              }}
            >
              That slot was just taken
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--ink)', marginBottom: '0.9rem' }}>
              Pick a new time — we've kept your details.
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '0.9rem',
              }}
            >
              {conflictSlots.map((slot) => (
                <button
                  key={`${slot.date}-${slot.start}`}
                  type="button"
                  onClick={() => {
                    setSelectedSlot(slot);
                    setConflictSlots(null);
                    setSubmitError(null);
                  }}
                  style={{
                    padding: '0.55rem 0.9rem',
                    border: '1px solid var(--accent)',
                    background: 'transparent',
                    color: 'var(--accent)',
                    fontSize: '0.78rem',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                  }}
                >
                  {fmtDate(slot.date).split(',')[0]} · {fmtTime(slot.start)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setConflictSlots(null);
                setSubmitError(null);
                setStep('schedule');
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--ink-2)',
                fontSize: '0.72rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Show full calendar →
            </button>
          </div>
        )}

        <p
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: '0.5rem',
          }}
        >
          Step Final
        </p>
        <h3
          className="font-display"
          style={{ fontSize: '1.6rem', fontWeight: 300, color: 'var(--ink)', marginBottom: '2rem' }}
        >
          Your Details
        </h3>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {[
            {
              label: 'Full Name',
              key: 'name',
              type: 'text',
              value: name,
              setter: setName,
              required: true,
            },
            {
              label: 'Email Address',
              key: 'email',
              type: 'email',
              value: email,
              setter: setEmail,
              required: true,
            },
            {
              label: 'Phone Number',
              key: 'phone',
              type: 'tel',
              value: phone,
              setter: setPhone,
              required: false,
            },
          ].map(({ label, key, type, value, setter, required }) => (
            <div key={label}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.6rem',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-3)',
                  marginBottom: '0.5rem',
                }}
              >
                {label}
              </label>
              <input
                type={type}
                className="input-editorial"
                value={value}
                onChange={(e) => setter(e.target.value)}
                onBlur={() => {
                  let err = '';
                  if (key === 'email') err = validateEmail(value);
                  else if (key === 'phone') err = validatePhone(value);
                  setFieldErrors((prev) => ({ ...prev, [key]: err }));
                }}
                required={required}
                placeholder={label}
              />
              {fieldErrors[key] && (
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-error, oklch(65% 0.2 25))',
                    marginTop: '0.35rem',
                  }}
                >
                  {fieldErrors[key]}
                </p>
              )}
            </div>
          ))}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.6rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--ink-3)',
                marginBottom: '0.5rem',
              }}
            >
              Additional Notes
            </label>
            <textarea
              className="input-editorial"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any specific requests or questions..."
              style={{ resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            className="btn-accent"
            disabled={submitting}
            style={{ marginTop: '0.5rem' }}
          >
            {submitting ? 'Confirming...' : 'Confirm Booking'}
          </button>

          {submitError && (
            <p style={{ fontSize: '0.8rem', color: 'var(--color-error)' }}>{submitError}</p>
          )}
        </form>
      </div>
    );
  }

  // ── STEP: Success ─────────────────────────────────────────────────────────────
  return (
    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
      <div
        style={{
          width: '52px',
          height: '52px',
          border: '1px solid var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
        }}
      >
        <svg
          width="22"
          height="18"
          viewBox="0 0 22 18"
          fill="none"
          style={{ color: 'var(--accent)' }}
        >
          <path
            d="M1.5 9L8 15.5L20.5 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p
        style={{
          fontSize: '0.6rem',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: '0.75rem',
        }}
      >
        Booking Confirmed
      </p>
      <h3
        className="font-display"
        style={{ fontSize: '1.8rem', fontWeight: 300, color: 'var(--ink)', marginBottom: '1rem' }}
      >
        We'll be in touch soon
      </h3>
      <p
        style={{
          fontSize: '0.88rem',
          color: 'var(--ink-2)',
          lineHeight: 1.75,
          marginBottom: '2rem',
          maxWidth: '360px',
          margin: '0 auto 2rem',
        }}
      >
        Your booking request has been received.
        {selectedArtist ? ` ${selectedArtist.name} will confirm your appointment shortly.` : ''}
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {selectedArtist &&
          buildWhatsAppUrl(
            selectedArtist.whatsapp_number,
            defaultBookingMessage(selectedArtist.name, selectedService?.name),
          ) && (
            <a
              href={
                buildWhatsAppUrl(
                  selectedArtist.whatsapp_number,
                  defaultBookingMessage(selectedArtist.name, selectedService?.name),
                )!
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#25d366',
                border: '1px solid #25d366',
                padding: '0.5rem 1.25rem',
                textDecoration: 'none',
              }}
            >
              Follow up on WhatsApp
            </a>
          )}
        {onClose && (
          <button className="btn-accent" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingFlow;
