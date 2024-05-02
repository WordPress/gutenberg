/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { useHasAnyBlockControls } from '../block-controls/use-has-block-controls';

/**
 * Returns true if the block toolbar should be shown.
 *
 * @return {boolean} Whether the block toolbar component will be rendered.
 */
export function useHasBlockToolbar() {
	const { isToolbarEnabled, isDefaultEditingMode } = useSelect(
		( select ) => {
			const {
				getBlockEditingMode,
				getBlockName,
				getBlockSelectionStart,
			} = select( blockEditorStore );

			// we only care about the 1st selected block
			// for the toolbar, so we use getBlockSelectionStart
			// instead of getSelectedBlockClientIds
			const selectedBlockClientId = getBlockSelectionStart();

			const blockType =
				selectedBlockClientId &&
				getBlockType( getBlockName( selectedBlockClientId ) );

			return {
				isToolbarEnabled:
					blockType &&
					hasBlockSupport( blockType, '__experimentalToolbar', true ),
				isDefaultEditingMode:
					getBlockEditingMode( selectedBlockClientId ) === 'default',
			};
		},
		[]
	);

	const hasAnyBlockControls = useHasAnyBlockControls();

	if (
		! isToolbarEnabled ||
		( ! isDefaultEditingMode && ! hasAnyBlockControls )
	) {
		return false;
	}

	return true;
}
