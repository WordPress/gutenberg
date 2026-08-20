import { forwardRef } from '@wordpress/element';
import { Input, Field } from '../primitives';
import type { InputControlProps } from './types';

/**
 * A complete input field with integrated label and description.
 */
export const InputControl = forwardRef< HTMLInputElement, InputControlProps >(
	function InputControl(
		{
			className,
			label,
			description,
			details,
			hideLabelFromVision,
			...restProps
		},
		ref
	) {
		return (
			<Field.Root className={ className }>
				<Field.Label hideFromVision={ hideLabelFromVision }>
					{ label }
				</Field.Label>
				<Input ref={ ref } { ...restProps } />
				{ description && (
					<Field.Description>{ description }</Field.Description>
				) }
				{ details && <Field.Details>{ details }</Field.Details> }
			</Field.Root>
		);
	}
);
