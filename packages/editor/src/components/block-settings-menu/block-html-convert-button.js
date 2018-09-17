/**
 * WordPress dependencies
 */
import { rawHandler, getBlockContent } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockConvertButton from './block-convert-button';

export default compose(
	withSelect( ( select, { clientId } ) => {
		const { getBlock, canUserUseUnfilteredHTML } = select( 'core/editor' );
		const block = getBlock( clientId );
		return {
			block,
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			shouldRender: ( block && block.name === 'core/html' ),
		};
	} ),
	withDispatch( ( dispatch, { block, canUserUseUnfilteredHTML } ) => ( {
		onClick: () => dispatch( 'core/editor' ).replaceBlocks(
			block.clientId,
			rawHandler( {
				HTML: getBlockContent( block ),
				mode: 'BLOCKS',
				canUserUseUnfilteredHTML,
			} ),
		),
	} ) ),
)( BlockConvertButton );
