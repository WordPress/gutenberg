import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { getBlockType, isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { speak } from '@wordpress/a11y';
import { useCallback } from '@wordpress/element';
import type { Block } from '@wordpress/blocks';
import type { DataRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import type { BlockEditorThunkArgs, InserterItem } from '../../../store/types';
import type { InserterConfig, InsertBlocks } from '../types';

interface Destination {
	destinationRootClientId: string | null | undefined;
	/** The insertion point index, which an unset insertion point lacks. */
	destinationIndex: number | undefined;
}

function getIndex( {
	destinationRootClientId,
	destinationIndex,
	rootClientId,
	registry,
}: Destination & {
	rootClientId: string | null | undefined;
	registry: DataRegistry;
} ): number | undefined {
	if ( rootClientId === destinationRootClientId ) {
		return destinationIndex;
	}
	const parents = [
		'',
		...registry
			.select( blockEditorStore )
			// A missing root has no parents.
			.getBlockParents( destinationRootClientId as string ),
		destinationRootClientId,
	];
	const parentIndex = parents.indexOf( rootClientId );
	if ( parentIndex !== -1 ) {
		return (
			registry
				.select( blockEditorStore )
				// The root is below a parent, so a block follows it in the list.
				.getBlockIndex( parents[ parentIndex + 1 ] as string ) + 1
		);
	}
	return registry.select( blockEditorStore ).getBlockOrder( rootClientId )
		.length;
}

/**
 * Resolves where an insertion from this inserter lands.
 *
 * @param selectors             Unlocked `core/block-editor` selectors.
 * @param config                Inserter config.
 * @param config.rootClientId   Root the inserter belongs to.
 * @param config.insertionIndex Explicit index to insert at.
 * @param config.clientId       Block to insert after.
 * @param config.isAppender     Whether the inserter is an appender.
 * @return Destination.
 */
function getDestination(
	selectors: BlockEditorThunkArgs[ 'select' ],
	{
		rootClientId,
		insertionIndex,
		clientId,
		isAppender,
	}: Pick<
		InserterConfig,
		'rootClientId' | 'insertionIndex' | 'clientId' | 'isAppender'
	>
): Destination {
	const {
		getSelectedBlockClientId,
		getBlockRootClientId,
		getBlockIndex,
		getBlockOrder,
		getInsertionPoint,
	} = selectors;
	const selectedBlockClientId = getSelectedBlockClientId();
	let destinationRootClientId = rootClientId;
	let destinationIndex;
	const insertionPoint = getInsertionPoint();

	if ( insertionIndex !== undefined ) {
		// Insert into a specific index.
		destinationIndex = insertionIndex;
	} else if ( insertionPoint && insertionPoint.hasOwnProperty( 'index' ) ) {
		destinationRootClientId = insertionPoint?.rootClientId
			? insertionPoint.rootClientId
			: rootClientId;
		destinationIndex = insertionPoint.index;
	} else if ( clientId ) {
		// Insert after a specific client ID.
		destinationIndex = getBlockIndex( clientId );
	} else if ( ! isAppender && selectedBlockClientId ) {
		destinationRootClientId = getBlockRootClientId( selectedBlockClientId );
		destinationIndex = getBlockIndex( selectedBlockClientId ) + 1;
	} else {
		// Insert at the end of the list.
		destinationIndex = getBlockOrder( destinationRootClientId ).length;
	}

	return { destinationRootClientId, destinationIndex };
}

/**
 * Returns the insertion point state given the inserter config.
 *
 * @param config                     Inserter Config.
 * @param config.rootClientId        If set, insertion will be into the block with this ID.
 * @param config.insertionIndex      If set, insertion will be into this explicit position.
 * @param config.clientId            If set, insertion will be after the block with this ID.
 * @param config.isAppender          Whether the inserter is an appender or not.
 * @param config.onSelect            Called after insertion.
 * @param config.shouldFocusBlock    Whether to focus the inserted block.
 * @param config.selectBlockOnInsert Whether to select the inserted block.
 * @return Insertion Point State (rootClientID, onInsertBlocks and onToggle).
 */
function useInsertionPoint( {
	rootClientId = '',
	insertionIndex,
	clientId,
	isAppender,
	onSelect,
	shouldFocusBlock = true,
	selectBlockOnInsert = true,
}: InserterConfig ): [
	string | null | undefined,
	InsertBlocks,
	( item: InserterItem | null ) => void,
] {
	const registry = useRegistry();
	const {
		getSelectedBlock,
		getClosestAllowedInsertionPoint,
		getBlockInsertionPoint,
	} = unlock( useSelect( blockEditorStore ) );
	const { destinationRootClientId } = useSelect(
		( select ) =>
			getDestination( unlock( select( blockEditorStore ) ), {
				rootClientId,
				insertionIndex,
				clientId,
				isAppender,
			} ),
		[ rootClientId, insertionIndex, clientId, isAppender ]
	);

	const {
		replaceBlocks,
		insertBlocks,
		showInsertionPoint,
		hideInsertionPoint,
		setLastFocus,
	} = unlock( useDispatch( blockEditorStore ) );
	const { createErrorNotice } = useDispatch( noticesStore );

	const onInsertBlocks: InsertBlocks = useCallback(
		( blocks, meta, shouldForceFocusBlock = false, _rootClientId ) => {
			// When we are trying to move focus or select a new block on insert, we also
			// need to clear the last focus to avoid the focus being set to the wrong block
			// when tabbing back into the canvas if the block was added from outside the
			// editor canvas.
			if (
				shouldForceFocusBlock ||
				shouldFocusBlock ||
				selectBlockOnInsert
			) {
				setLastFocus( null );
			}

			// Resolved at call time: the destination follows the selection, and
			// closing over it would give this callback a new identity per click.
			const destination = getDestination(
				unlock( registry.select( blockEditorStore ) ),
				{ rootClientId, insertionIndex, clientId, isAppender }
			);

			// No root given: use the closest container that accepts the blocks,
			// as the hover cue does.
			if ( _rootClientId === undefined ) {
				const names = (
					Array.isArray( blocks ) ? blocks : [ blocks ]
				).map( ( block: Block ) => block.name );
				_rootClientId = getClosestAllowedInsertionPoint(
					names,
					destination.destinationRootClientId
				);
				if ( _rootClientId === null ) {
					createErrorNotice(
						sprintf(
							/* translators: %s: block title. */
							__( 'Block "%s" can\'t be inserted.' ),
							getBlockType( names[ 0 ] )?.title ?? names[ 0 ]
						),
						{ type: 'snackbar', id: 'inserter-notice' }
					);
					return;
				}
			}

			const selectedBlock = getSelectedBlock();

			if (
				! isAppender &&
				selectedBlock &&
				isUnmodifiedDefaultBlock( selectedBlock, 'content' )
			) {
				replaceBlocks(
					selectedBlock.clientId,
					blocks,
					null,
					shouldFocusBlock || shouldForceFocusBlock ? 0 : null,
					meta
				);
			} else {
				insertBlocks(
					blocks,
					isAppender
						? destination.destinationIndex
						: getIndex( {
								...destination,
								rootClientId: _rootClientId,
								registry,
							} ),
					isAppender
						? destination.destinationRootClientId
						: _rootClientId,
					selectBlockOnInsert,
					shouldFocusBlock || shouldForceFocusBlock ? 0 : null,
					meta
				);
			}
			const blockLength = Array.isArray( blocks ) ? blocks.length : 1;
			const message = sprintf(
				// translators: %d: Number of blocks added.
				_n( '%d block added.', '%d blocks added.', blockLength ),
				blockLength
			);
			speak( message );

			if ( onSelect ) {
				onSelect( blocks );
			}
		},
		[
			rootClientId,
			insertionIndex,
			clientId,
			isAppender,
			getSelectedBlock,
			getClosestAllowedInsertionPoint,
			createErrorNotice,
			replaceBlocks,
			insertBlocks,
			onSelect,
			shouldFocusBlock,
			selectBlockOnInsert,
			setLastFocus,
			registry,
		]
	);

	const onToggleInsertionPoint = useCallback(
		( item: InserterItem | null ) => {
			if ( item ) {
				const destination = getDestination(
					unlock( registry.select( blockEditorStore ) ),
					{ rootClientId, insertionIndex, clientId, isAppender }
				);
				const allowedDestinationRootClientId =
					getClosestAllowedInsertionPoint(
						item.name,
						destination.destinationRootClientId
					);
				if ( allowedDestinationRootClientId !== null ) {
					showInsertionPoint(
						allowedDestinationRootClientId,
						getIndex( {
							...destination,
							rootClientId: allowedDestinationRootClientId,
							registry,
						} )
					);
				}
			} else if ( ! getBlockInsertionPoint()?.__unstableWithInserter ) {
				// The insertion cue is shared state. The in-between inserter
				// marks its own cue with `__unstableWithInserter` and mounts an
				// inserter inside that cue's popover, so hiding that cue here
				// would unmount a UI this inserter does not own.
				// See https://github.com/WordPress/gutenberg/issues/72297.
				hideInsertionPoint();
			}
		},
		[
			rootClientId,
			insertionIndex,
			clientId,
			isAppender,
			getClosestAllowedInsertionPoint,
			getBlockInsertionPoint,
			showInsertionPoint,
			hideInsertionPoint,
			registry,
		]
	);

	return [ destinationRootClientId, onInsertBlocks, onToggleInsertionPoint ];
}

export default useInsertionPoint;
