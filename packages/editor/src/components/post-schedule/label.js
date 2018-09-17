/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dateI18n, getSettings } from '@wordpress/date';
import { withSelect } from '@wordpress/data';

// Unlike in the PHP backend, in the REST API response draft posts for which a
// date has not yet been set return a full gmt date string instead of the empty
// 0000-00-00 00:00:00 placeholder used in the database. To infer that a post
// is set to publish "immediately" we check whether the date and modified date
// are matching values.
function isFloatingDate( { date, modified, status } ) {
	if ( status === 'draft' || status === 'auto-draft' ) {
		return date === modified;
	}
	return false;
}

export function PostScheduleLabel( props ) {
	const { date } = props;
	const floating = isFloatingDate( props );
	const settings = getSettings();
	return date && ! floating ?
		dateI18n( settings.formats.datetime, date ) :
		__( 'Immediately' );
}

export default withSelect( ( select ) => {
	return {
		date: select( 'core/editor' ).getEditedPostAttribute( 'date' ),
		modified: select( 'core/editor' ).getEditedPostAttribute( 'modified' ),
		status: select( 'core/editor' ).getEditedPostAttribute( 'status' ),
	};
} )( PostScheduleLabel );
