/**
 * WordPress dependencies
 */
import { useTranslate } from '@wordpress/react-i18n';
import { format, __experimentalGetSettings } from '@wordpress/date';
import { withSelect } from '@wordpress/data';

export function PostScheduleLabel( { date, isFloating } ) {
	const { __ } = useTranslate();

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
		date: select( 'core/editor' ).getEditedPostAttribute( 'date' ),
		isFloating: select( 'core/editor' ).isEditedPostDateFloating(),
	};
} )( PostScheduleLabel );
