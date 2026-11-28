import {
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
	parse,
} from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import type { BlockCategory, BlockCollection } from '@wordpress/blocks';
import { store as blockEditorStore } from '../../../store';
import { isFiltered } from '../../../store/utils';
import type { InserterItem } from '../../../store/types';
import type { BlockTypesState, InsertBlocks } from '../types';

// Shared so the selector cache survives the inserter closing and reopening.
const FILTERED_OPTIONS = { [ isFiltered ]: true };
const UNFILTERED_OPTIONS = { [ isFiltered ]: false };

/**
 * Retrieves the block types inserter state.
 *
 * @param rootClientId Insertion's root client ID.
 * @param onInsert     function called when inserter a list of blocks.
 * @param isQuick
 * @return Returns the block types state. (block types, categories, collections, onSelect handler)
 */
const useBlockTypesState = (
	rootClientId: string | null | undefined,
	onInsert: InsertBlocks,
	isQuick?: boolean
): BlockTypesState => {
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

	const [ categories, collections ] = useSelect(
		( select ): [ BlockCategory[], Record< string, BlockCollection > ] => {
			const { getCategories, getCollections } = select( blocksStore );
			return [ getCategories(), getCollections() ];
		},
		[]
	);

	const onSelectItem = useCallback(
		(
			{
				name,
				initialAttributes,
				innerBlocks,
				innerContent,
				syncStatus,
				content,
			}: InserterItem,
			shouldFocusBlock?: boolean
		) => {
			const insertedBlock =
				syncStatus === 'unsynced'
					? // Unsynced patterns hold their content.
						parse( content as string, {
							__unstableSkipMigrationLogs: true,
						} )
					: createBlock(
							name,
							initialAttributes,
							createBlocksFromInnerBlocksTemplate(
								// Variations hold inner block templates.
								innerBlocks as Parameters<
									typeof createBlocksFromInnerBlocksTemplate
								>[ 0 ]
							),
							innerContent
						);
			onInsert( insertedBlock, undefined, shouldFocusBlock );
		},
		[ onInsert ]
	);

	return [ items, categories, collections, onSelectItem ];
};

export default useBlockTypesState;
