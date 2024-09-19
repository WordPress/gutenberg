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
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { noFilter } from '../../../store/utils';
import { unlock } from '../../../lock-unlock';

/**
 * Retrieves the block types inserter state.
 *
 * @param {string=}  rootClientId Insertion's root client ID.
 * @param {Function} onInsert     function called when inserter a list of blocks.
 * @param {boolean}  isQuick
 * @return {Array} Returns the block types state. (block types, categories, collections, onSelect handler)
 */
const useBlockTypesState = ( rootClientId, onInsert, isQuick ) => {
	const options = useMemo(
		() => ( { [ noFilter ]: ! isQuick } ),
		[ isQuick ]
	);
	const [ items ] = useSelect(
		( select ) => [
			select( blockEditorStore ).getInserterItems(
				rootClientId,
				options
			),
		],
		[ rootClientId, options ]
	);
	const { getClosestAllowedInsertionPoint } = unlock(
		useSelect( blockEditorStore )
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
			const destinationClientId = getClosestAllowedInsertionPoint(
				name,
				rootClientId
			);
			if ( destinationClientId !== null ) {
				const insertedBlock =
					syncStatus === 'unsynced'
						? parse( content, {
								__unstableSkipMigrationLogs: true,
						  } )
						: createBlock(
								name,
								initialAttributes,
								createBlocksFromInnerBlocksTemplate(
									innerBlocks
								)
						  );
				onInsert(
					insertedBlock,
					undefined,
					shouldFocusBlock,
					destinationClientId
				);
			}
		},
		[ onInsert, getClosestAllowedInsertionPoint, rootClientId ]
	);

	return [ items, categories, collections, onSelectItem ];
};

export default useBlockTypesState;
