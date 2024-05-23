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
	const [ allItems ] = useSelect( ( select ) => {
		const { getBlocksByName, getInserterItems } =
			select( blockEditorStore );

		// Try the empty root first.
		const rootInserterItems = getInserterItems( '' );
		if ( rootInserterItems.length ) {
			return [ rootInserterItems ];
		}

		const postContentBlock = getBlocksByName( 'core/post-content' );

		if ( postContentBlock.length ) {
			return [ getInserterItems( postContentBlock[ 0 ] ) ];
		}

		// Failsafe
		return [ [] ];
	}, [] );

	const [ items ] = useSelect(
		( select ) => [
			select( blockEditorStore ).getInserterItems( rootClientId ),
		],
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

	return [ allItems, items, categories, collections, onSelectItem ];
};

export default useBlockTypesState;
