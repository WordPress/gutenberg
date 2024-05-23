/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { _n, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

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
	const {
		getSelectedBlock,
		getBlockIndex,
		getBlockRootClientId,
		getBlockOrder,
		canInsertBlockType,
	} = useSelect( blockEditorStore );
	const { destinationRootClientId, destinationIndex } = useSelect(
		( select ) => {
			const {
				getSelectedBlockClientId,
				getBlockRootClientId: _getBlockRootClientId,
			} = select( blockEditorStore );
			const selectedBlockClientId = getSelectedBlockClientId();

			let _destinationRootClientId = rootClientId;
			let _destinationIndex;

			if ( insertionIndex !== undefined ) {
				// Insert into a specific index.
				_destinationIndex = insertionIndex;
			} else if ( clientId ) {
				// Insert after a specific client ID.
				_destinationIndex = getBlockIndex( clientId );
			} else if ( ! isAppender && selectedBlockClientId ) {
				_destinationRootClientId = _getBlockRootClientId(
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
				getBlockRootClientId: _getBlockRootClientId,
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
		( blocks, meta, shouldForceFocusBlock = false ) => {
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
				const normalizedBlocks = Array.isArray( blocks )
					? blocks
					: [ blocks ];

				let _destinationIndex = destinationIndex;
				let _destinationRootClientId = destinationRootClientId;
				// Check if it's possible to insert the block in the current location
				const canInsertBlocks = normalizedBlocks.every( ( block ) =>
					canInsertBlockType( block.name, _destinationRootClientId )
				);

				if ( ! canInsertBlocks && normalizedBlocks.length === 1 ) {
					while (
						! canInsertBlockType(
							normalizedBlocks[ 0 ].name,
							_destinationRootClientId
						)
					) {
						_destinationIndex =
							getBlockIndex( _destinationRootClientId ) + 1;
						_destinationRootClientId = getBlockRootClientId(
							_destinationRootClientId
						);
					}
				}

				insertBlocks(
					blocks,
					_destinationIndex,
					_destinationRootClientId,
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
		( show ) => {
			if ( show ) {
				showInsertionPoint( destinationRootClientId, destinationIndex );
			} else {
				hideInsertionPoint();
			}
		},
		[
			showInsertionPoint,
			hideInsertionPoint,
			destinationRootClientId,
			destinationIndex,
		]
	);

	return [ destinationRootClientId, onInsertBlocks, onToggleInsertionPoint ];
}

export default useInsertionPoint;
