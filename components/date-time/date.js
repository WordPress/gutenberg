/**
 * External dependencies
 */
import { default as ReactDatePicker } from 'react-datepicker';
import moment from 'moment';

/**
 * WordPress dependencies
 */
import { settings } from '@wordpress/date';

export function DatePicker( { currentDate, onChange, locale = settings.l10n.locale, ...args } ) {
	const momentDate = currentDate ? moment( currentDate ) : moment();

	return <ReactDatePicker
		inline
		selected={ momentDate }
		onChange={ onChange }
		locale={ locale }
		{ ...args }
	/>;
}
