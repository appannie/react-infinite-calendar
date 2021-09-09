import React, { Component } from 'react';
import PropTypes from 'prop-types';
import VirtualList from 'react-tiny-virtual-list';
import classNames from 'classnames';
import { animate, emptyFn, getMonth, getWeek, getWeeksInMonth } from '../utils';
import { addMonths, isSameMonth, parse, startOfMonth } from 'date-fns';
import Month from '../Month';
import styles from './MonthList.scss';

const AVERAGE_ROWS_PER_MONTH = 5;

export default class MonthList extends Component {
  static propTypes = {
    disabledDates: PropTypes.arrayOf(PropTypes.string),
    disabledDays: PropTypes.arrayOf(PropTypes.number),
    height: PropTypes.number,
    isScrolling: PropTypes.bool,
    locale: PropTypes.object,
    maxDate: PropTypes.instanceOf(Date),
    min: PropTypes.instanceOf(Date),
    minDate: PropTypes.instanceOf(Date),
    months: PropTypes.arrayOf(PropTypes.object),
    onDaySelect: PropTypes.func,
    onScroll: PropTypes.func,
    overscanMonthCount: PropTypes.number,
    rowHeight: PropTypes.number,
    selected: PropTypes.oneOfType([
      PropTypes.instanceOf(Date),
      PropTypes.object,
    ]),
    showOverlay: PropTypes.bool,
    theme: PropTypes.object,
    today: PropTypes.instanceOf(Date),
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  };
  state = {
    scrollOffset: this.getDateOffset(this.props.scrollDate),
  };
  cache = {};
  memoize = function (param) {
    if (!this.cache[param]) {
      const {
        locale: { weekStartsOn },
      } = this.props;
      const [year, month] = param.split(':');
      this.cache[param] = getMonth(year, month, weekStartsOn);
    }
    return this.cache[param];
  };
  monthHeights = [];
  scrollTop = 0;
  currentMonth;

  _getRef = (instance) => {
    this.VirtualList = instance;
  };

  getMonthHeight = (index) => {
    if (!this.monthHeights[index]) {
      let {
        locale: { weekStartsOn },
        months,
        rowHeight,
      } = this.props;
      let { month, year } = months[index];
      let weeks = getWeeksInMonth(
        month,
        year,
        weekStartsOn,
        index === months.length - 1
      );
      this.monthHeights[index] = weeks * rowHeight;
    }

    return this.monthHeights[index];
  };

  // When reaching the top the real overscan count is actually
  // smaller than the given size
  getTopOverscanCount = () => {
    let height = 0;
    let index = 0;

    while (this.scrollTop > height) {
      height += this.getMonthHeight(index);
      index++;
    }
    return index < 1 ? 0 : index - 1;
  };

  onMonthsRendered = ({ startIndex }) => {
    const { months, min, overscanMonthCount } = this.props;
    const { month, year } = months[startIndex];
    const startMonth = new Date(year, month, 1);
    let topOverscanCount = overscanMonthCount;

    // Handler edge case when reach the top
    if (isSameMonth(startMonth, min)) {
      topOverscanCount = this.getTopOverscanCount();
    }

    this.currentMonth = addMonths(startMonth, topOverscanCount);
  };

  onScroll = (scrollTop, event) => {
    this.scrollTop = scrollTop;
    this.props.onScroll(scrollTop, event);
  };

  componentDidMount() {
    this.scrollEl = this.VirtualList.rootNode;
  }

  UNSAFE_componentWillReceiveProps({ scrollDate }) {
    if (scrollDate !== this.props.scrollDate) {
      this.setState({
        scrollTop: this.getDateOffset(scrollDate),
      });
    }
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.initialScrollDate != null &&
      this.props.initialScrollDate !== prevProps.initialScrollDate
    ) {
      this.setState({
        scrollTop: this.getDateOffset(this.props.initialScrollDate),
      });
    }
  }

  getDateOffset(date) {
    const {
      min,
      rowHeight,
      locale: { weekStartsOn },
      height,
    } = this.props;
    const weeks = getWeek(startOfMonth(min), parse(date), weekStartsOn);

    return weeks * rowHeight - (height - rowHeight / 2) / 2;
  }

  scrollToDate = (date, offset = 0, ...rest) => {
    let offsetTop = this.getDateOffset(date);
    this.scrollTo(offsetTop + offset, ...rest);
  };

  scrollTo = (scrollTop = 0, shouldAnimate = false, onScrollEnd = emptyFn) => {
    const onComplete = () =>
      setTimeout(() => {
        this.scrollEl.style.overflowY = 'auto';
        onScrollEnd();
      });

    // Interrupt iOS Momentum scroll
    this.scrollEl.style.overflowY = 'hidden';

    if (shouldAnimate) {
      /* eslint-disable sort-keys */
      animate({
        fromValue: this.scrollEl.scrollTop,
        toValue: scrollTop,
        onUpdate: (scrollTop, callback) =>
          this.setState({ scrollTop }, callback),
        onComplete,
      });
    } else {
      window.requestAnimationFrame(() => {
        this.scrollEl.scrollTop = scrollTop;
        onComplete();
      });
    }
  };

  renderMonth = ({ index, style }) => {
    let {
      DayComponent,
      disabledDates,
      disabledDays,
      locale,
      maxDate,
      minDate,
      months,
      passThrough,
      rowHeight,
      selected,
      showOverlay,
      theme,
      today,
    } = this.props;

    let { month, year } = months[index];
    let key = `${year}:${month}`;
    let { date, rows } = this.memoize(key);

    return (
      <Month
        key={key}
        selected={selected}
        DayComponent={DayComponent}
        monthDate={date}
        disabledDates={disabledDates}
        disabledDays={disabledDays}
        maxDate={maxDate}
        minDate={minDate}
        rows={rows}
        rowHeight={rowHeight}
        isScrolling={false}
        showOverlay={showOverlay}
        today={today}
        theme={theme}
        style={style}
        locale={locale}
        passThrough={passThrough}
        {...passThrough.Month}
      />
    );
  };

  render() {
    let { height, isScrolling, overscanMonthCount, months, rowHeight, width } =
      this.props;

    const { scrollOffset } = this.state;

    return (
      <VirtualList
        ref={this._getRef}
        width={width}
        height={height}
        itemCount={months.length}
        itemSize={this.getMonthHeight}
        estimatedItemSize={rowHeight * AVERAGE_ROWS_PER_MONTH}
        renderItem={this.renderMonth}
        onScroll={this.onScroll}
        scrollOffset={scrollOffset}
        className={classNames(styles.root, { [styles.scrolling]: isScrolling })}
        style={{ lineHeight: `${rowHeight}px` }}
        overscanCount={overscanMonthCount}
        onItemsRendered={this.onMonthsRendered}
      />
    );
  }
}
