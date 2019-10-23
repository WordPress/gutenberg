/**
 * External dependencies
 */
import moment from 'moment';
import { DayPickerSingleDateController } from 'react-dates';

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
	}

	/*
	* Todo: We should remove this function ASAP.
	* It is kept because focus is lost when we click on the previous and next month buttons.
	* This focus loss closes the date picker popover.
	* Ideally we should add an upstream commit on react-dates to fix this issue.
	*/
	keepFocusInside() {
		if ( ! this.nodeRef.current ) {
			return;
		}
		// If focus was lost.
		if ( ! document.activeElement || ! this.nodeRef.current.contains( document.activeElement ) ) {
			// Retrieve the focus region div.
			const focusRegion = this.nodeRef.current.querySelector( '.DayPicker_focusRegion' );
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

	render() {
		const { currentDate, isInvalidDate } = this.props;

		const momentDate = this.getMomentDate( currentDate );

		return (
			<div
				className="components-datetime__date"
				ref={ this.nodeRef }
			>
				<DayPickerSingleDateController
					date={ momentDate }
					daySize={ 30 }
					focused
					hideKeyboardShortcutsPanel
					// This is a hack to force the calendar to update on month or year change
					// https://github.com/airbnb/react-dates/issues/240#issuecomment-361776665
					key={ `datepicker-controller-${ momentDate ? momentDate.format( 'MM-YYYY' ) : 'null' }` }
					noBorder
					numberOfMonths={ 1 }
					onDateChange={ this.onChangeMoment }
					transitionDuration={ 0 }
					weekDayFormat="ddd"
					isRTL={ isRTL() }
					isOutsideRange={ ( date ) => {
						return isInvalidDate && isInvalidDate( date.toDate() );
					} }
					onPrevMonthClick={ this.keepFocusInside }
					onNextMonthClick={ this.keepFocusInside }
				/>
			</div>
		);
	}
}

export default DatePicker;
