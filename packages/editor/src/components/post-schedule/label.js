/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dateI18n, getSettings, moment } from '@wordpress/date';
import { withSelect } from '@wordpress/data';

function PostScheduleLabel( { date } ) {
	const settings = getSettings();

	// If the publishing datetime is after the current datetime, show the date
	// the post is scheduled to go public.
	// Otherwise we just display "Immediately".
	return date && moment().isBefore( date ) ?
		dateI18n( settings.formats.datetimeAbbreviated, date ) :
		__( 'Immediately' );
}

export default withSelect( ( select ) => {
	return {
		date: select( 'core/editor' ).getEditedPostAttribute( 'date' ),
	};
} )( PostScheduleLabel );
