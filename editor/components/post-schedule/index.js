/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { settings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import { DateTimePicker } from '@wordpress/components';
import { getEditedPostAttribute } from '../../store/selectors';
import { editPost } from '../../store/actions';

export function PostSchedule( { date, onUpdateDate } ) {
	const handleChange = ( newDate ) => {
		onUpdateDate( newDate.format( 'YYYY-MM-DDTHH:mm:ss' ) );
	};

	return <DateTimePicker
		key="date-time-picker"
		currentDate={ date }
		onChange={ handleChange }
		locale={ settings.l10n.locale }
	/>;
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
