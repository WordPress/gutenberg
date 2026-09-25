import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { getBlockType, isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { speak } from '@wordpress/a11y';
import { useCallback } from '@wordpress/element';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

function getIndex( {
	destinationRootClientId,
	destinationIndex,
	rootClientId,
	registry,
} ) {
	if ( rootClientId === destinationRootClientId ) {
		return destinationIndex;
	}
	const parents = [
		'',
		...registry
			.select( blockEditorStore )
			.getBlockParents( destinationRootClientId ),
		destinationRootClientId,
	];
	const parentIndex = parents.indexOf( rootClientId );
	if ( parentIndex !== -1 ) {
		return (
			registry
				.select( blockEditorStore )
				.getBlockIndex( parents[ parentIndex + 1 ] ) + 1
		);
	}
	return registry.select( blockEditorStore ).getBlockOrder( rootClientId )
		.length;
}

/**
 * Resolves where an insertion from this inserter lands.
 *
 * @param {Object}   selectors             Unlocked `core/block-editor` selectors.
 * @param {Object}   config                Inserter config.
 * @param {string}   config.rootClientId   Root the inserter belongs to.
 * @param {number=}  config.insertionIndex Explicit index to insert at.
 * @param {string=}  config.clientId       Block to insert after.
 * @param {boolean=} config.isAppender     Whether the inserter is an appender.
 * @return {{ destinationRootClientId: string, destinationIndex: number }} Destination.
 */
function getDestination(
	selectors,
	{ rootClientId, insertionIndex, clientId, isAppender }
) {
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
 * @typedef WPInserterConfig
 *
 * @property {string=}   rootClientId   If set, insertion will be into the
 *                                      block with this ID.
 * @property {number=}   insertionIndex If set, insertion will be into this
 *                                      explicit position.
 * @property {string=}   clientId       If set, insertion will be after the
 *                                      block with this ID.
 * @property {boolean=}  isAppender     Whether the inserter is an appender
 *                                      or not.
 * @property {Function=} onSelect       Called after insertion.
 */

/**
 * Returns the insertion point state given the inserter config.
 *
 * @param {WPInserterConfig} config Inserter Config.
 * @return {Array} Insertion Point State (rootClientID, onInsertBlocks and onToggle).
 */
function useInsertionPoint( {
	rootClientId = '',
	insertionIndex,
	clientId,
	isAppender,
	onSelect,
	shouldFocusBlock = true,
	selectBlockOnInsert = true,
} ) {
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

	const onInsertBlocks = useCallback(
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
				).map( ( block ) => block.name );
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
				// translators: %d: the name of the block that has been added
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
		( item ) => {
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
