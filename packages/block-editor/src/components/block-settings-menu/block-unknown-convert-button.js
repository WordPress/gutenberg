/**
 * WordPress dependencies
 */
import { getFreeformContentHandlerName, rawHandler, serialize } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockConvertButton from './block-convert-button';

export default compose(
	withSelect( ( select, { clientId } ) => {
		const block = select( 'core/block-editor' ).getBlock( clientId );

		return {
			block,
			shouldRender: ( block && block.name === getFreeformContentHandlerName() ),
		};
	} ),
	withDispatch( ( dispatch, { block } ) => ( {
		onClick: () => dispatch( 'core/block-editor' ).replaceBlocks(
			block.clientId,
			rawHandler( { HTML: serialize( block ) } )
		),
	} ) ),
)( BlockConvertButton );
