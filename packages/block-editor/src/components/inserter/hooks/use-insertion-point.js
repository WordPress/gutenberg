/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useRef } from '@wordpress/element';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { _n } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

/**
 * @typedef WPInserterConfig
 *
 * @property {string=} rootClientId        Inserter Root Client ID.
 * @property {string=} clientId            Inserter Client ID.
 * @property {boolean} isAppender          Whether the inserter is an appender or not.
 * @property {boolean} selectBlockOnInsert Whether the block should be selected on insert.
 */

/**
 * Returns the insertion point state given the inserter config.
 *
 * @param {WPInserterConfig} config Inserter Config.
 * @return {Array} Insertion Point State (rootClientID, onInsertBlocks and onToggle).
 */
function useInsertionPoint( {
	onSelect,
	rootClientId,
	clientId,
	isAppender,
	selectBlockOnInsert,
} ) {
	const {
		destinationRootClientId,
		getSelectedBlock,
		getBlockIndex,
		getBlockSelectionEnd,
		getBlockOrder,
	} = useSelect(
		( select ) => {
			const {
				getSettings,
				getBlockRootClientId,
				getBlockSelectionEnd: _getBlockSelectionEnd,
			} = select( 'core/block-editor' );

			let destRootClientId = rootClientId;
			if ( ! destRootClientId && ! clientId && ! isAppender ) {
				const end = _getBlockSelectionEnd();
				if ( end ) {
					destRootClientId = getBlockRootClientId( end );
				}
			}
			return {
				hasPatterns: !! getSettings().__experimentalBlockPatterns
					?.length,
				destinationRootClientId: destRootClientId,
				...pick( select( 'core/block-editor' ), [
					'getSelectedBlock',
					'getBlockIndex',
					'getBlockSelectionEnd',
					'getBlockOrder',
				] ),
			};
		},
		[ isAppender, clientId, rootClientId ]
	);
	const { replaceBlocks, insertBlocks } = useDispatch( 'core/block-editor' );

	function getInsertionIndex() {
		// If the clientId is defined, we insert at the position of the block.
		if ( clientId ) {
			return getBlockIndex( clientId, destinationRootClientId );
		}

		// If there a selected block, we insert after the selected block.
		const end = getBlockSelectionEnd();
		if ( ! isAppender && end ) {
			return getBlockIndex( end, destinationRootClientId ) + 1;
		}

		// Otherwise, we insert at the end of the current rootClientId
		return getBlockOrder( destinationRootClientId ).length;
	}

	const onInsertBlocks = ( blocks, meta ) => {
		const selectedBlock = getSelectedBlock();
		if (
			! isAppender &&
			selectedBlock &&
			isUnmodifiedDefaultBlock( selectedBlock )
		) {
			replaceBlocks( selectedBlock.clientId, blocks, null, null, meta );
		} else {
			insertBlocks(
				blocks,
				getInsertionIndex(),
				destinationRootClientId,
				selectBlockOnInsert,
				meta
			);
		}

		if ( ! selectBlockOnInsert ) {
			// translators: %d: the name of the block that has been added
			const message = _n(
				'%d block added.',
				'%d blocks added.',
				blocks.length
			);
			speak( message );
		}

		if ( onSelect ) {
			onSelect();
		}
	};

	const memoizedShowInsertionPoint = useMemoizedToggleInsertionPoint(
		destinationRootClientId
	);

	const onToggleInsertionPoint = useCallback(
		( show ) => {
			const index = getInsertionIndex();
			memoizedShowInsertionPoint( show, index );
		},
		[ destinationRootClientId ]
	);

	return [ destinationRootClientId, onInsertBlocks, onToggleInsertionPoint ];
}

/**
 * Temporary work around.
 *
 * Ensures that the showInsertionPoint and hideInsertionPoint actions are only
 * called when the destinationRootClientId or index changes.
 * Otherwise, the store data will update for every mouse hover interaction.
 *
 * @param {string?} destinationRootClientId
 */
const useMemoizedToggleInsertionPoint = ( destinationRootClientId ) => {
	const { showInsertionPoint, hideInsertionPoint } = useDispatch(
		'core/block-editor'
	);

	const destinationRef = useRef( destinationRootClientId );
	const indexRef = useRef();

	return useCallback(
		( show, index ) => {
			if (
				destinationRef.current === destinationRootClientId &&
				indexRef.current === index
			) {
				return;
			}

			destinationRef.current = destinationRootClientId;
			indexRef.current = index;

			if ( show ) {
				showInsertionPoint( destinationRootClientId, index );
			} else {
				hideInsertionPoint();
			}
		},
		[ destinationRootClientId ]
	);
};

export default useInsertionPoint;
