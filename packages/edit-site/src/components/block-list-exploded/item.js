/**
 * WordPress dependencies
 */
import {
	store as blockEditorStore,
	BlockPreview,
	Inserter,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { pure } from '@wordpress/compose';
import { sprintf, __ } from '@wordpress/i18n';
import { store as blocksStore } from '@wordpress/blocks';

function BlockListExplodedItem( { clientId } ) {
	const { block, blockTitle } = useSelect(
		( select ) => {
			const { getBlock } = select( blockEditorStore );
			const { getBlockType } = select( blocksStore );
			const _block = getBlock( clientId );
			const blockType = getBlockType( _block.name );
			return {
				block: _block,
				blockTitle: blockType?.title,
			};
		},
		[ clientId ]
	);
	const { selectBlock } = useDispatch( blockEditorStore );

	// translators: %s: Type of block (i.e. Text, Image etc)
	const blockLabel = sprintf( __( 'Block: %s' ), blockTitle );

	return (
		<div>
			<div
				className="edit-site-block-list-exploded__inserter"
				key={ block.clientId }
			>
				<Inserter
					clientId={ block.clientId }
					__experimentalIsQuick
					isPrimary
				/>
			</div>
			<div
				role="button"
				onClick={ () => selectBlock( clientId ) }
				onKeyPress={ () => selectBlock( clientId ) }
				aria-label={ blockLabel }
				tabIndex={ 0 }
			>
				<BlockPreview blocks={ [ block ] } />
			</div>
		</div>
	);
}

export default pure( BlockListExplodedItem );
