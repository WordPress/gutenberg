/**
 * WordPress dependencies
 */
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { _n, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
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
		isBlockInsertionPointVisible,
	} = unlock( useSelect( blockEditorStore ) );
	const { destinationRootClientId, destinationIndex } = useSelect(
		( select ) => {
			const {
				getSelectedBlockClientId,
				getBlockRootClientId,
				getBlockIndex,
				getBlockOrder,
				getInsertionPoint,
			} = unlock( select( blockEditorStore ) );
			const selectedBlockClientId = getSelectedBlockClientId();
			let _destinationRootClientId = rootClientId;
			let _destinationIndex;
			const insertionPoint = getInsertionPoint();

			if ( insertionIndex !== undefined ) {
				// Insert into a specific index.
				_destinationIndex = insertionIndex;
			} else if (
				insertionPoint &&
				insertionPoint.hasOwnProperty( 'index' )
			) {
				_destinationRootClientId = insertionPoint?.rootClientId
					? insertionPoint.rootClientId
					: rootClientId;
				_destinationIndex = insertionPoint.index;
			} else if ( clientId ) {
				// Insert after a specific client ID.
				_destinationIndex = getBlockIndex( clientId );
			} else if ( ! isAppender && selectedBlockClientId ) {
				_destinationRootClientId = getBlockRootClientId(
					selectedBlockClientId
				);
				_destinationIndex = getBlockIndex( selectedBlockClientId ) + 1;
			} else {
				// Insert at the end of the list.
				_destinationIndex = getBlockOrder(
					_destinationRootClientId
				).length;
			}

			return {
				destinationRootClientId: _destinationRootClientId,
				destinationIndex: _destinationIndex,
			};
		},
		[ rootClientId, insertionIndex, clientId, isAppender ]
	);

	const {
		replaceBlocks,
		insertBlocks,
		showInsertionPoint,
		hideInsertionPoint,
		setLastFocus,
	} = unlock( useDispatch( blockEditorStore ) );

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

			const selectedBlock = getSelectedBlock();

			if (
				! isAppender &&
				selectedBlock &&
				isUnmodifiedDefaultBlock( selectedBlock )
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
					isAppender || _rootClientId === undefined
						? destinationIndex
						: getIndex( {
								destinationRootClientId,
								destinationIndex,
								rootClientId: _rootClientId,
								registry,
						  } ),
					isAppender || _rootClientId === undefined
						? destinationRootClientId
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
			isAppender,
			getSelectedBlock,
			replaceBlocks,
			insertBlocks,
			destinationRootClientId,
			destinationIndex,
			onSelect,
			shouldFocusBlock,
			selectBlockOnInsert,
		]
	);

	const onToggleInsertionPoint = useCallback(
		( item ) => {
			if ( item && ! isBlockInsertionPointVisible() ) {
				const allowedDestinationRootClientId =
					getClosestAllowedInsertionPoint(
						item.name,
						destinationRootClientId
					);
				if ( allowedDestinationRootClientId !== null ) {
					showInsertionPoint(
						allowedDestinationRootClientId,
						getIndex( {
							destinationRootClientId,
							destinationIndex,
							rootClientId: allowedDestinationRootClientId,
							registry,
						} )
					);
				}
			} else {
				hideInsertionPoint();
			}
		},
		[
			getClosestAllowedInsertionPoint,
			isBlockInsertionPointVisible,
			showInsertionPoint,
			hideInsertionPoint,
			destinationRootClientId,
			destinationIndex,
		]
	);

	return [ destinationRootClientId, onInsertBlocks, onToggleInsertionPoint ];
}

export default useInsertionPoint;
