import { forwardRef } from '@wordpress/element';
import * as Field from '../primitives/field';
import {
	DateInput,
	type DateInputProps,
} from '../primitives/date-input/date-input';
import type { ControlProps } from '../types';

/** A date input composed with the existing Field label and descriptions. */
export const DateInputControl = forwardRef<
	HTMLInputElement,
	DateInputProps & ControlProps
>( function UnforwardedDateInputControl(
	{ label, description, details, hideLabelFromVision, ...props },
	ref
) {
	return (
		<Field.Root>
			<Field.Label hideFromVision={ hideLabelFromVision }>
				{ label }
			</Field.Label>
			<DateInput { ...props } ref={ ref } />
			{ description && (
				<Field.Description>{ description }</Field.Description>
			) }
			{ details && <Field.Details>{ details }</Field.Details> }
		</Field.Root>
	);
} );
