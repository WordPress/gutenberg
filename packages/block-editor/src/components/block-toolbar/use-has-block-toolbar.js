/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/**
 * Returns true if the block toolbar should be shown.
 *
 * @return {boolean} Whether the block toolbar component will be rendered.
 */
export function useHasBlockToolbar() {
	const { isToolbarEnabled, isBlockDisabled } = useSelect( ( select ) => {
		const { getBlockEditingMode, getBlockName, getBlockSelectionStart } =
			select( blockEditorStore );

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
			isBlockDisabled:
				getBlockEditingMode( selectedBlockClientId ) === 'disabled',
		};
	}, [] );

	if ( ! isToolbarEnabled || isBlockDisabled ) {
		return false;
	}

	return true;
}
