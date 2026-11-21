import { parseISO } from 'date-fns';
import { speak } from '@wordpress/a11y';
import { date as formatDate, getSettings } from '@wordpress/date';
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
 * Today's month in the site's timezone: the month the date picker shows when
 * there is no date. The browser's month can differ near a month boundary.
 *
 * @return {Date} The first day of the month.
 */
function getSiteMonth() {
	const now = new Date();
	return new Date(
		Number( formatDate( 'Y', now ) ),
		Number( formatDate( 'n', now ) ) - 1,
		1
	);
}

/**
 * Formats the day of a date with a time, without a timezone.
 *
 * @param {Date}   date The date.
 * @param {string} time The time, as `H:i:s`.
 *
 * @return {string} The date, e.g. `2026-10-31T23:59:59`.
 */
function toTimezonelessDate( date, time ) {
	const pad = ( number ) => String( number ).padStart( 2, '0' );
	return `${ date.getFullYear() }-${ pad( date.getMonth() + 1 ) }-${ pad(
		date.getDate()
	) }T${ time }`;
}

/**
 * The bounds of the posts query for the month of a date. The server reads a
 * date without a timezone in the site's timezone, as `post_date` is, so the
 * bounds carry none. Both are exclusive: they are the last second of the
 * previous month and the first second of the next one.
 *
 * @param {Date} date A date in the month.
 *
 * @return {{after: string, before: string}} The bounds.
 */
function getMonthBounds( date ) {
	const year = date.getFullYear();
	const month = date.getMonth();
	return {
		after: toTimezonelessDate( new Date( year, month, 0 ), '23:59:59' ),
		before: toTimezonelessDate(
			new Date( year, month + 1, 1 ),
			'00:00:00'
		),
	};
}

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

	const [ previewedMonth, setPreviewedMonth ] = useState( () =>
		postDate ? new Date( postDate ) : getSiteMonth()
	);

	// The calendar moves to the month of a new date, from the Month and Year
	// inputs or a reset, without calling `onMonthPreviewed`. Follow it, so the
	// markers come from the month on screen.
	const [ prevPostDate, setPrevPostDate ] = useState( postDate );
	if ( postDate !== prevPostDate ) {
		setPrevPostDate( postDate );
		setPreviewedMonth( postDate ? new Date( postDate ) : getSiteMonth() );
	}

	// Pick up published and scheduled site posts.
	const eventsByPostType = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'postType', postType, {
				status: 'publish,future',
				...getMonthBounds( previewedMonth ),
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
