/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { _n } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

/**
 * @typedef WPInserterConfig
 *
 * @property {string=}   rootClientId        Inserter Root Client ID.
 * @property {string=} clientId            Inserter Client ID.
 * @property {boolean}   isAppender          Whether the inserter is an appender or not.
 * @property {boolean}   selectBlockOnInsert Whether the block should be selected on insert.
 */

/**
 * Returns the insertion point state given the inserter config.
 *
 * @param {WPInserterConfig} config Inserter Config.
 * @return {Array} Insertion Point State (rootClientID, onInsertBlocks and onToggle).
 */
function useInsertionPoint( {
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
					destRootClientId = getBlockRootClientId( end ) || undefined;
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
	const {
		replaceBlocks,
		insertBlocks,
		showInsertionPoint,
		hideInsertionPoint,
	} = useDispatch( 'core/block-editor' );

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

	const onInsertBlocks = ( blocks ) => {
		const selectedBlock = getSelectedBlock();
		if (
			! isAppender &&
			selectedBlock &&
			isUnmodifiedDefaultBlock( selectedBlock )
		) {
			replaceBlocks( selectedBlock.clientId, blocks );
		} else {
			insertBlocks(
				blocks,
				getInsertionIndex(),
				destinationRootClientId,
				selectBlockOnInsert
			);
		}

		if ( ! selectBlockOnInsert ) {
			// translators: %d: the name of the block that has been added
			const message = _n(
				'%d block added.',
				'%d blocks added',
				blocks.length
			);
			speak( message );
		}
	};

	const onToggleInsertionPoint = ( show ) => {
		if ( show ) {
			const index = getInsertionIndex();
			showInsertionPoint( destinationRootClientId, index );
		} else {
			hideInsertionPoint();
		}
	};

	return [ destinationRootClientId, onInsertBlocks, onToggleInsertionPoint ];
}

export default useInsertionPoint;
