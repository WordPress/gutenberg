/**
 * External dependencies
 */
import ReactDatePicker from 'react-datepicker';
import moment from 'moment';

export function DatePicker( { currentDate, onChange, ...args } ) {
	const momentDate = currentDate ? moment( currentDate ) : moment();

	return <ReactDatePicker
		inline
		selected={ momentDate }
		onChange={ onChange }
		{ ...args }
	/>;
}
