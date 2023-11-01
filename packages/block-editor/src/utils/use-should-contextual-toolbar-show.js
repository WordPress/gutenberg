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
 * @return {boolean} Whether the block toolbar is hidden.
 */
export function useShouldContextualToolbarShow() {
	const isLargeViewport = useViewportMatch( 'medium' );

	const {
		shouldShowContextualToolbar,
		canFocusHiddenToolbar,
		fixedToolbarCanBeFocused,
	} = useSelect(
		( select ) => {
			const {
				__unstableGetEditorMode,
				isMultiSelecting,
				isTyping,
				isBlockInterfaceHidden,
				getBlock,
				getSettings,
				isNavigationMode,
				getSelectedBlockClientId,
				getFirstMultiSelectedBlockClientId,
			} = unlock( select( blockEditorStore ) );

			const isEditMode = __unstableGetEditorMode() === 'edit';
			const hasFixedToolbar = getSettings().hasFixedToolbar;
			const isDistractionFree = getSettings().isDistractionFree;
			const selectedBlockId =
				getFirstMultiSelectedBlockClientId() ||
				getSelectedBlockClientId();
			const hasSelectedBlockId = !! selectedBlockId;
			const isEmptyDefaultBlock = isUnmodifiedDefaultBlock(
				getBlock( selectedBlockId ) || {}
			);

			const _shouldShowContextualToolbar =
				isEditMode &&
				! hasFixedToolbar &&
				( ! isDistractionFree || isNavigationMode() ) &&
				isLargeViewport &&
				! isMultiSelecting() &&
				! isTyping() &&
				hasSelectedBlockId &&
				! isEmptyDefaultBlock &&
				! isBlockInterfaceHidden();

			const _canFocusHiddenToolbar =
				isEditMode &&
				hasSelectedBlockId &&
				! _shouldShowContextualToolbar &&
				! hasFixedToolbar &&
				! isDistractionFree &&
				! isEmptyDefaultBlock;

			return {
				shouldShowContextualToolbar: _shouldShowContextualToolbar,
				canFocusHiddenToolbar: _canFocusHiddenToolbar,
				fixedToolbarCanBeFocused:
					( hasFixedToolbar || ! isLargeViewport ) && selectedBlockId,
			};
		},
		[ isLargeViewport ]
	);

	return {
		shouldShowContextualToolbar,
		canFocusHiddenToolbar,
		fixedToolbarCanBeFocused,
	};
}
