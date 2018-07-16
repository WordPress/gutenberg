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
	withSelect( ( select, { uid } ) => {
		const { canUserUseUnfilteredHTML, getBlock } = select( 'core/editor' );
		const block = getBlock( uid );
		return {
			block,
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			shouldRender: ( block && block.name === getUnknownTypeHandlerName() ),
		};
	} ),
	withDispatch( ( dispatch, { block, canUserUseUnfilteredHTML } ) => ( {
		onClick: () => dispatch( 'core/editor' ).replaceBlocks(
			block.uid,
			rawHandler( {
				HTML: serialize( block ),
				mode: 'BLOCKS',
				canUserUseUnfilteredHTML,
			} )
		),
	} ) ),
)( BlockConvertButton );
