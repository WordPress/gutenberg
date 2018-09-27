/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dateI18n, getSettings } from '@wordpress/date';
import { withSelect } from '@wordpress/data';

export function PostScheduleLabel( { date, floating } ) {
	const settings = getSettings();
	return date && ! floating ?
		dateI18n( settings.formats.datetime, date ) :
		__( 'Immediately' );
}

export default withSelect( ( select ) => {
	return {
		date: select( 'core/editor' ).getEditedPostAttribute( 'date' ),
		floating: select( 'core/editor' ).isEditedPostDateFloating(),
	};
} )( PostScheduleLabel );
