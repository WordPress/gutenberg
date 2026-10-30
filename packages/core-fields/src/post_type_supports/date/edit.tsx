import { speak } from '@wordpress/a11y';
import { Button } from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import type { DataFormControlProps, Field } from '@wordpress/dataviews';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import type { PostWithDate } from './types';
import { isDateFloating } from './is-date-floating';

/*
 * The date control: the datetime control of `@wordpress/dataviews`, followed
 * by a button that resets the date. A reset sends `null`, which makes a draft
 * publish immediately again and sets a published post's date to the time it
 * is saved.
 */
export default function DateEdit( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< PostWithDate > ) {
	// `@wordpress/dataviews` exports no control, so a form of this one field
	// renders its datetime control.
	const fields: Field< PostWithDate >[] = useMemo(
		() => [
			{
				id: field.id,
				type: 'datetime',
				label: field.label,
				description: field.description,
				getValue: field.getValue,
				setValue: field.setValue,
				isDisabled: field.isDisabled,
				Edit: 'datetime',
			},
		],
		[ field ]
	);
	const form = useMemo(
		() => ( {
			layout: {
				type: 'regular' as const,
				labelPosition: hideLabelFromVision
					? ( 'none' as const )
					: ( 'top' as const ),
			},
			fields: [ field.id ],
		} ),
		[ field.id, hideLabelFromVision ]
	);

	const onReset = () => {
		onChange( { date: null } );
		speak( __( 'Publish date set to now.' ), 'assertive' );
	};

	return (
		<Stack direction="column" gap="lg">
			<DataForm< PostWithDate >
				data={ data }
				fields={ fields }
				form={ form }
				onChange={ onChange }
			/>
			{ /* The button stays in place, focusable, when there is no date to
			     reset, rather than disappearing under the focus that just
			     activated it. */ }
			<Button
				variant="secondary"
				__next40pxDefaultSize
				accessibleWhenDisabled
				disabled={
					isDateFloating( data ) ||
					field.isDisabled( { item: data, field } )
				}
				onClick={ onReset }
			>
				{ __( 'Reset' ) }
			</Button>
		</Stack>
	);
}
