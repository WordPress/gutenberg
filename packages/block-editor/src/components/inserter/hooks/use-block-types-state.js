/**
 * WordPress dependencies
 */
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

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { isFiltered } from '../../../store/utils';
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
	const { getClosestAllowedInsertionPoint } = unlock(
		useSelect( blockEditorStore )
	);
	const { createErrorNotice } = useDispatch( noticesStore );

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
