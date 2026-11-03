import { speak } from '@wordpress/a11y';
import { Button, DateTimePicker } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { getSettings } from '@wordpress/date';
import { useId, useMemo, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Fieldset, Stack } from '@wordpress/ui';
import type { PostWithDate } from './types';
import { isDateFloating } from './is-date-floating';
import styles from './style.module.css';

type Item = PostWithDate & { id?: number; type?: string };

// Whether the site's time format is 12-hour: it has an `a` or `A` that is not
// escaped with a backslash.
function is12HourTime() {
	return /a(?!\\)/i.test(
		getSettings()
			.formats.time.toLowerCase()
			.replace( /\\\\/g, '' )
			.split( '' )
			.reverse()
			.join( '' )
	);
}

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

	const disabled = field.isDisabled( { item: data, field } );

	// Only DataViews filters pass an operator. A filter picks a date to compare
	// against, so resetting the post date means nothing there.
	const isFilter = !! operator;

	// The picker shows a date even when the post has none of its own: the save
	// time of a floating draft, or now once the date is reset.
	let note;
	if ( isFilter ) {
		// The notes describe the post's date, not the date a filter picks.
	} else if ( isFloating ) {
		note = __( 'Publishes immediately.' );
	} else if ( isReset ) {
		note = __( 'Changes to the time you save.' );
	}
	const noteId = useId();

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
				onChange={ ( newValue ) =>
					onChange(
						field.setValue( { item: data, value: newValue } )
					)
				}
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
					disabled={ disabled || isReset }
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
