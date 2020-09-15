/**
 * External dependencies
 */
import moment from 'moment';
// react-dates doesn't tree-shake correctly, so we import from the individual
// component here, to avoid including too much of the library
import DayPickerSingleDateController from 'react-dates/lib/components/DayPickerSingleDateController';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Module Constants
 */
const TIMEZONELESS_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
const isRTL = () => document.documentElement.dir === 'rtl';

function DatePicker( { currentDate, isInvalidDate, onChange } ) {
	const nodeRef = useRef();

	/*
	 * Todo: We should remove this function ASAP.
	 * It is kept because focus is lost when we click on the previous and next month buttons.
	 * This focus loss closes the date picker popover.
	 * Ideally we should add an upstream commit on react-dates to fix this issue.
	 */
	function keepFocusInside() {
		if ( ! nodeRef.current ) {
			return;
		}
		// If focus was lost.
		if (
			! document.activeElement ||
			! nodeRef.current.contains( document.activeElement )
		) {
			// Retrieve the focus region div.
			const focusRegion = nodeRef.current.querySelector(
				'.DayPicker_focusRegion'
			);
			if ( ! focusRegion ) {
				return;
			}
			// Keep the focus on focus region.
			focusRegion.focus();
		}
	}

	function onChangeMoment( newDate ) {
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
	 * @return {?moment.Moment} Moment object for selected date or null.
	 */
	function getMomentDate() {
		if ( null === currentDate ) {
			return null;
		}
		return currentDate ? moment( currentDate ) : moment();
	}

	const momentDate = getMomentDate();

	return (
		<div className="components-datetime__date" ref={ nodeRef }>
			<DayPickerSingleDateController
				date={ momentDate }
				daySize={ 30 }
				focused
				hideKeyboardShortcutsPanel
				// This is a hack to force the calendar to update on month or year change
				// https://github.com/airbnb/react-dates/issues/240#issuecomment-361776665
				key={ `datepicker-controller-${
					momentDate ? momentDate.format( 'MM-YYYY' ) : 'null'
				}` }
				noBorder
				numberOfMonths={ 1 }
				onDateChange={ onChangeMoment }
				transitionDuration={ 0 }
				weekDayFormat="ddd"
				isRTL={ isRTL() }
				isOutsideRange={ ( date ) => {
					return isInvalidDate && isInvalidDate( date.toDate() );
				} }
				onPrevMonthClick={ keepFocusInside }
				onNextMonthClick={ keepFocusInside }
			/>
		</div>
	);
}

export default DatePicker;
