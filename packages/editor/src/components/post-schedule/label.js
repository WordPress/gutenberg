/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dateI18n, getSettings } from '@wordpress/date';
import { withSelect } from '@wordpress/data';

function PostScheduleLabel( { date, date_gmt } ) {
	const settings = getSettings();
	return ( null === date_gmt ) ?
		__( 'Immediately' ) :
		dateI18n( settings.formats.datetime, date );
}

export default withSelect( ( select ) => {
	return {
		date: select( 'core/editor' ).getEditedPostAttribute( 'date' ),
		date_gmt: select( 'core/editor' ).getEditedPostAttribute( 'date_gmt' ),
	};
} )( PostScheduleLabel );
