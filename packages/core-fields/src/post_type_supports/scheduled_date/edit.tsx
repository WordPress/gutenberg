import { TimePicker } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { _x, __ } from '@wordpress/i18n';
import { Fieldset, Stack } from '@wordpress/ui';
import type { PostWithDate } from '../date/types';
import { isDateFloating } from '../date/is-date-floating';
import { is12HourTime } from '../date/is-12-hour-time';
import { isPublishedOnSave } from '../date/is-published-on-save';

type Item = PostWithDate & { id?: number; type?: string };

/*
 * The scheduled date control: the date and time inputs of the date picker,
 * without its calendar or a way to clear them. A post without a date of its
 * own shows the current time, which is when it publishes.
 */
export default function ScheduledDateEdit( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const value = field.getValue( { item: data } ) ?? undefined;

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
	const isFloating = isDateFloating( {
		...data,
		status: savedStatus ?? data.status,
	} );

	// A scheduled post that won't wait, because its date is reset, still
	// floats, or is in the past, is public as soon as it is published.
	const isImmediate = ! value || isFloating || isPublishedOnSave( value );

	return (
		<Stack render={ <Fieldset.Root /> } direction="column" gap="lg">
			<Fieldset.Legend hideFromVision={ hideLabelFromVision }>
				{ field.label }
			</Fieldset.Legend>
			<TimePicker
				currentTime={ value }
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
			/>
			{ isImmediate && (
				<Fieldset.Description>
					{ __( 'Publishes immediately.' ) }
				</Fieldset.Description>
			) }
		</Stack>
	);
}
