import { forwardRef } from '@wordpress/element';
import { Textarea, Field } from '../primitives';
import type { TextareaControlProps } from './types';

/**
 * A complete textarea field with integrated label and description.
 */
export const TextareaControl = forwardRef<
	HTMLTextAreaElement,
	TextareaControlProps
>( function TextareaControl(
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
			<Textarea ref={ ref } { ...restProps } />
			{ description && (
				<Field.Description>{ description }</Field.Description>
			) }
			{ details && <Field.Details>{ details }</Field.Details> }
		</Field.Root>
	);
} );
