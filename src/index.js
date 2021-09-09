import React, { Component } from 'react';
import Calendar from './Calendar';
import { withDateSelection } from './Calendar/withDateSelection';

export { default as Calendar } from './Calendar';
export { withDateSelection } from './Calendar/withDateSelection';
export { withKeyboardSupport } from './Calendar/withKeyboardSupport';
export {
  withMultipleDates,
  defaultMultipleDateInterpolation,
} from './Calendar/withMultipleDates';
export { withRange } from './Calendar/withRange';
export { EVENT_TYPE } from './Calendar/Range';
export { withMonthRange } from './Calendar/withMonthRange';
/*
 * By default, Calendar is a controlled component.
 * Export a sensible default for minimal setup
 */
export default class DefaultCalendar extends Component {
  static defaultProps = {
    Component: withDateSelection(Calendar),
    interpolateSelection: (selected) => selected,
  };
  state = {
    selected:
      typeof this.props.selected !== 'undefined'
        ? this.props.selected
        : new Date(),
  };
  _getRef = (ref) => {
    this.calendar = ref;
  };
  UNSAFE_componentWillReceiveProps({ selected }) {
    if (selected !== this.props.selected) {
      this.setState({ selected });
    }
  }
  handleSelect = (selected) => {
    const { onSelect, interpolateSelection } = this.props;

    if (typeof onSelect === 'function') {
      onSelect(selected);
    }

    this.setState({
      selected: interpolateSelection(selected, this.state.selected),
    });
  };
  scrollToDate = (date) => {
    this.calendar && this.calendar.scrollToDate(date, -40);
  };
  render() {
    // eslint-disable-next-line no-unused-vars
    const { Component, interpolateSelection, ...props } = this.props;

    return (
      <Component
        {...props}
        innerRef={this._getRef}
        onSelect={this.handleSelect}
        selected={this.state.selected}
      />
    );
  }
}
