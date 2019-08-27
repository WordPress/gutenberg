
/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';
import classnames from 'classnames';

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/plain-text/README.md
 */
const PlainText = forwardRef( ( { onChange, className, ...props }, ref ) => {
	return (
		<TextareaAutosize
			ref={ ref }
			className={ classnames( 'editor-plain-text block-editor-plain-text', className ) }
			onChange={ ( event ) => onChange( event.target.value ) }
			{ ...props }
		/>
	);
} );

export default PlainText;
