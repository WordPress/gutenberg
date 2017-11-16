/**
 * External dependencies
 */
import { connect } from 'react-redux';
import DatePicker from 'react-datepicker';
import moment from 'moment';

/**
 * WordPress dependencies
 */
import { settings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import './style.scss';
import PostScheduleClock from './clock';
import { getEditedPostAttribute } from '../../state/selectors';
import { editPost } from '../../state/actions';

export function PostSchedule( { date, onUpdateDate } ) {
	const momentDate = date ? moment( date ) : moment();
	const handleChange = ( newDate ) => {
		onUpdateDate( newDate.format( 'YYYY-MM-DDTHH:mm:ss' ) );
	};

		// To know if the current timezone is a 12 hour time with look for "a" in the time format
		// We also make sure this a is not escaped by a "/"
	const is12HourTime = /a(?!\\)/i.test(
		settings.formats.time
			.toLowerCase() // Test only the lower case a
			.replace( /\\\\/g, '' ) // Replace "//" with empty strings
			.split( '' ).reverse().join( '' ) // Reverse the string and test for "a" not followed by a slash
	);

	return [
		<DatePicker
			key="date-picker"
			inline
			selected={ momentDate }
			onChange={ handleChange }
			locale={ settings.l10n.locale }
		/>,
		<PostScheduleClock
			key="clock"
			selected={ momentDate }
			onChange={ handleChange }
			is12Hour={ is12HourTime }
		/>,
	];
}

export default connect(
	( state ) => {
		return {
			date: getEditedPostAttribute( state, 'date' ),
		};
	},
	( dispatch ) => {
		return {
			onUpdateDate( date ) {
				dispatch( editPost( { date } ) );
			},
		};
	}
)( PostSchedule );
