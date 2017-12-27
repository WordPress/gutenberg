/**
 * Internal dependencies
 */
import './style.scss';
import { DatePicker } from './date';
import { TimePicker } from './time';

export { DatePicker } from './date';
export { TimePicker } from './time';

export function DateTimePicker( { currentDate, onChange, locale, ...args } ) {

	return [
		<DatePicker
			key="date-picker"
			currentDate={ currentDate }
			onChange={ onChange }
			locale={ locale }
			{ ...args }
		/>,
		<TimePicker
			key="time-picker"
			currentTime={ currentDate }
			onChange={ onChange }
		/>
	];

}
