/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import ReactDatePicker from 'react-datepicker';
import moment from 'moment';

/**
 * Module Constants
 */
const TIMEZONELESS_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

function DatePicker( { currentDate, onChange, showTodayButton, ...args } ) {
	const momentDate = currentDate ? moment( currentDate ) : moment();
	const onChangeMoment = ( newDate ) => onChange( newDate.format( TIMEZONELESS_FORMAT ) );

	return <ReactDatePicker
		inline
		selected={ momentDate }
		onChange={ onChangeMoment }
		todayButton={ showTodayButton ? __( 'Today' ) : undefined }
		{ ...args }
	/>;
}

export default DatePicker;
