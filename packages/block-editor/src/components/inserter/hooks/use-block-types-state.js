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
import { withRootClientIdOptionKey } from '../../../store/utils';

/**
 * Retrieves the block types inserter state.
 *
 * @param {string=}  rootClientId Insertion's root client ID.
 * @param {Function} onInsert     function called when inserter a list of blocks.
 * @param {boolean}  isQuick
 * @return {Array} Returns the block types state. (block types, categories, collections, onSelect handler)
 */
const useBlockTypesState = ( rootClientId, onInsert, isQuick ) => {
	const [ items ] = useSelect(
		( select ) => [
			select( blockEditorStore ).getInserterItems( rootClientId, {
				[ withRootClientIdOptionKey ]: ! isQuick,
			} ),
		],
		[ rootClientId, isQuick ]
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
				syncStatus,
				content,
				rootClientId: _rootClientId,
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
							createBlocksFromInnerBlocksTemplate( innerBlocks )
					  );

			onInsert(
				insertedBlock,
				undefined,
				shouldFocusBlock,
				_rootClientId
			);
		},
		[ onInsert ]
	);

	return [ items, categories, collections, onSelectItem ];
};

export default useBlockTypesState;
