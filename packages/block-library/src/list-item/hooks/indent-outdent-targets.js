/**
 * The previous sibling to nest a list item under when indenting, or undefined
 * for the first item, which has no sibling to nest under.
 *
 * @param {Object} select   The block editor store's selectors.
 * @param {string} clientId The list item's client ID.
 *
 * @return {string|undefined} The client ID to nest the item under.
 */
export function getIndentTarget( select, clientId ) {
	return select.getPreviousBlockClientId( clientId );
}

/**
 * The ancestor list item the given item's list is nested in when outdenting, or
 * undefined at the top level, where there is nothing to outdent to.
 *
 * @param {Object} select   The block editor store's selectors.
 * @param {string} clientId The list item's client ID.
 *
 * @return {string|undefined} The ancestor list item's client ID.
 */
export function getOutdentTarget( select, clientId ) {
	const listId = select.getBlockRootClientId( clientId );
	const parentListItemId = select.getBlockRootClientId( listId );
	if (
		! parentListItemId ||
		select.getBlockName( parentListItemId ) !== 'core/list-item'
	) {
		return undefined;
	}
	return parentListItemId;
}
