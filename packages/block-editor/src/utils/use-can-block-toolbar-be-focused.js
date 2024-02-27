/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';

/**
 * Returns true if the block toolbar should be able to receive focus.
 *
 * @return {boolean} Whether the block toolbar should be able to receive focus
 */
export function useCanBlockToolbarBeFocused() {
	return useSelect( ( select ) => {
		const {
			__unstableGetEditorMode,
			getBlock,
			getSettings,
			getSelectedBlockClientId,
			getFirstMultiSelectedBlockClientId,
		} = unlock( select( blockEditorStore ) );

		const selectedBlockId =
			getFirstMultiSelectedBlockClientId() || getSelectedBlockClientId();
		const isEmptyDefaultBlock = isUnmodifiedDefaultBlock(
			getBlock( selectedBlockId ) || {}
		);

		// Fixed Toolbar can be focused when:
		// - a block is selected
		// - fixed toolbar is on
		// Block Toolbar Popover can be focused when:
		// - a block is selected
		// - we are in edit mode
		// - it is not an empty default block
		return (
			!! selectedBlockId &&
			( getSettings().hasFixedToolbar ||
				( __unstableGetEditorMode() === 'edit' &&
					! isEmptyDefaultBlock ) )
		);
	}, [] );
}
