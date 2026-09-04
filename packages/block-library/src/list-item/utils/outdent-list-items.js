import { store as blockEditorStore } from '@wordpress/block-editor';
import { moveBlocksToNestedList } from './move-blocks-to-nested-list';
import { getOutdentTarget } from './indent-outdent-targets';

/**
 * Outdents list items, moving them up a level. Defaults to the selected items;
 * a specific set can be passed, e.g. to outdent an item's children.
 *
 * @param {Object}          registry    The data registry.
 * @param {string[]|string} [clientIds] The list items to outdent.
 *
 * @return {boolean} Whether the items were outdented.
 */
export function outdentListItems( registry, clientIds ) {
	const select = registry.select( blockEditorStore );
	const {
		getBlockRootClientId,
		getBlockName,
		getBlockOrder,
		getBlockIndex,
		getSelectedBlockClientIds,
	} = select;
	const { moveBlocksToPosition, removeBlock, multiSelect } =
		registry.dispatch( blockEditorStore );

	if ( clientIds === undefined ) {
		clientIds = getSelectedBlockClientIds();
	}

	if ( ! Array.isArray( clientIds ) ) {
		clientIds = [ clientIds ];
	}

	if ( ! clientIds.length ) {
		return false;
	}

	const firstClientId = clientIds[ 0 ];

	// Can't outdent if it's not a list item.
	if ( getBlockName( firstClientId ) !== 'core/list-item' ) {
		return false;
	}

	// Can't outdent if it's at the top level.
	const parentListItemId = getOutdentTarget( select, firstClientId );
	if ( ! parentListItemId ) {
		return false;
	}

	const parentListId = getBlockRootClientId( firstClientId );
	const lastClientId = clientIds[ clientIds.length - 1 ];
	const order = getBlockOrder( parentListId );
	const followingListItems = order.slice( getBlockIndex( lastClientId ) + 1 );

	registry.batch( () => {
		if ( followingListItems.length ) {
			// Nest the items that follow under the outdented item so they keep
			// their place below it.
			moveBlocksToNestedList(
				registry,
				followingListItems,
				parentListId,
				firstClientId
			);
		}
		moveBlocksToPosition(
			clientIds,
			parentListId,
			getBlockRootClientId( parentListItemId ),
			getBlockIndex( parentListItemId ) + 1
		);
		if ( ! getBlockOrder( parentListId ).length ) {
			const shouldSelectParent = false;
			removeBlock( parentListId, shouldSelectParent );
		}

		// Reset the lingering partial cross-block range to a whole block
		// selection. A single caret is preserved by the store on its own.
		if ( clientIds.length > 1 ) {
			multiSelect( firstClientId, lastClientId );
		}
	} );

	return true;
}
