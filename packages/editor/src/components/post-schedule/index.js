/**
 * WordPress dependencies
 */
import { __experimentalGetSettings } from '@wordpress/date';
import { useSelect, useDispatch } from '@wordpress/data';
import { DateTimePicker, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export function Warning() {
	const date = useSelect( ( select ) =>
		select( 'core/editor' ).getEditedPostAttribute( 'date' )
	);

	if ( Date.parse( date ) >= Date.now() ) {
		return null;
	}

	return (
		<Notice
			status="warning"
			isDismissible={ false }
			className="edit-post-post-schedule-warning"
		>
			{ __( 'Your post will be backdated.' ) }
		</Notice>
	);
}

export function PostSchedule() {
	const date = useSelect( ( select ) =>
		select( 'core/editor' ).getEditedPostAttribute( 'date' )
	);
	const { editPost } = useDispatch( 'core/editor' );
	const onChange = ( newDate ) => {
		editPost( { date: newDate } );
		document.activeElement.blur();
	};
	const settings = __experimentalGetSettings();
	// To know if the current timezone is a 12 hour time with look for "a" in the time format
	// We also make sure this a is not escaped by a "/"
	const is12HourTime = /a(?!\\)/i.test(
		settings.formats.time
			.toLowerCase() // Test only the lower case a
			.replace( /\\\\/g, '' ) // Replace "//" with empty strings
			.split( '' )
			.reverse()
			.join( '' ) // Reverse the string and test for "a" not followed by a slash
	);

	return (
		<DateTimePicker
			key="date-time-picker"
			currentDate={ date }
			onChange={ onChange }
			is12Hour={ is12HourTime }
		/>
	);
}

PostSchedule.Warning = Warning;

export default PostSchedule;
