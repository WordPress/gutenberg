/**
 * External dependencies
 */
import moment from 'moment';
import ReactDatePicker from 'react-datepicker';

/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';

/**
 * Module Constants
 */
const TIMEZONELESS_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
const isRTL = () => document.documentElement.dir === 'rtl';

class DatePicker extends Component {
	constructor() {
		super( ...arguments );

		this.onChangeMoment = this.onChangeMoment.bind( this );
		this.nodeRef = createRef();
		this.keepFocusInside = this.keepFocusInside.bind( this );
		this.isDayHighlighted = this.isDayHighlighted.bind( this );
	}

	/*
	 * Todo: We should remove this function ASAP.
	 * It is kept because focus is lost when we click on the previous and next month buttons.
	 * This focus loss closes the date picker popover.
	 * Ideally we should add an upstream commit on react-dates to fix this issue.
	 */
	keepFocusInside( newMonthDate ) {
		// Trigger onMonthChange callback.
		if ( this.props.onMonthChange ) {
			this.props.onMonthChange( newMonthDate.toISOString() );
		}

		if ( ! this.nodeRef.current ) {
			return;
		}
		// If focus was lost.
		if (
			! document.activeElement ||
			! this.nodeRef.current.contains( document.activeElement )
		) {
			// Retrieve the focus region div.
			const focusRegion = this.nodeRef.current.querySelector(
				'.DayPicker_focusRegion'
			);
			if ( ! focusRegion ) {
				return;
			}
			// Keep the focus on focus region.
			focusRegion.focus();
		}
	}

	onChangeMoment( newDate ) {
		const { currentDate, onChange } = this.props;

		// If currentDate is null, use now as momentTime to designate hours, minutes, seconds.
		const momentDate = currentDate ? moment( currentDate ) : moment();
		const momentTime = {
			hours: momentDate.hours(),
			minutes: momentDate.minutes(),
			seconds: 0,
		};

		onChange( newDate.set( momentTime ).format( TIMEZONELESS_FORMAT ) );
	}

	/**
	 * Create a Moment object from a date string. With no currentDate supplied, default to a Moment
	 * object representing now. If a null value is passed, return a null value.
	 *
	 * @param {?string} currentDate Date representing the currently selected date or null to signify no selection.
	 * @return {?moment.Moment} Moment object for selected date or null.
	 */
	getMomentDate( currentDate ) {
		if ( null === currentDate ) {
			return null;
		}
		return currentDate ? moment( currentDate ) : moment();
	}

	isDayHighlighted( date ) {
		if ( this.props.onMonthPreviewed ) {
			this.props.onMonthPreviewed( date.toISOString() );
		}

		// Do not highlight when no events.
		if ( ! this.props.events?.length ) {
			return false;
		}

		// Compare date against highlighted events.
		return this.props.events.some( ( highlighted ) =>
			date.isSame( highlighted.date, 'day' )
		);
	}

	render() {
		const { currentDate, isInvalidDate, events } = this.props;
		return (
			<div className="components-datetime__date" ref={ this.nodeRef }>
				<ReactDatePicker
					selected={ currentDate }
					onChange={ console.log }
					inline
				/>
			</div>
		);
	}
}

export default DatePicker;

