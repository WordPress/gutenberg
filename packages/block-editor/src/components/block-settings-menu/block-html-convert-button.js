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
import { store as blockEditorStore } from '../../store';

export default compose(
	withSelect( ( select, { clientId } ) => {
		const block = select( blockEditorStore ).getBlock( clientId );

		return {
			block,
			shouldRender: block && block.name === 'core/html',
		};
	} ),
	withDispatch( ( dispatch, { block } ) => ( {
		onClick: () =>
			dispatch( blockEditorStore ).replaceBlocks(
				block.clientId,
				rawHandler( { HTML: getBlockContent( block ) } )
			),
	} ) )
)( BlockConvertButton );
