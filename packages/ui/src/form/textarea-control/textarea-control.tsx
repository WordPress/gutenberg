import { forwardRef } from '@wordpress/element';
import { Textarea, Field } from '../primitives';
import type { TextareaControlProps } from './types';

/**
 * A complete textarea field with integrated label and description.
 *
 * ```jsx
 * import { TextareaControl } from '@wordpress/ui';
 * import { useState } from '@wordpress/element';
 *
 * const MyTextareaControl = () => {
 *   const [ text, setText ] = useState( '' );
 *
 *   return (
 *     <TextareaControl
 *       label="Text"
 *       description="Enter some text"
 *       value={ text }
 *       onValueChange={ setText }
 *     />
 *   );
 * };
 * ```
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
