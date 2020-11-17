/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { dateI18n, __experimentalGetSettings } from '@wordpress/date';

import { withSelect } from '@wordpress/data';

export function PostScheduleLabel( { date, isFloating } ) {
	if ( isFloating || ! date ) {
		return __( 'Immediately' );
	}

	const settings = __experimentalGetSettings();

	return dateI18n(
		`${ settings.formats.date } ${ settings.formats.time }`,
		date
	);
}

export default withSelect( ( select ) => {
	return {
		date: select( 'core/editor' ).getEditedPostAttribute( 'date' ),
		isFloating: select( 'core/editor' ).isEditedPostDateFloating(),
	};
} )( PostScheduleLabel );
