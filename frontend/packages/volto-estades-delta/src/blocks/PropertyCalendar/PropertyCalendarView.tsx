/**
 * PropertyCalendar — View component.
 *
 * Static availability calendar. Renders 1 or 2 months side-by-side starting
 * from the current month. Days carry one of three states:
 *   - past:        before today, non-interactive
 *   - unavailable: present in `unavailableDates` (block data OR content)
 *   - available:   anything else
 *
 * Mock-only in Fase 1: real data will be wired in Day 5+ via the Beds24
 * sync adapter writing into `content.unavailable_dates`.
 *
 * No external date lib — the grid is built from plain `Date`. Week starts
 * on Monday (Europe). Weekday short labels come from i18n so locale can
 * override.
 */
import React, { useMemo, useState, useCallback } from 'react';
import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';
import { propertyCalendarMessages as m } from '../../i18n/messages';
import './PropertyCalendar.scss';
import type { PropertyCalendarData } from './schema';

export interface PropertyCalendarContent {
  unavailable_dates?: string[];
}

interface PropertyCalendarViewProps {
  data: PropertyCalendarData;
  /** Passed by Volto when rendered inside a content view (e.g. PropertyView). */
  content?: PropertyCalendarContent;
}

const DEFAULT_MONTHS_TO_SHOW = 2;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function ymd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function firstDayOfMonth(year: number, month0: number): Date {
  return new Date(year, month0, 1);
}

/** Monday=0 ... Sunday=6 (Europe). */
function mondayWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

function monthLabel(year: number, month0: number, intl: IntlShape): string {
  const d = new Date(year, month0, 1);
  // Use Intl.DateTimeFormat via intl.formatDate to honour the active locale.
  return intl.formatDate(d, { month: 'long', year: 'numeric' });
}

interface DayCell {
  date: Date;
  iso: string;
  inMonth: boolean;
  past: boolean;
  unavailable: boolean;
}

function buildMonthCells(
  year: number,
  month0: number,
  today: Date,
  unavailableSet: Set<string>,
): DayCell[] {
  const cells: DayCell[] = [];
  const firstDay = firstDayOfMonth(year, month0);
  const offset = mondayWeekday(firstDay);
  // Pre-roll prev-month days so each row has 7 cells.
  for (let i = offset; i > 0; i -= 1) {
    const d = new Date(year, month0, 1 - i);
    cells.push({
      date: d,
      iso: ymd(d),
      inMonth: false,
      past: d < today,
      unavailable: unavailableSet.has(ymd(d)),
    });
  }
  const total = daysInMonth(year, month0);
  for (let day = 1; day <= total; day += 1) {
    const d = new Date(year, month0, day);
    cells.push({
      date: d,
      iso: ymd(d),
      inMonth: true,
      past: d < today,
      unavailable: unavailableSet.has(ymd(d)),
    });
  }
  // Trailing days so the grid is a full multiple of 7.
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last);
    d.setDate(d.getDate() + 1);
    cells.push({
      date: d,
      iso: ymd(d),
      inMonth: false,
      past: false,
      unavailable: unavailableSet.has(ymd(d)),
    });
  }
  return cells;
}

interface MonthGridProps {
  year: number;
  month0: number;
  today: Date;
  unavailableSet: Set<string>;
  weekdayLabels: string[];
  monthHeader: string;
}

