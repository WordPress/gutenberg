/**
 * WordPress dependencies
 */
import { getUnknownTypeHandlerName, rawHandler, serialize } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockConvertButton from './block-convert-button';

export default compose(
	withSelect( ( select, { clientId } ) => {
		const { canUserUseUnfilteredHTML, getBlock } = select( 'core/editor' );
		const block = getBlock( clientId );
		return {
			block,
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			shouldRender: ( block && block.name === getUnknownTypeHandlerName() ),
		};
	} ),
	withDispatch( ( dispatch, { block, canUserUseUnfilteredHTML } ) => ( {
		onClick: () => dispatch( 'core/editor' ).replaceBlocks(
			block.clientId,
			rawHandler( {
				HTML: serialize( block ),
				mode: 'BLOCKS',
				canUserUseUnfilteredHTML,
			} )
		),
	} ) ),
)( BlockConvertButton );
