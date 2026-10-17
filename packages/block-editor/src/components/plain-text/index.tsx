import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import EditableText from '../editable-text';
import type { EditableTextProps } from '../editable-text/types';
import type { PlainTextProps } from './types';

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
const PlainText = forwardRef<
	HTMLTextAreaElement & HTMLElement,
	PlainTextProps
>( ( { __experimentalVersion, ...props }, ref ) => {
	if ( __experimentalVersion === 2 ) {
		// The editable text takes the text props of the textarea.
		return (
			<EditableText
				ref={ ref }
				{ ...( props as unknown as EditableTextProps ) }
			/>
		);
	}

	const { className, onChange, ...remainingProps } = props;

	return (
		<textarea
			ref={ ref }
			className={ clsx( 'block-editor-plain-text', className ) }
			onChange={ ( event ) => onChange( event.target.value ) }
			{ ...remainingProps }
		/>
	);
} );

export default PlainText;
