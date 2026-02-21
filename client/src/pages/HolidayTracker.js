import React, { useState, useEffect, useCallback } from 'react';
import { getHolidays } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import T from '../context/translations';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HolidayTracker = () => {
    const { lang } = useLanguage();
    const t = T[lang];
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [hoveredDate, setHoveredDate] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [holidays, setHolidays] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [source, setSource] = useState('');

    const fetchHolidays = useCallback(async (year) => {
        setLoading(true);
        setError('');
        try {
            const res = await getHolidays(year);
            setHolidays(res.data.holidays || {});
            setSource(res.data.source || 'static');
        } catch (err) {
            setError('Failed to load holidays. Showing default Indian court holidays.');
            // Fallback static data
            setHolidays({
                [`${year}-01-01`]: "New Year's Day",
                [`${year}-01-26`]: 'Republic Day',
                [`${year}-04-14`]: 'Dr. Ambedkar Jayanti',
                [`${year}-08-15`]: 'Independence Day',
                [`${year}-10-02`]: 'Gandhi Jayanti',
                [`${year}-12-25`]: 'Christmas Day',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchHolidays(currentYear); }, [currentYear, fetchHolidays]);

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const formatDateKey = (year, month, day) => {
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    };

    const prevMonth = () => {
        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
        else setCurrentMonth(m => m - 1);
    };

    const nextMonth = () => {
        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
        else setCurrentMonth(m => m + 1);
    };

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    // Upcoming holidays from today
    const upcomingHolidays = Object.entries(holidays)
        .filter(([date]) => date >= todayKey)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(0, 5);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>{t.holiday_title}</h1>
                <p>
                    {t.holiday_subtitle}
                    {source === 'google' && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--gray-400)' }}>• via Google Calendar</span>}
                    {source === 'static' && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--gray-400)' }}>• Indian national holidays</span>}
                </p>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
                {/* Calendar */}
                <div className="card card-elevated">
                    {/* Month navigation */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <button id="prev-month" className="btn btn-ghost btn-sm" onClick={prevMonth}>← Prev</button>
                        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: '700' }}>
                            {MONTHS[currentMonth]} {currentYear}
                        </h2>
                        <button id="next-month" className="btn btn-ghost btn-sm" onClick={nextMonth}>Next →</button>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                            <div className="spinner spinner-lg"></div>
                        </div>
                    ) : (
                        <>
                            {/* Day headers */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '0.5rem' }}>
                                {DAYS.map(d => (
                                    <div key={d} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: '700', color: 'var(--gray-400)', padding: '0.5rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}

                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                    const day = i + 1;
                                    const dateKey = formatDateKey(currentYear, currentMonth, day);
                                    const isHoliday = !!holidays[dateKey];
                                    const isToday = dateKey === todayKey;
                                    const isSelected = selectedDate === dateKey;
                                    const isWeekend = new Date(currentYear, currentMonth, day).getDay() === 0 || new Date(currentYear, currentMonth, day).getDay() === 6;
                                    const isHovered = hoveredDate === dateKey;

                                    return (
                                        <div
                                            key={day}
                                            id={`day-${dateKey}`}
                                            onMouseEnter={() => setHoveredDate(dateKey)}
                                            onMouseLeave={() => setHoveredDate(null)}
                                            onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                                            style={{
                                                position: 'relative', aspectRatio: '1', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', borderRadius: 'var(--radius-sm)',
                                                cursor: isHoliday ? 'pointer' : 'default',
                                                background: isSelected ? 'var(--black)' : isHoliday ? (isHovered ? 'var(--gray-800)' : 'var(--gray-900)') : isToday ? 'var(--gray-100)' : 'transparent',
                                                color: isSelected || isHoliday ? 'var(--white)' : isWeekend ? 'var(--gray-400)' : 'var(--black)',
                                                fontWeight: isToday ? '700' : isHoliday ? '700' : '400',
                                                fontSize: '0.875rem', transition: 'all 0.15s ease',
                                                border: isToday && !isHoliday ? '2px solid var(--black)' : '2px solid transparent',
                                            }}
                                        >
                                            {day}
                                            {isHoliday && (
                                                <div style={{ position: 'absolute', bottom: '3px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--white)', opacity: 0.7 }} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)', fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--black)' }} />
                                    Court Holiday
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', border: '2px solid var(--black)' }} />
                                    Today
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Side panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Selected/Hovered date info */}
                    {(selectedDate || hoveredDate) && holidays[selectedDate || hoveredDate] && (
                        <div className="card animate-slide-up" style={{ background: 'var(--black)', color: 'var(--white)', border: 'none' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6, marginBottom: '0.5rem' }}>
                                🎉 Court Holiday
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                                {holidays[selectedDate || hoveredDate]}
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                {new Date(selectedDate || hoveredDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                        </div>
                    )}

                    {/* Upcoming holidays */}
                    <div className="card card-elevated">
                        <h3 style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gray-500)', marginBottom: '1rem' }}>
                            Upcoming Holidays
                        </h3>
                        {loading ? (
                            <div className="spinner"></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {upcomingHolidays.length > 0 ? upcomingHolidays.map(([date, name]) => (
                                    <div key={date} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <div style={{ background: 'var(--black)', color: 'var(--white)', borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.5rem', textAlign: 'center', minWidth: '44px', flexShrink: 0 }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', opacity: 0.7 }}>
                                                {MONTHS[parseInt(date.split('-')[1]) - 1].slice(0, 3)}
                                            </div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '800', lineHeight: 1 }}>{parseInt(date.split('-')[2])}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{name}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>{date}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>No upcoming holidays this year.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Year selector */}
                    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem' }}>
                        <button id="prev-year" className="btn btn-ghost btn-sm" onClick={() => setCurrentYear(y => y - 1)}>← {currentYear - 1}</button>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-serif)' }}>{currentYear}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)' }}>{Object.keys(holidays).length} holidays</div>
                        </div>
                        <button id="next-year" className="btn btn-ghost btn-sm" onClick={() => setCurrentYear(y => y + 1)}>{currentYear + 1} →</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HolidayTracker;
