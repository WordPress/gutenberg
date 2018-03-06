/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dateI18n, settings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import { getEditedPostAttribute } from '../../store/selectors';

function PostScheduleLabel( { date } ) {
	return date ?
		dateI18n( settings.formats.datetime, date ) :
		__( 'Immediately' );
}

export default connect(
	( state ) => {
		return {
			date: getEditedPostAttribute( state, 'date' ),
		};
	}
)( PostScheduleLabel );
