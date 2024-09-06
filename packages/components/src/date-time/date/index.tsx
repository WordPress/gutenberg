/**
 * External dependencies
 */
import { useLilius } from 'use-lilius';
import { format, startOfDay, isSameMonth } from 'date-fns';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Calendar from './calendar';
import type { DatePickerProps } from '../types';
import { inputToDate } from '../utils';
import { TIMEZONELESS_FORMAT } from '../constants';

/**
 * DatePicker is a React component that renders a calendar for date selection.
 *
 * ```jsx
 * import { DatePicker } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyDatePicker = () => {
 *   const [ date, setDate ] = useState( new Date() );
 *
 *   return (
 *     <DatePicker
 *       currentDate={ date }
 *       onChange={ ( newDate ) => setDate( newDate ) }
 *     />
 *   );
 * };
 * ```
 */
export function DatePicker( {
	currentDate,
	onChange,
	events = [],
	isInvalidDate,
	onMonthPreviewed,
	startOfWeek: weekStartsOn = 0,
}: DatePickerProps ) {
	const date = currentDate ? inputToDate( currentDate ) : new Date();

	const {
		calendar,
		viewing,
		setSelected,
		setViewing,
		isSelected,
		viewPreviousMonth,
		viewNextMonth,
	} = useLilius( {
		selected: [ startOfDay( date ) ],
		viewing: startOfDay( date ),
		weekStartsOn,
	} );

	// Used to implement a roving tab index. Tracks the day that receives focus
	// when the user tabs into the calendar.
	const [ focusable, setFocusable ] = useState( startOfDay( date ) );

	// Update internal state when currentDate prop changes.
	const [ prevCurrentDate, setPrevCurrentDate ] = useState( currentDate );
	if ( currentDate !== prevCurrentDate ) {
		setPrevCurrentDate( currentDate );
		setSelected( [ startOfDay( date ) ] );
		setViewing( startOfDay( date ) );
		setFocusable( startOfDay( date ) );
	}

	return (
		<Calendar
			calendar={ calendar }
			events={ events }
			isInvalidDate={ isInvalidDate }
			isSelected={ isSelected }
			onMonthPreviewed={ onMonthPreviewed }
			setFocusable={ setFocusable }
			viewing={ viewing }
			viewPreviousMonth={ viewPreviousMonth }
			viewNextMonth={ viewNextMonth }
			onDayClick={ ( day ) => {
				setSelected( [ day ] );
				onChange?.(
					format(
						// Don't change the selected date's time fields.
						new Date(
							day.getFullYear(),
							day.getMonth(),
							day.getDate(),
							date.getHours(),
							date.getMinutes(),
							date.getSeconds(),
							date.getMilliseconds()
						),
						TIMEZONELESS_FORMAT
					)
				);
			} }
			onDayKeyDown={ ( nextFocusable ) => {
				if ( ! isSameMonth( nextFocusable, viewing ) ) {
					setViewing( nextFocusable );
					onMonthPreviewed?.(
						format( nextFocusable, TIMEZONELESS_FORMAT )
					);
				}
			} }
			focusable={ focusable }
		/>
	);
}

export default DatePicker;
