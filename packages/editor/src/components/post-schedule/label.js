/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dateI18n, getSettings } from '@wordpress/date';
import { withSelect } from '@wordpress/data';

function PostScheduleLabel( { date, dateFloating } ) {
	const settings = getSettings();
	return ( dateFloating ) ?
		__( 'Immediately' ) :
		dateI18n( settings.formats.datetime, date );
}

export default withSelect( ( select ) => {
	return {
		date: select( 'core/editor' ).getEditedPostAttribute( 'date' ),
		dateFloating: select( 'core/editor' ).getEditedPostAttribute( 'date_floating' ),
	};
} )( PostScheduleLabel );