const MonthGrid: React.FC<MonthGridProps> = ({
  year,
  month0,
  today,
  unavailableSet,
  weekdayLabels,
  monthHeader,
}) => {
  const cells = buildMonthCells(year, month0, today, unavailableSet);
  return (
    <div className="propertyCalendar__month">
      <div className="propertyCalendar__monthHeader">{monthHeader}</div>
      <div className="propertyCalendar__weekdays" role="row">
        {weekdayLabels.map((w) => (
          <div key={w} className="propertyCalendar__weekday" role="columnheader">
            {w}
          </div>
        ))}
      </div>
      <div className="propertyCalendar__grid" role="grid">
        {cells.map((cell, idx) => {
          const classes = ['propertyCalendar__day'];
          if (!cell.inMonth) classes.push('propertyCalendar__day--outOfMonth');
          if (cell.past) classes.push('propertyCalendar__day--past');
          if (cell.unavailable && !cell.past)
            classes.push('propertyCalendar__day--unavailable');
          if (cell.inMonth && !cell.past && !cell.unavailable)
            classes.push('propertyCalendar__day--available');
          return (
            <div
              key={`${cell.iso}-${idx}`}
              className={classes.join(' ')}
              role="gridcell"
              aria-label={cell.iso}
              data-date={cell.iso}
            >
              {cell.inMonth ? cell.date.getDate() : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PropertyCalendarView: React.FC<PropertyCalendarViewProps> = ({
  data,
  content,
}) => {
  const intl = useIntl();
  const monthsToShow = Math.min(
    Math.max(data.monthsToShow ?? DEFAULT_MONTHS_TO_SHOW, 1),
    2,
  );
  const today = useMemo(() => startOfDay(new Date()), []);
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    month0: today.getMonth(),
  }));

  const unavailableSet = useMemo(() => {
    const fromBlock = data.unavailableDates ?? [];
    const fromContent = content?.unavailable_dates ?? [];
    return new Set<string>([...fromBlock, ...fromContent]);
  }, [data.unavailableDates, content?.unavailable_dates]);

  const weekdayLabels = useMemo(
    () => [
      intl.formatMessage(m.weekdayShortMonday),
      intl.formatMessage(m.weekdayShortTuesday),
      intl.formatMessage(m.weekdayShortWednesday),
      intl.formatMessage(m.weekdayShortThursday),
      intl.formatMessage(m.weekdayShortFriday),
      intl.formatMessage(m.weekdayShortSaturday),
      intl.formatMessage(m.weekdayShortSunday),
    ],
    [intl],
  );

  const goPrev = useCallback(() => {
    setCursor((c) => {
      const month0 = c.month0 === 0 ? 11 : c.month0 - 1;
      const year = c.month0 === 0 ? c.year - 1 : c.year;
      return { year, month0 };
    });
  }, []);

  const goNext = useCallback(() => {
    setCursor((c) => {
      const month0 = c.month0 === 11 ? 0 : c.month0 + 1;
      const year = c.month0 === 11 ? c.year + 1 : c.year;
      return { year, month0 };
    });
  }, []);

  // Don't allow paging backwards before the current month.
  const prevDisabled =
    cursor.year < today.getFullYear() ||
    (cursor.year === today.getFullYear() && cursor.month0 <= today.getMonth());

  const months: { year: number; month0: number }[] = [];
  for (let i = 0; i < monthsToShow; i += 1) {
    const month0 = (cursor.month0 + i) % 12;
    const year = cursor.year + Math.floor((cursor.month0 + i) / 12);
    months.push({ year, month0 });
  }

  return (
    <div className="propertyCalendar">
      {data.heading ? (
        <h3 className="propertyCalendar__heading">{data.heading}</h3>
      ) : null}

      <div className="propertyCalendar__nav">
        <button
          type="button"
          className="propertyCalendar__navButton"
          onClick={goPrev}
          disabled={prevDisabled}
          aria-label={intl.formatMessage(m.prevMonth)}
        >
          ‹
        </button>
        <button
          type="button"
          className="propertyCalendar__navButton"
          onClick={goNext}
          aria-label={intl.formatMessage(m.nextMonth)}
        >
          ›
        </button>
      </div>

      <div className="propertyCalendar__months">
        {months.map(({ year, month0 }) => (
          <MonthGrid
            key={`${year}-${month0}`}
            year={year}
            month0={month0}
            today={today}
            unavailableSet={unavailableSet}
            weekdayLabels={weekdayLabels}
            monthHeader={monthLabel(year, month0, intl)}
          />
        ))}
      </div>

      <div className="propertyCalendar__legend">
        <span className="propertyCalendar__legendSwatch propertyCalendar__legendSwatch--available" />
        <FormattedMessage {...m.legendAvailable} />
        <span className="propertyCalendar__legendSwatch propertyCalendar__legendSwatch--unavailable" />
        <FormattedMessage {...m.legendUnavailable} />
        <span className="propertyCalendar__legendSwatch propertyCalendar__legendSwatch--past" />
        <FormattedMessage {...m.legendPast} />
      </div>
    </div>
  );
};

export default PropertyCalendarView;
