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
		let availableItems = select( blockEditorStore ).getInserterItems( '' );

		// use current selection as root for situations like
		// template locked mode
		const rootBlocks = select( blockEditorStore ).getBlocks();
		while ( availableItems.length === 0 ) {
			for ( const block of rootBlocks ) {
				availableItems = select( blockEditorStore ).getInserterItems(
					block.clientId
				);
				if ( availableItems.length ) {
					break;
				}
			}
		}
		return [ availableItems ];
	} );

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
