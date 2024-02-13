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
 * Returns true if the block toolbar will be shown.
 *
 * @return {boolean} Whether the block toolbar component will be rendered.
 */
export function useHasBlockToolbar() {
	const { isDefaultEditingMode, isToolbarEnabled } = useSelect(
		( select ) => {
			const {
				getBlockEditingMode,
				getBlockName,
				getSelectedBlockClientIds,
			} = select( blockEditorStore );

			const selectedBlockClientIds = getSelectedBlockClientIds();
			const selectedBlockClientId = selectedBlockClientIds[ 0 ];
			const _isDefaultEditingMode =
				getBlockEditingMode( selectedBlockClientId ) === 'default';
			const blockType =
				selectedBlockClientId &&
				getBlockType( getBlockName( selectedBlockClientId ) );

			return {
				isDefaultEditingMode: _isDefaultEditingMode,
				isToolbarEnabled:
					blockType &&
					hasBlockSupport( blockType, '__experimentalToolbar', true ),
			};
		}
	);
	const hasAnyBlockControls = useHasAnyBlockControls();

	return isToolbarEnabled || ( isDefaultEditingMode && hasAnyBlockControls );
}
