/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	getBlockType,
	hasBlockSupport,
	isUnmodifiedDefaultBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
import { useHasAnyBlockControls } from '../components/block-controls/use-has-block-controls';

/**
 * Returns true if the block toolbar should be able to receive focus.
 *
 * @return {boolean} Whether the block toolbar should be able to receive focus
 */
export function useCanBlockToolbarBeFocused() {
	const hasAnyBlockControls = useHasAnyBlockControls();

	const { isToolbarEnabled, isDefaultEditingMode, maybeShowBlockToolbar } =
		useSelect( ( select ) => {
			const {
				__unstableGetEditorMode,
				getBlock,
				getBlockName,
				getBlockEditingMode,
				getSettings,
				getSelectedBlockClientId,
				getFirstMultiSelectedBlockClientId,
			} = unlock( select( blockEditorStore ) );

			const selectedBlockId =
				getFirstMultiSelectedBlockClientId() ||
				getSelectedBlockClientId();
			const isEmptyDefaultBlock = isUnmodifiedDefaultBlock(
				getBlock( selectedBlockId ) || {}
			);
			const blockType =
				selectedBlockId &&
				getBlockType( getBlockName( selectedBlockId ) );

			// Fixed Toolbar can be focused when:
			// - a block is selected
			// - the block has tools
			// - fixed toolbar is on
			// Block Toolbar Popover can be focused when:
			// - a block is selected
			// - the block has tools
			// - we are in edit mode
			// - it is not an empty default block
			return {
				isToolbarEnabled:
					blockType &&
					hasBlockSupport( blockType, '__experimentalToolbar', true ),
				isDefaultEditingMode:
					getBlockEditingMode( selectedBlockId ) === 'default',
				maybeShowBlockToolbar:
					getSettings().hasFixedToolbar ||
					( __unstableGetEditorMode() === 'edit' &&
						! isEmptyDefaultBlock ),
			};
		}, [] );

	// The same check used in <BlockToolbar /> to see if it should return null.
	// Should we combine these into their own hook so they stay consistent?
	const noBlockToolbar =
		! isToolbarEnabled ||
		( ! isDefaultEditingMode && ! hasAnyBlockControls );

	return ! noBlockToolbar && maybeShowBlockToolbar;
}
