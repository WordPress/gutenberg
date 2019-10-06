
/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { escapeHTML, unescapeHTML } from '@wordpress/escape-html';

/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';
import classnames from 'classnames';

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/plain-text/README.md
 */
const PlainText = forwardRef( ( { onChange, className, value, ...props }, ref ) => {
	return (
		<TextareaAutosize
			ref={ ref }
			className={ classnames( 'editor-plain-text block-editor-plain-text', className ) }
			onChange={ ( event ) => onChange( escapeHTML( event.target.value ) ) }
			value={ unescapeHTML( value ) }
			{ ...props }
		/>
	);
} );

export default PlainText;
