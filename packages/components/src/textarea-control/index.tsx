/**
 * External dependencies
 */
import type { ChangeEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BaseControl from '../base-control';
import { StyledTextarea } from './styles/textarea-control-styles';
import type { TextareaControlProps } from './types';
import type { WordPressComponentProps } from '../ui/context';

/**
 * TextareaControls are TextControls that allow for multiple lines of text, and
 * wrap overflow text onto a new line. They are a fixed height and scroll
 * vertically when the cursor reaches the bottom of the field.
 *
 * ```jsx
 * import { TextareaControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyTextareaControl = () => {
 *   const [ text, setText ] = useState( '' );
 *
 *   return (
 *     <TextareaControl
 *       label="Text"
 *       help="Enter some text"
 *       value={ text }
 *       onChange={ ( value ) => setText( value ) }
 *     />
 *   );
 * };
 * ```
 */
export function TextareaControl(
	props: WordPressComponentProps< TextareaControlProps, 'textarea', false >
) {
	const {
		__nextHasNoMarginBottom,
		label,
		hideLabelFromVision,
		value,
		help,
		onChange,
		rows = 4,
		className,
		...additionalProps
	} = props;
	const instanceId = useInstanceId( TextareaControl );
	const id = `inspector-textarea-control-${ instanceId }`;
	const onChangeValue = ( event: ChangeEvent< HTMLTextAreaElement > ) =>
		onChange( event.target.value );

	return (
		<BaseControl
			__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			id={ id }
			help={ help }
			className={ className }
		>
			<StyledTextarea
				className="components-textarea-control__input"
				id={ id }
				rows={ rows }
				onChange={ onChangeValue }
				aria-describedby={ !! help ? id + '__help' : undefined }
				value={ value }
				{ ...additionalProps }
			/>
		</BaseControl>
	);
}

export default TextareaControl;
