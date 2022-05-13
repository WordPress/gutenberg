/**
 * External dependencies
 */
// Needed to initialise the default datepicker styles.
// See: https://github.com/airbnb/react-dates#initialize
import 'react-dates/initialize';
import { noop } from 'lodash';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { default as DatePicker } from './date';
import { default as TimePicker } from './time';
import type { DateTimePickerProps } from './types';

export { DatePicker, TimePicker };

function UnforwardedDateTimePicker(
	{
		currentDate,
		is12Hour,
		isInvalidDate,
		onMonthPreviewed = noop,
		onChange,
		events,
	}: DateTimePickerProps,
	ref: ForwardedRef< any >
) {
	return (
		<div ref={ ref } className="components-datetime">
			<TimePicker
				currentTime={ currentDate }
				onChange={ onChange }
				is12Hour={ is12Hour }
			/>
			<DatePicker
				currentDate={ currentDate }
				onChange={ onChange }
				isInvalidDate={ isInvalidDate }
				events={ events }
				onMonthPreviewed={ onMonthPreviewed }
			/>
		</div>
	);
}

/**
 * DateTimePicker is a React component that renders a calendar and clock for
 * date and time selection. The calendar and clock components can be accessed
 * individually using the `DatePicker` and `TimePicker` components respectively.
 *
 * @example
 * ```jsx
 * import { DateTimePicker } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyDateTimePicker = () => {
 *   const [ date, setDate ] = useState( new Date() );
 *
 *   return (
 *     <DateTimePicker
 *       currentDate={ date }
 *       onChange={ ( newDate ) => setDate( newDate ) }
 *       is12Hour={ true }
 *     />
 *   );
 * };
 * ```
 */
export const DateTimePicker = forwardRef( UnforwardedDateTimePicker );

export default DateTimePicker;
