import { useSelect } from '@wordpress/data';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * The parent shown by the block parent selector, and whether it offers an
 * inserter to add a block next to the selected one.
 *
 * @return {Object} The parent client ID, the client ID the inserter inserts
 *                  before, and whether the inserter is shown.
 */
export function useParentInserter() {
	return useSelect( ( select ) => {
		const {
			getBlockParents,
			getSelectedBlockClientIds,
			getParentSectionBlock,
			getBlockName,
			getNextBlockClientId,
		} = unlock( select( blockEditorStore ) );
		// Not getSelectedBlockClientId: a text selection crossing into a
		// nested block resolves to the ancestor alone, but its selection
		// start and end differ.
		const [ selectedBlockClientId ] = getSelectedBlockClientIds();
		const parentSection = getParentSectionBlock( selectedBlockClientId );
		const parents = getBlockParents( selectedBlockClientId );
		const immediateParentClientId = parents[ parents.length - 1 ];
		const parentClientId = parentSection ?? immediateParentClientId;
		const parentBlockType = getBlockType( getBlockName( parentClientId ) );
		// A wrapper that merges with the text flow (list, quote) grows
		// by typing: Enter continues it, and users know that. Any
		// other parent gets a plus button to add a child; the Inserter
		// hides itself when nothing is insertable.
		const isTextFlowWrapper =
			parentBlockType?.merge ||
			hasBlockSupport( parentBlockType, '__experimentalOnMerge' );
		return {
			parentClientId,
			nextSiblingClientId: getNextBlockClientId( selectedBlockClientId ),
			// When the shown parent is a section further up the tree
			// rather than the direct parent, its content is locked and
			// nothing can be inserted, so no button.
			showInserter:
				!! parentClientId &&
				parentClientId === immediateParentClientId &&
				! isTextFlowWrapper,
		};
	}, [] );
}
