/**
 * External dependencies
 */
// Needed to initialise the default datepicker styles.
// See: https://github.com/airbnb/react-dates#initialize
import 'react-dates/initialize';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { default as DatePicker } from './date';
import { default as TimePicker } from './time';

export { DatePicker, TimePicker };

function DateTimePicker(
	{
		currentDate,
		is12Hour,
		isInvalidDate,
		onMonthPreviewed = noop,
		onChange,
		events,
	},
	ref
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

export default forwardRef( DateTimePicker );
