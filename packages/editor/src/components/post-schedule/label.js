/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { format, __experimentalGetSettings } from '@wordpress/date';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export function PostScheduleLabel( { date, isFloating } ) {
	const settings = __experimentalGetSettings();
	return date && ! isFloating
		? format(
				`${ settings.formats.date } ${ settings.formats.time }`,
				date
		  )
		: __( 'Immediately' );
}

export default withSelect( ( select ) => {
	return {
		date: select( editorStore ).getEditedPostAttribute( 'date' ),
		isFloating: select( editorStore ).isEditedPostDateFloating(),
	};
} )( PostScheduleLabel );
