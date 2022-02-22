/**
 * WordPress dependencies
 */
import { cloneBlock } from '@wordpress/blocks';
import { useAsyncList } from '@wordpress/compose';
import {
	__experimentalBlockPatternsList as BlockPatternsList,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getFirstQueryClientIdFromBlocks } from '../utils';

export default function PatternSelectionModal( { clientId, name } ) {
	const { blockPatterns } = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				__experimentalGetPatternsByBlockTypes,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );

			return {
				blockPatterns: __experimentalGetPatternsByBlockTypes(
					name,
					rootClientId
				),
			};
		},
		[ clientId, name ]
	);
	const { replaceBlock, selectBlock } = useDispatch( blockEditorStore );

	const onBlockPatternSelect = ( _pattern, blocks ) => {
		const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );
		const firstQueryClientId = getFirstQueryClientIdFromBlocks(
			clonedBlocks
		);
		replaceBlock( clientId, clonedBlocks );
		if ( firstQueryClientId ) {
			selectBlock( firstQueryClientId );
		}
	};
	const shownBlockPatterns = useAsyncList( blockPatterns, { step: 6 } );

	return (
		<div className="block-library-query__pattern-selection-content">
			<BlockPatternsList
				blockPatterns={ blockPatterns }
				shownPatterns={ shownBlockPatterns }
				onClickPattern={ onBlockPatternSelect }
			/>
		</div>
	);
}
