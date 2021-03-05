/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import { isReusableBlock, getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../store';

/**
 * Returns the class names used for the different states of the block.
 *
 * @param {string} clientId The block client ID.
 *
 * @return {string} The class names.
 */
export function useBlockClassNames( clientId ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	return useSelect(
		( select ) => {
			const {
				isTyping,
				isBlockBeingDragged,
				isBlockHighlighted,
				isBlockSelected,
				isBlockMultiSelected,
				getBlockName,
				getSettings,
				hasSelectedInnerBlock,
				__experimentalGetActiveBlockIdByBlockNames: getActiveBlockIdByBlockNames,
			} = select( blockEditorStore );
			const {
				focusMode,
				outlineMode,
				__experimentalSpotlightEntityBlocks: spotlightEntityBlocks,
			} = getSettings();
			const isDragging = isBlockBeingDragged( clientId );
			const isSelected = isBlockSelected( clientId );
			const name = getBlockName( clientId );
			const checkDeep = true;
			// "ancestor" is the more appropriate label due to "deep" check
			const isAncestorOfSelectedBlock = hasSelectedInnerBlock(
				clientId,
				checkDeep
			);
			const activeEntityBlockId = getActiveBlockIdByBlockNames(
				spotlightEntityBlocks
			);
			return classnames( 'block-editor-block-list__block', {
				'is-selected': isSelected && ! isDragging,
				'is-highlighted': isBlockHighlighted( clientId ),
				'is-multi-selected': isBlockMultiSelected( clientId ),
				'is-reusable': isReusableBlock( getBlockType( name ) ),
				'is-dragging': isDragging,
				// We only care about this prop when the block is selected
				// Thus to avoid unnecessary rerenders we avoid updating the prop if
				// the block is not selected.
				'is-typing':
					( isSelected || isAncestorOfSelectedBlock ) && isTyping(),
				'is-focused':
					focusMode &&
					isLargeViewport &&
					( isSelected || isAncestorOfSelectedBlock ),
				'is-focus-mode': focusMode && isLargeViewport,
				'is-outline-mode': outlineMode,
				'has-child-selected': isAncestorOfSelectedBlock && ! isDragging,
				'has-active-entity': activeEntityBlockId,
				// Determine if there is an active entity area to spotlight.
				'is-active-entity': activeEntityBlockId === clientId,
			} );
		},
		[ clientId, isLargeViewport ]
	);
}
