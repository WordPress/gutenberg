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

		// A named container inside a pattern is disabled so that its design
		// stays locked, but it is selectable in List View and its toolbar is
		// how the group is reordered among its siblings. The toolbar carries
		// no design controls in a non-default editing mode, so it amounts to
		// the block icon plus the mover.
		return (
			blockType &&
			hasBlockSupport( blockType, '__experimentalToolbar', true ) &&
			( getBlockEditingMode( selectedBlockClientId ) !== 'disabled' ||
				isContentGroupBlock( selectedBlockClientId ) )
		);
	}, [] );

	return enabled;
}
