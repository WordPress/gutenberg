import { store as blockEditorStore } from '@wordpress/block-editor';
import { moveBlocksToNestedList } from './move-blocks-to-nested-list';
import { getIndentTarget } from './indent-outdent-targets';

/**
 * Indents the selected list items, nesting them under the previous sibling of
 * the given item. Defaults to the first selected item.
 *
 * @param {Object} registry   The data registry.
 * @param {string} [clientId] The list item providing the sibling to nest under.
 *
 * @return {boolean} Whether the items were indented.
 */
export function indentListItems( registry, clientId ) {
	const select = registry.select( blockEditorStore );
	const {
		getBlockRootClientId,
		getSelectedBlockClientIds,
		getSelectionStart,
		getSelectionEnd,
		hasMultiSelection,
		getMultiSelectedBlockClientIds,
	} = select;
	const { selectionChange, multiSelect } =
		registry.dispatch( blockEditorStore );

	const _hasMultiSelection = hasMultiSelection();
	const clientIds = _hasMultiSelection
		? getMultiSelectedBlockClientIds()
		: getSelectedBlockClientIds();

	if ( clientId === undefined ) {
		clientId = clientIds[ 0 ];
	}

	const previousSiblingId = getIndentTarget( select, clientId );

	// Can't indent the first item: there is no sibling to nest it under.
	if ( ! previousSiblingId ) {
		return false;
	}

	const rootClientId = getBlockRootClientId( clientId );
	// Read the selection before the move: creating a nested list removes and
	// re-inserts the items, which drops it.
	const selectionStart = getSelectionStart();
	const selectionEnd = getSelectionEnd();

	registry.batch( () => {
		moveBlocksToNestedList(
			registry,
			clientIds,
			rootClientId,
			previousSiblingId
		);

		// Put the selection back on the same blocks (client IDs are kept).
		if ( ! _hasMultiSelection ) {
			selectionChange(
				clientIds[ 0 ],
				selectionEnd.attributeKey,
				selectionEnd.clientId === selectionStart.clientId
					? selectionStart.offset
					: selectionEnd.offset,
				selectionEnd.offset
			);
		} else {
			multiSelect( clientIds[ 0 ], clientIds[ clientIds.length - 1 ] );
		}
	} );

	return true;
}
