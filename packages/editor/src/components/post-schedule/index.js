import { parseISO, endOfMonth, startOfMonth } from 'date-fns';
import { speak } from '@wordpress/a11y';
import { getSettings } from '@wordpress/date';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useState, useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '../../store';
import { getFullPostScheduleLabel } from './label';
import { unlock } from '../../lock-unlock';

const { PrivatePublishDateTimePicker } = unlock( blockEditorPrivateApis );

/**
 * Renders the PostSchedule component. It allows the user to schedule a post.
 *
 * @param {Object}   props         Props.
 * @param {Function} props.onClose Function to close the component.
 *
 * @return {React.ReactNode} The rendered component.
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
	showPopoverHeader = true,
	showPopoverHeaderActions,
	isCompact,
} ) {
	const { postDate, postType, isDateFloating } = useSelect(
		( select ) => ( {
			postDate: select( editorStore ).getEditedPostAttribute( 'date' ),
			postType: select( editorStore ).getCurrentPostType(),
			isDateFloating: select( editorStore ).isEditedPostDateFloating(),
		} ),
		[]
	);

	const { editPost } = useDispatch( editorStore );
	const onUpdateDate = ( date ) => {
		editPost( { date } );
		speak(
			date
				? sprintf(
						// translators: %s: The new publish date and time, e.g. "June 3, 2025 12:00 pm UTC+0".
						__( 'Publish date set to %s.' ),
						getFullPostScheduleLabel( date )
				  )
				: __( 'Publish date set to now.' ),
			'assertive'
		);
	};

	const [ previewedMonth, setPreviewedMonth ] = useState(
		startOfMonth( new Date( postDate ) )
	);

	// Pick up published and scheduled site posts.
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

	const picker = (
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
			showPopoverHeader={ showPopoverHeader }
			showPopoverHeaderActions={ showPopoverHeaderActions }
		/>
	);

	// The popover header carries its own reset action. Rendered inline there is
	// no header, so the action follows the picker as a button. It stays in place
	// when there is no date to clear, rather than disappearing under the focus
	// that just activated it.
	if ( showPopoverHeader ) {
		return picker;
	}

	return (
		<>
			{ picker }
			<Button
				className="editor-post-schedule__reset"
				variant="secondary"
				__next40pxDefaultSize
				disabled={ isDateFloating }
				accessibleWhenDisabled
				onClick={ () => onUpdateDate( null ) }
			>
				{ __( 'Reset' ) }
			</Button>
		</>
	);
}
