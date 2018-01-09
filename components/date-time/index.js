/**
 * Internal dependencies
 */
import './style.scss';
import { default as DatePicker } from './date';
import { default as TimePicker } from './time';

export { DatePicker, TimePicker };

export function DateTimePicker( { currentDate, onChange, is12Hour, format, ...args } ) {
	return [
		<DatePicker
			key="date-picker"
			currentDate={ currentDate }
			onChange={ onChange }
			format={ format }
			{ ...args }
		/>,
		<TimePicker
			key="time-picker"
			currentTime={ currentDate }
			onChange={ onChange }
			is12Hour={ is12Hour }
			format={ format }
		/>,
	];
}
