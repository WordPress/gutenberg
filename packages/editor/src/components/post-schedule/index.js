/**
 * External dependencies
 */
import { parseISO, endOfMonth, startOfMonth } from 'date-fns';

/**
 * WordPress dependencies
 */
import { getSettings } from '@wordpress/date';
import { _x } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useState, useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { PrivatePublishDateTimePicker } = unlock( blockEditorPrivateApis );

/**
 * Renders the PostSchedule component. It allows the user to schedule a post.
 *
 * @param {Object}   props         Props.
 * @param {Function} props.onClose Function to close the component.
 *
 * @return {Component} The component to be rendered.
 */
export default function PostSchedule( props ) {
	return (
		<PrivatePostSchedule
			{ ...props }
			showPopoverHeaderActions
			isCompact={ false }
		/>
	);
}

export function PrivatePostSchedule( {
	onClose,
	showPopoverHeaderActions,
	isCompact,
} ) {
	const { postDate, postType } = useSelect(
		( select ) => ( {
			postDate: select( editorStore ).getEditedPostAttribute( 'date' ),
			postType: select( editorStore ).getCurrentPostType(),
		} ),
		[]
	);

	const { editPost } = useDispatch( editorStore );
	const onUpdateDate = ( date ) => editPost( { date } );

	const [ previewedMonth, setPreviewedMonth ] = useState(
		startOfMonth( new Date( postDate ) )
	);

	// Pick up published and schduled site posts.
	const eventsByPostType = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'postType', postType, {
				status: 'publish,future',
				after: startOfMonth( previewedMonth ).toISOString(),
				before: endOfMonth( previewedMonth ).toISOString(),
				exclude: [ select( editorStore ).getCurrentPostId() ],
				per_page: 100,
				_fields: 'id,date',
			} ),
		[ previewedMonth, postType ]
	);

	const events = useMemo(
		() =>
			( eventsByPostType || [] ).map( ( { date: eventDate } ) => ( {
				date: new Date( eventDate ),
			} ) ),
		[ eventsByPostType ]
	);

	const settings = getSettings();

	// To know if the current timezone is a 12 hour time with look for "a" in the time format
	// We also make sure this a is not escaped by a "/"
	const is12HourTime = /a(?!\\)/i.test(
		settings.formats.time
			.toLowerCase() // Test only the lower case a.
			.replace( /\\\\/g, '' ) // Replace "//" with empty strings.
			.split( '' )
			.reverse()
			.join( '' ) // Reverse the string and test for "a" not followed by a slash.
	);

	return (
		<PrivatePublishDateTimePicker
			currentDate={ postDate }
			onChange={ onUpdateDate }
			is12Hour={ is12HourTime }
			dateOrder={
				/* translators: Order of day, month, and year. Available formats are 'dmy', 'mdy', and 'ymd'. */
				_x( 'dmy', 'date order' )
			}
			events={ events }
			onMonthPreviewed={ ( date ) =>
				setPreviewedMonth( parseISO( date ) )
			}
			onClose={ onClose }
			isCompact={ isCompact }
			showPopoverHeaderActions={ showPopoverHeaderActions }
		/>
	);
}
