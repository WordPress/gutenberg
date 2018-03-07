/**
 * External dependencies
 */
import ReactDatePicker from 'react-datepicker';
import { wpmoment } from '@wordpress/date';

/**
 * Module Constants
 */
const TIMEZONELESS_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

function DatePicker( { currentDate, onChange, ...args } ) {
	const momentDate = currentDate ? wpmoment( currentDate ) : wpmoment();
	const onChangeMoment = ( newDate ) => onChange( newDate.format( TIMEZONELESS_FORMAT ) );

	return <ReactDatePicker
		inline
		selected={ momentDate }
		onChange={ onChangeMoment }
		{ ...args }
	/>;
}

export default DatePicker;
