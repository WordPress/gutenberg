/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import EditableText from '../editable-text';

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
 * @param {Object}   [props.ref]    The component forwards the `ref` property to the `TextareaAutosize` component.
 * @return {Element} Plain text component
 */
const PlainText = forwardRef( ( { __experimentalVersion, ...props }, ref ) => {
	if ( __experimentalVersion === 2 ) {
		return <EditableText ref={ ref } { ...props } />;
	}

	const { className, onChange, ...remainingProps } = props;

	return (
		<TextareaAutosize
			ref={ ref }
			className={ clsx( 'block-editor-plain-text', className ) }
			onChange={ ( event ) => onChange( event.target.value ) }
			{ ...remainingProps }
		/>
	);
} );

export default PlainText;
