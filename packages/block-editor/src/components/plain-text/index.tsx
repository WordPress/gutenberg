import clsx from 'clsx';
import type { ForwardedRef } from 'react';
import { forwardRef } from '@wordpress/element';
import EditableText from '../editable-text';
import type { EditableTextProps } from '../editable-text/types';
import type { PlainTextProps, PlainTextTextareaProps } from './types';

/**
 * Render an auto-growing textarea allow users to fill any textual content.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/plain-text/README.md
 *
 * @example
 * ```jsx
 * import { registerBlockType } from '@wordpress/blocks';
 * import { PlainText } from '@wordpress/block-editor';
 *
 * registerBlockType( 'my-plugin/example-block', {
 *   // ...
 *
 *   attributes: {
 *     content: {
 *       type: 'string',
 *     },
 *   },
 *
 *   edit( { className, attributes, setAttributes } ) {
 *     return (
 *       <PlainText
 *         className={ className }
 *         value={ attributes.content }
 *         onChange={ ( content ) => setAttributes( { content } ) }
 *       />
 *     );
 *   },
 * } );
 * ````
 *
 * @param {Object}   props          Component props.
 * @param {string}   props.value    String value of the textarea.
 * @param {Function} props.onChange Function called when the text value changes.
 * @param {Object}   [props.ref]    The component forwards the `ref` property to the `textarea` element.
 * @return {Element} Plain text component
 */
const PlainText = forwardRef< HTMLElement, PlainTextProps >(
	( { __experimentalVersion, ...props }, ref ) => {
		if ( __experimentalVersion === 2 ) {
			// Version 2 takes the editable text props.
			return (
				<EditableText
					ref={ ref }
					{ ...( props as EditableTextProps ) }
				/>
			);
		}

		// Other versions take the textarea props.
		const { className, onChange, ...remainingProps } =
			props as PlainTextTextareaProps;

		return (
			<textarea
				// The textarea is the referenced element of these versions.
				ref={ ref as ForwardedRef< HTMLTextAreaElement > }
				className={ clsx( 'block-editor-plain-text', className ) }
				onChange={ ( event ) => onChange( event.target.value ) }
				{ ...remainingProps }
			/>
		);
	}
);

export default PlainText;
