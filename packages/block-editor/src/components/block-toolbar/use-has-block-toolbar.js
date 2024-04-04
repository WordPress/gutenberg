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
	return useSelect( ( select ) => {
		const { getBlockName, getSelectedBlockClientIds } =
			select( blockEditorStore );

		const selectedBlockClientIds = getSelectedBlockClientIds();
		const selectedBlockClientId = selectedBlockClientIds[ 0 ];
		const blockType =
			selectedBlockClientId &&
			getBlockType( getBlockName( selectedBlockClientId ) );
		const isToolbarEnabled =
			blockType &&
			hasBlockSupport( blockType, '__experimentalToolbar', true );

		return isToolbarEnabled;
	}, [] );
}
