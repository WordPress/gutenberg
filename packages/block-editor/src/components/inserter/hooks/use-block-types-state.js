/**
 * WordPress dependencies
 */
import {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
	parse,
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
	const [ items ] = useSelect(
		( select ) => [
			select( blockEditorStore ).getInserterItems( rootClientId ),
		],
		[ rootClientId ]
	);

	const [ allItems ] = useSelect(
		( select ) => {
			// get top most block client id
			const rootBlockClientId =
				select( blockEditorStore ).getBlockRootClientId( rootClientId );
			return [
				select( blockEditorStore ).getInserterItems(
					rootBlockClientId
				),
			];
		},
		[ rootClientId ]
	);

	const [ categories, collections ] = useSelect( ( select ) => {
		const { getCategories, getCollections } = select( blocksStore );
		return [ getCategories(), getCollections() ];
	}, [] );

	const onSelectItem = useCallback(
		(
			{ name, initialAttributes, innerBlocks, syncStatus, content },
			shouldFocusBlock
		) => {
			const insertedBlock =
				syncStatus === 'unsynced'
					? parse( content, {
							__unstableSkipMigrationLogs: true,
					  } )
					: createBlock(
							name,
							initialAttributes,
							createBlocksFromInnerBlocksTemplate( innerBlocks )
					  );

			onInsert( insertedBlock, undefined, shouldFocusBlock );
		},
		[ onInsert ]
	);

	return [ items, categories, collections, onSelectItem, allItems ];
};

export default useBlockTypesState;
