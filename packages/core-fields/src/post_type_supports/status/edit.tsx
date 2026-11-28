import { useMemo } from '@wordpress/element';
import type { DataFormControlProps } from '@wordpress/dataviews';
import { RadioGroupControl } from '@wordpress/ui';
import type { PostWithStatus } from './types';

/*
 * The statuses that can't be picked. A post goes to the trash through the
 * "Move to trash" action, not by editing its status, yet the field keeps the
 * `trash` element so that filters and views can label a trashed post.
 */
const STATUSES_NOT_EDITABLE = [ 'trash' ];

/*
 * The status control: a radio group of the field's elements, without the
 * statuses that can't be picked.
 */
export default function StatusEdit( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< PostWithStatus > ) {
	const { label, description, elements, getValue, setValue } = field;
	const items = useMemo(
		() =>
			( elements ?? [] )
				.filter(
					( element ) =>
						! STATUSES_NOT_EDITABLE.includes(
							String( element.value )
						)
				)
				.map( ( element ) => ( {
					value: String( element.value ),
					label: element.label,
					description: element.description,
				} ) ),
		[ elements ]
	);
	return (
		<RadioGroupControl
			label={ label }
			// The control describes itself with plain text only.
			description={
				typeof description === 'string' ? description : undefined
			}
			hideLabelFromVision={ hideLabelFromVision }
			items={ items }
			value={ getValue( { item: data } ) ?? '' }
			onValueChange={ ( value ) =>
				onChange( setValue( { item: data, value } ) )
			}
			disabled={ field.isDisabled( { item: data, field } ) }
		/>
	);
}
