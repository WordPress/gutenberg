import { speak } from '@wordpress/a11y';
import { Button, DateTimePicker } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import type { DataFormControlProps } from '@wordpress/dataviews';
import {
	date as formatDate,
	dateI18n,
	getDate,
	getSettings,
} from '@wordpress/date';
import { useId, useMemo, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Fieldset, Stack } from '@wordpress/ui';
import type { PostWithDate } from './types';
import { isDateFloating } from './is-date-floating';
import { is12HourTime } from './is-12-hour-time';
import { isPublishedOnSave } from './is-published-on-save';
import styles from './style.module.css';

type Item = PostWithDate & { id?: number; type?: string };

function toTimezonelessDate( date: Date, time: string ) {
	const pad = ( number: number ) => String( number ).padStart( 2, '0' );
	return `${ date.getFullYear() }-${ pad( date.getMonth() + 1 ) }-${ pad(
		date.getDate()
	) }T${ time }`;
}

/*
 * The bounds of the posts query for the month of a date. The server reads a
 * date without a timezone in the site's timezone, as `post_date` is, so the
 * bounds carry none. Both are exclusive: they are the last second of the
 * previous month and the first second of the next one.
 */
function getMonthBounds( date: Date ) {
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

/*
 * Today's month in the site's timezone: the month the date picker shows when
 * there is no date. The browser's month can differ near a month boundary.
 */
function getSiteMonth() {
	const now = new Date();
	return new Date(
		Number( formatDate( 'Y', now ) ),
		Number( formatDate( 'n', now ) ) - 1,
		1
	);
}

/*
 * The date control: the date and time picker of the previous publish panel,
 * followed by a button that resets the date. A reset sends `null`, which makes
 * a draft publish immediately again and sets a published post's date to the
 * time it is saved.
 */
export default function DateEdit( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	operator,
}: DataFormControlProps< Item > ) {
	const value = field.getValue( { item: data } ) ?? undefined;

	const [ previewedMonth, setPreviewedMonth ] = useState( () =>
		value ? new Date( value ) : getSiteMonth()
	);

	// The calendar moves to the month of a new date, from the Month and Year
	// inputs or a reset, without calling `onMonthPreviewed`. Follow it, so the
	// markers come from the month on screen.
	const [ prevValue, setPrevValue ] = useState( value );
	if ( value !== prevValue ) {
		setPrevValue( value );
		setPreviewedMonth( value ? new Date( value ) : getSiteMonth() );
	}

	// Mark the days with published and scheduled posts of the same type.
	const otherPosts = useSelect(
		( select ) =>
			data.type
				? ( select( coreStore ).getEntityRecords(
						'postType',
						data.type,
						{
							status: 'publish,future',
							...getMonthBounds( previewedMonth ),
							exclude: data.id ? [ data.id ] : [],
							per_page: 100,
							_fields: 'id,date',
						}
					) as { date: string }[] | null )
				: null,
		[ data.type, data.id, previewedMonth ]
	);
	const events = useMemo(
		() =>
			( otherPosts ?? [] ).map( ( post ) => ( {
				date: new Date( post.date ),
			} ) ),
		[ otherPosts ]
	);

	// The saved status, not the edited one: a status picked in the same form
	// doesn't change whether the date floats until the post is saved.
	const savedStatus = useSelect(
		( select ) => {
			if ( ! data.type || ! data.id ) {
				return undefined;
			}
			const saved: { status?: string } | undefined = select(
				coreStore
			).getEntityRecord( 'postType', data.type, data.id );
			return saved?.status;
		},
		[ data.type, data.id ]
	);
	// Reset is available whenever there is a date, so there is nothing to
	// reset only once the date is `null`: the post takes its date on save.
	const isReset = ! value;
	const isFloating = isDateFloating( {
		...data,
		status: savedStatus ?? data.status,
	} );

	// Only DataViews filters pass an operator. A filter picks a date to compare
	// against, so resetting the post date means nothing there.
	const isFilter = !! operator;

	// Only a scheduled post gets a note, and only when it won't wait: its date
	// is reset, still floats, or is in the past. Publishing it then makes it
	// public right away. The status is the edited one, so a draft scheduled in
	// the same form gets the note before it is saved.
	const note =
		! isFilter &&
		data.status === 'future' &&
		( ! value || isFloating || isPublishedOnSave( value ) )
			? __( 'Publishes immediately.' )
			: undefined;
	const noteId = useId();

	const onPick = ( newValue: string | null ) => {
		onChange( field.setValue( { item: data, value: newValue } ) );
		// A filter's date isn't the post's publish date.
		if ( ! isFilter && newValue ) {
			speak(
				sprintf(
					// translators: %s: The new publish date and time, e.g. "June 3, 2025 12:00 pm".
					__( 'Publish date set to %s.' ),
					dateI18n(
						getSettings().formats.datetime,
						getDate( newValue )
					)
				),
				'assertive'
			);
		}
	};

	const onReset = () => {
		onChange( field.setValue( { item: data, value: null } ) );
		speak( __( 'Publish date set to now.' ), 'assertive' );
	};

	return (
		<Stack render={ <Fieldset.Root /> } direction="column" gap="lg">
			<Fieldset.Legend hideFromVision={ hideLabelFromVision }>
				{ field.label }
			</Fieldset.Legend>
			<DateTimePicker
				currentDate={ value }
				onChange={ onPick }
				is12Hour={ is12HourTime() }
				dateOrder={
					/* translators: Order of day, month, and year. Available formats are 'dmy', 'mdy', and 'ymd'. */
					_x( 'dmy', 'date order' ) as 'dmy' | 'mdy' | 'ymd'
				}
				startOfWeek={ getSettings().l10n.startOfWeek }
				events={ events }
				onMonthPreviewed={ ( date ) =>
					setPreviewedMonth( new Date( date ) )
				}
			/>
			{ /* The button stays in place, focusable, when there is no date to
			     reset, rather than disappearing under the focus that just
			     activated it. */ }
			{ ! isFilter && (
				<Button
					className={ styles.reset }
					variant="secondary"
					__next40pxDefaultSize
					accessibleWhenDisabled
					disabled={ isReset }
					onClick={ onReset }
					aria-describedby={ note ? noteId : undefined }
				>
					{ __( 'Reset' ) }
				</Button>
			) }
			{ note && (
				<Fieldset.Description id={ noteId }>
					{ note }
				</Fieldset.Description>
			) }
		</Stack>
	);
}
