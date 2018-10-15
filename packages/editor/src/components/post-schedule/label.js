/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dateI18n, getSettings } from '@wordpress/date';
import { withSelect } from '@wordpress/data';

export function PostScheduleLabel( { date, isFloating } ) {
	const settings = getSettings();

	return date && ! isFloating ?
		dateI18n( settings.formats.datetimeAbbreviated, date ) :
		__( 'Immediately' );
}

export default withSelect( ( select ) => {
	return {
		date: select( 'core/editor' ).getEditedPostAttribute( 'date' ),
		isFloating: select( 'core/editor' ).isEditedPostDateFloating(),
	};
} )( PostScheduleLabel );
