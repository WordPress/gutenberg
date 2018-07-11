/**
 * WordPress dependencies
 */
import { rawHandler, getBlockContent } from '@wordpress/blocks';
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ConvertToBlocks from './convertToBlocks';

export default compose(
	withSelect( ( select, { uid } ) => {
		const { getBlock, canUserUseUnfilteredHTML } = select( 'core/editor' );
		const block = getBlock( uid );
		return {
			block,
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			shouldRender: ( block && block.name === 'core/html' ),
		};
	} ),
	withDispatch( ( dispatch, { block, canUserUseUnfilteredHTML } ) => ( {
		onClick: () => dispatch( 'core/editor' ).replaceBlocks(
			block.uid,
			rawHandler( {
				HTML: getBlockContent( block ),
				mode: 'BLOCKS',
				canUserUseUnfilteredHTML,
			} ),
		),
	} ) ),
)( ConvertToBlocks );
