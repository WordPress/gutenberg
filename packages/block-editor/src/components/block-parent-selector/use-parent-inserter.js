import { useSelect } from '@wordpress/data';
import { canAppendBlocks } from '../block-appender-button/can-append';
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
		return {
			parentClientId,
			nextSiblingClientId: getNextBlockClientId( selectedBlockClientId ),
			// The same rule as the add button in the parent's own
			// toolbar, so both appear and disappear together.
			showInserter:
				!! parentClientId &&
				parentClientId === immediateParentClientId &&
				canAppendBlocks( select, parentClientId ),
		};
	}, [] );
}
