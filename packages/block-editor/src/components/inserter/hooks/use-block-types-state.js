import {
	getBlockType,
	createBlock,
	createBlocksFromInnerBlocksTemplate,
	store as blocksStore,
	parse,
} from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
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
	const { getClosestAllowedInsertionPoint } = unlock(
		useSelect( blockEditorStore )
	);
	const { createErrorNotice } = useDispatch( noticesStore );

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

			let insertedBlock;
			if ( syncStatus === 'unsynced' ) {
				if ( name === 'core/block' && initialAttributes?.ref ) {
					insertedBlock = [ unsyncedFallbackBlock ];
				} else if ( unsyncedBlocks.length ) {
					insertedBlock = unsyncedBlocks;
				} else {
					insertedBlock = [ unsyncedFallbackBlock ];
				}
			} else {
				insertedBlock = createBlock(
					name,
					initialAttributes,
					createBlocksFromInnerBlocksTemplate( innerBlocks ),
					innerContent
				);
			}
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
		]
	);

	return [ items, categories, collections, onSelectItem ];
};

export default useBlockTypesState;
