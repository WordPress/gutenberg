/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { compose } from '@wordpress/compose';

/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { withBlockEditContext } from '../block-edit/context';

const PlainText = forwardRef( ( { onChange, className, isReadOnly, ...props }, ref ) => {
	delete props.clientId;
	return (
		<TextareaAutosize
			ref={ ref }
			className={ classnames( 'editor-plain-text block-editor-plain-text', className ) }
			onChange={ ( event ) => onChange( event.target.value ) }
			disabled={ isReadOnly }
			{ ...props }
		/>
	);
} );

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/plain-text/README.md
 */
export default compose( [
	withBlockEditContext( ( { isReadOnly } ) => ( { isReadOnly } ) ),
] )( PlainText );
