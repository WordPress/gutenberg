import {
	getBlockType,
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
	parse,
} from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { __, sprintf } from '@wordpress/i18n';
import { store as blockEditorStore } from '../../../store';
import { isFiltered } from '../../../store/utils';
import { unlock } from '../../../lock-unlock';

/**
 * Returns unsynced pattern blocks in a shape the insertion action can accept.
 *
 * @param {Object[]} blocks             Parsed unsynced pattern blocks.
 * @param {string}   rootClientId       Insertion root client ID.
 * @param {Function} canInsertBlockType Selector that checks whether a block can be inserted.
 *
 * @return {Object[]} Insertable blocks.
 */
export const getInsertableUnsyncedBlocks = (
	blocks,
	rootClientId,
	canInsertBlockType
) => {
	return blocks.map( ( block ) => {
		if ( canInsertBlockType?.( block.name, rootClientId ) ) {
			return block;
		}

		const { parent } = getBlockType( block.name ) ?? {};
		const parentName = parent?.length === 1 ? parent[ 0 ] : undefined;

		if (
			parentName &&
			( ! canInsertBlockType ||
				canInsertBlockType( parentName, rootClientId ) )
		) {
			return createBlock( parentName, {}, [ block ] );
		}

		return block;
	} );
};
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
		() => ( { [ isFiltered ]: !! isQuick } ),
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
	const selectors = useSelect( blockEditorStore );
	const { getClosestAllowedInsertionPoint } = unlock( selectors );
	const { canInsertBlockType } = selectors;
	const { createErrorNotice } = useDispatch( noticesStore );

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
			const destinationClientId = getClosestAllowedInsertionPoint(
				name,
				rootClientId
			);
			if ( destinationClientId === null ) {
				const title = getBlockType( name )?.title ?? name;
				createErrorNotice(
					sprintf(
						/* translators: %s: block pattern title. */
						__( 'Block "%s" can\'t be inserted.' ),
						title
					),
					{
						type: 'snackbar',
						id: 'inserter-notice',
					}
				);
				return;
			}

			const unsyncedFallbackBlock = createBlock(
				name,
				initialAttributes
			);

			const unsyncedBlocks = parse( content, {
				__unstableSkipMigrationLogs: true,
			} );

			const insertedBlock =
				syncStatus === 'unsynced'
					? name === 'core/block' && initialAttributes?.ref
						? [ unsyncedFallbackBlock ]
						: getInsertableUnsyncedBlocks(
								unsyncedBlocks.length
									? unsyncedBlocks
									: [ unsyncedFallbackBlock ],
								destinationClientId,
								canInsertBlockType
						  )
					: createBlock(
							name,
							initialAttributes,
							createBlocksFromInnerBlocksTemplate( innerBlocks ),
							innerContent
					  );
			onInsert(
				insertedBlock,
				undefined,
				shouldFocusBlock,
				destinationClientId
			);
		},
		[
			getClosestAllowedInsertionPoint,
			rootClientId,
			onInsert,
			createErrorNotice,
			canInsertBlockType,
		]
	);

	return [ items, categories, collections, onSelectItem ];
};

export default useBlockTypesState;
