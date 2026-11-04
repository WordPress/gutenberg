import { speak } from '@wordpress/a11y';
import { Button, DateTimePicker } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { useId, useMemo, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Fieldset, Stack } from '@wordpress/ui';
import type { PostWithDate } from './types';
import { isDateFloating } from './is-date-floating';
import { is12HourTime } from './is-12-hour-time';
import { isPublishedOnSave } from './is-published-on-save';
import styles from './style.module.css';

type Item = PostWithDate & { id?: number; type?: string };

function getMonthBounds( date: Date ) {
	return {
		after: new Date( date.getFullYear(), date.getMonth(), 1 ).toISOString(),
		before: new Date(
			date.getFullYear(),
			date.getMonth() + 1,
			0,
			23,
			59,
			59
		).toISOString(),
	};
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
		value ? new Date( value ) : new Date()
	);

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
