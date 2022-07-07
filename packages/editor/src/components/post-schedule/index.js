/**
 * WordPress dependencies
 */
import { __experimentalGetSettings } from '@wordpress/date';
import { useDispatch, useSelect } from '@wordpress/data';
import { __experimentalPublishDateTimePicker as PublishDateTimePicker } from '@wordpress/block-editor';
import { useState, useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function getDayOfTheMonth( date = new Date(), firstDay = true ) {
	const d = new Date( date );
	return new Date(
		d.getFullYear(),
		d.getMonth() + ( firstDay ? 0 : 1 ),
		firstDay ? 1 : 0
	).toISOString();
}

export default function PostSchedule( { onClose } ) {
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
		getDayOfTheMonth( postDate )
	);

	// Pick up published and schduled site posts.
	const eventsByPostType = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'postType', postType, {
				status: 'publish,future',
				after: getDayOfTheMonth( previewedMonth ),
				before: getDayOfTheMonth( previewedMonth, false ),
				exclude: [ select( editorStore ).getCurrentPostId() ],
			} ),
		[ previewedMonth, postType ]
	);

	const events = useMemo(
		() =>
			( eventsByPostType || [] ).map(
				( { title, type, date: eventDate } ) => ( {
					title: title?.rendered,
					type,
					date: new Date( eventDate ),
				} )
			),
		[ eventsByPostType ]
	);

	const settings = __experimentalGetSettings();

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
		<PublishDateTimePicker
			currentDate={ postDate }
			onChange={ onUpdateDate }
			is12Hour={ is12HourTime }
			events={ events }
			onMonthPreviewed={ setPreviewedMonth }
			onClose={ onClose }
		/>
	);
}
