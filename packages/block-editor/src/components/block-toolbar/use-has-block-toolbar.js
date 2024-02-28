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
	const hasAnyBlockControls = useHasAnyBlockControls();
	return useSelect(
		( select ) => {
			const {
				getBlockEditingMode,
				getBlockName,
				getBlockSelectionStart,
			} = select( blockEditorStore );

			const selectedBlockClientId = getBlockSelectionStart();
			const isDefaultEditingMode =
				getBlockEditingMode( selectedBlockClientId ) === 'default';
			const blockType =
				selectedBlockClientId &&
				getBlockType( getBlockName( selectedBlockClientId ) );
			const isToolbarEnabled =
				blockType &&
				hasBlockSupport( blockType, '__experimentalToolbar', true );

			if (
				! isToolbarEnabled ||
				( ! isDefaultEditingMode && ! hasAnyBlockControls )
			) {
				return false;
			}

			return true;
		},
		[ hasAnyBlockControls ]
	);
}
