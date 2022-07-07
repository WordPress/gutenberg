/**
 * WordPress dependencies
 */
import {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

/**
 * Retrieves the block types inserter state.
 *
 * @param {string=}  rootClientId Insertion's root client ID.
 * @param {Function} onInsert     function called when inserter a list of blocks.
 * @return {Array} Returns the block types state. (block types, categories, collections, onSelect handler)
 */
const useBlockTypesState = ( rootClientId, onInsert ) => {
	const { categories, collections, items } = useSelect(
		( select ) => {
			const { getInserterItems } = select( blockEditorStore );
			const { getCategories, getCollections } = select( blocksStore );

			return {
				categories: getCategories(),
				collections: getCollections(),
				items: getInserterItems( rootClientId ),
			};
		},
		[ rootClientId ]
	);

	const onSelectItem = useCallback(
		( { name, initialAttributes, innerBlocks }, shouldFocusBlock ) => {
			const insertedBlock = createBlock(
				name,
				initialAttributes,
				createBlocksFromInnerBlocksTemplate( innerBlocks )
			);

			onInsert( insertedBlock, undefined, shouldFocusBlock );
		},
		[ onInsert ]
	);

	return [ items, categories, collections, onSelectItem ];
};

export default useBlockTypesState;
