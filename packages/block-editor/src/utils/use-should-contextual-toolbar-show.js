/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';

/**
 * Returns true if the contextual block toolbar should show, or false if it should be hidden.
 *
 * @param {string} clientId The client ID of the block.
 *
 * @return {boolean} Whether the block toolbar is hidden.
 */
export function useShouldContextualToolbarShow( clientId ) {
	const isLargeViewport = useViewportMatch( 'medium' );

	const { shouldShowContextualToolbar, canFocusHiddenToolbar } = useSelect(
		( select ) => {
			const {
				__unstableGetEditorMode,
				isMultiSelecting,
				isTyping,
				isBlockInterfaceHidden,
				getBlock,
				getSettings,
				isNavigationMode,
			} = unlock( select( blockEditorStore ) );

			const isEditMode = __unstableGetEditorMode() === 'edit';
			const hasFixedToolbar = getSettings().hasFixedToolbar;
			const isDistractionFree = getSettings().isDistractionFree;
			const hasClientId = !! clientId;
			const isEmptyDefaultBlock = isUnmodifiedDefaultBlock(
				getBlock( clientId ) || {}
			);

			const _shouldShowContextualToolbar =
				isEditMode &&
				! hasFixedToolbar &&
				( ! isDistractionFree || isNavigationMode() ) &&
				isLargeViewport &&
				! isMultiSelecting() &&
				! isTyping() &&
				hasClientId &&
				! isEmptyDefaultBlock &&
				! isBlockInterfaceHidden();

			const _canFocusHiddenToolbar =
				isEditMode &&
				hasClientId &&
				! _shouldShowContextualToolbar &&
				! hasFixedToolbar &&
				! isDistractionFree &&
				! isEmptyDefaultBlock;

			return {
				shouldShowContextualToolbar: _shouldShowContextualToolbar,
				canFocusHiddenToolbar: _canFocusHiddenToolbar,
			};
		},
		[ clientId, isLargeViewport ]
	);

	return {
		shouldShowContextualToolbar,
		canFocusHiddenToolbar,
	};
}
