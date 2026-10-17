import {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
	parse,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as blockEditorStore } from '../../../store';
import { isFiltered } from '../../../store/utils';

// Shared so the selector cache survives the inserter closing and reopening.
const FILTERED_OPTIONS = { [ isFiltered ]: true };
const UNFILTERED_OPTIONS = { [ isFiltered ]: false };

/**
 * Retrieves the block types inserter state.
 *
 * @param {string=}  rootClientId Insertion's root client ID.
 * @param {Function} onInsert     function called when inserter a list of blocks.
 * @param {boolean}  isQuick
 * @return {Array} Returns the block types state. (block types, categories, collections, onSelect handler)
 */
const useBlockTypesState = ( rootClientId, onInsert, isQuick ) => {
	const options = isQuick ? FILTERED_OPTIONS : UNFILTERED_OPTIONS;
	// Not wrapped in a tuple, so `useSelect` can return the previous array when the items match.
	const items = useSelect(
		( select ) =>
			select( blockEditorStore ).getInserterItems(
				rootClientId,
				options
			),
		[ rootClientId, options ]
	);

	const [ categories, collections ] = useSelect( ( select ) => {
		const { getCategories, getCollections } = select( blocksStore );
		return [ getCategories(), getCollections() ];
	}, [] );

	const onSelectItem = useCallback(
		(
			{
				name,
				initialAttributes,
				innerBlocks,
				innerContent,
				syncStatus,
				content,
			},
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
							createBlocksFromInnerBlocksTemplate( innerBlocks ),
							innerContent
						);
			onInsert( insertedBlock, undefined, shouldFocusBlock );
		},
		[ onInsert ]
	);

	return [ items, categories, collections, onSelectItem ];
};

export default useBlockTypesState;
