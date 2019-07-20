/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
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

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/plain-text/README.md
 */
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

export default compose( [
	withBlockEditContext( ( { clientId } ) => ( { clientId } ) ),
	withSelect( ( select, {
		clientId,
	} ) => {
		const {
			getBlockRootClientId,
			getTemplateLock,
		} = select( 'core/block-editor' );

		const isReadOnly = getTemplateLock( getBlockRootClientId( clientId ) ) === 'readonly';

		return { isReadOnly };
	} ),
] )( PlainText );
