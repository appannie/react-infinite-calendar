import React, { forwardRef } from 'react';
import { compose, withProps, withPropsOnChange, withState } from 'recompose';
import classNames from 'classnames';
import { withDefaultProps } from './';
import { withImmutableProps } from '../utils';
import enhanceHeader from '../Header/withRange';
import { isBefore, format, parse, startOfWeek, endOfWeek } from 'date-fns';
import styles from '../Day/Day.scss';

let isTouchDevice = false;

export const EVENT_TYPE = {
  END: 3,
  HOVER: 2,
  START: 1,
};

// Enhance Day component to display selected state based on an array of selected dates
export const enhanceDay = withPropsOnChange(
  ['selected'],
  ({ date, selected, theme, isWeeklySelection }) => {
    let { start, end } = selected;
    if (isWeeklySelection) {
      start = format(startOfWeek(start), 'YYYY-MM-DD');
      end = format(endOfWeek(end), 'YYYY-MM-DD');
    }
    let isSelected = date >= start && date <= end;
    let isStart = date === start;
    const isEnd = date === end;
    const isRange = !(isStart && isEnd);
    const style =
      isRange &&
      ((isStart && { backgroundColor: theme.accentColor }) ||
        (isEnd && { backgroundColor: theme.accentColor }));

    return {
      className:
        isSelected &&
        isRange &&
        classNames(styles.range, {
          [styles.start]: isStart,
          [styles.betweenRange]: !isStart && !isEnd,
          [styles.end]: isEnd,
        }),
      isSelected,
      selectionStyle: style,
    };
  }
);

// Enhancer to handle selecting and displaying multiple dates
export const withRange = (Calendar) => {
  const CalendarWithRef = ({ forwardedRef, ...props }) => (
    <Calendar {...props} innerRef={forwardedRef} />
  );

  const EnhancedCalendar = compose(
    withDefaultProps,
    withState('scrollDate', 'setScrollDate', getInitialDate),
    withState('displayKey', 'setDisplayKey', getInitialDate),
    withState('selectionStart', 'setSelectionStart', null),
    withState('hoveredDate', 'setHoveredDate'),
    withImmutableProps(({ DayComponent, HeaderComponent }) => ({
      DayComponent: enhanceDay(DayComponent),
      HeaderComponent: enhanceHeader(HeaderComponent),
    })),
    withProps(
      ({
        displayKey,
        passThrough,
        selected,
        setDisplayKey,
        hoveredDate,
        setHoveredDate,
        forwardedRef,
        ...props
      }) => ({
        /* eslint-disable sort-keys */
        passThrough: {
          ...passThrough,
          Day: {
            hoveredDate: hoveredDate,
            isWeeklySelection: Boolean(props.isWeeklySelection),
            onClick: (date) => handleSelect(date, { selected, ...props }),
            onMouseEnter: setHoveredDate,
            onMouseLeave: () => setHoveredDate(undefined),
            handlers: {
              onMouseOver:
                !isTouchDevice && props.selectionStart
                  ? (e) => handleMouseOver(e, { selected, ...props })
                  : null,
            },
          },
          Years: {
            selected: selected && selected[displayKey],
            onSelect: (date) =>
              handleYearSelect(date, { displayKey, selected, ...props }),
          },
          Header: {
            isWeeklySelection: Boolean(props.isWeeklySelection),
            onYearClick: (date, e, key) => setDisplayKey(key || 'start'),
          },
        },
        selected: {
          start: selected && format(selected.start, 'YYYY-MM-DD'),
          end: selected && format(selected.end, 'YYYY-MM-DD'),
        },
        forwardedRef,
      })
    )
  )(CalendarWithRef);

  return forwardRef((props, ref) => (
    <EnhancedCalendar {...props} forwardedRef={ref} />
  ));
};

function getSortedSelection({ start, end }) {
  return isBefore(start, end) ? { start, end } : { start: end, end: start };
}

function handleSelect(
  date,
  { onSelect, selectionStart, setSelectionStart, isWeeklySelection }
) {
  if (selectionStart) {
    let { start, end } = getSortedSelection({
      start: selectionStart,
      end: date,
    });

    if (isWeeklySelection) {
      start = startOfWeek(start);
      end = endOfWeek(end);
    }

    onSelect({
      eventType: EVENT_TYPE.END,
      start,
      end,
    });
    setSelectionStart(null);
  } else {
    if (isWeeklySelection) {
      onSelect({
        eventType: EVENT_TYPE.START,
        start: startOfWeek(date),
        end: endOfWeek(date),
      });
      setSelectionStart(startOfWeek(date));
    } else {
      onSelect({ eventType: EVENT_TYPE.START, start: date, end: date });
      setSelectionStart(date);
    }
  }
}

function handleMouseOver(e, { onSelect, selectionStart }) {
  const dateStr = e.target.getAttribute('data-date');
  const date = dateStr && parse(dateStr);

  if (!date) {
    return;
  }

  onSelect({
    eventType: EVENT_TYPE.HOVER,
    ...getSortedSelection({
      start: selectionStart,
      end: date,
    }),
  });
}

function handleYearSelect(
  date,
  { displayKey, onSelect, selected, setScrollDate }
) {
  setScrollDate(date);
  onSelect(
    getSortedSelection(
      Object.assign({}, selected, { [displayKey]: parse(date) })
    )
  );
}

function getInitialDate({ selected }) {
  return (selected && selected.start) || new Date();
}

if (typeof window !== 'undefined') {
  window.addEventListener('touchstart', function onTouch() {
    isTouchDevice = true;

    window.removeEventListener('touchstart', onTouch, false);
  });
}
