import { useSelect } from '@wordpress/data';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Returns true if the block toolbar should be shown.
 *
 * @return {boolean} Whether the block toolbar component will be rendered.
 */
export function useHasBlockToolbar() {
	const enabled = useSelect( ( select ) => {
		const {
			getBlockEditingMode,
			getBlockName,
			getBlockSelectionStart,
			isContentGroupBlock,
		} = unlock( select( blockEditorStore ) );

		// we only care about the 1st selected block
		// for the toolbar, so we use getBlockSelectionStart
		// instead of getSelectedBlockClientIds
		const selectedBlockClientId = getBlockSelectionStart();

		const blockType =
			selectedBlockClientId &&
			getBlockType( getBlockName( selectedBlockClientId ) );

		// A group in a pattern is disabled so its design stays locked, but its
		// toolbar is how it's reordered. Without the default editing mode, the
		// toolbar has no design controls.
		return (
			blockType &&
			hasBlockSupport( blockType, '__experimentalToolbar', true ) &&
			( getBlockEditingMode( selectedBlockClientId ) !== 'disabled' ||
				isContentGroupBlock( selectedBlockClientId ) )
		);
	}, [] );

	return enabled;
}
