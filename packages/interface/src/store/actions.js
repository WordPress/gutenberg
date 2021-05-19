/**
 * Returns an action object used in signalling that an active area should be changed.
 *
 * @param {string} itemType Type of item.
 * @param {string} scope    Item scope.
 * @param {string} item     Item identifier.
 *
 * @return {Object} Action object.
 */
function setSingleEnableItem( itemType, scope, item ) {
	return {
		type: 'SET_SINGLE_ENABLE_ITEM',
		itemType,
		scope,
		item,
	};
}

/**
 * Returns an action object used in signalling that a complementary item should be enabled.
 *
 * @param {string} scope Complementary area scope.
 * @param {string} area  Area identifier.
 *
 * @return {Object} Action object.
 */
export function enableComplementaryArea( scope, area ) {
	return setSingleEnableItem( 'complementaryArea', scope, area );
}

/**
 * Returns an action object used in signalling that the complementary area of a given scope should be disabled.
 *
 * @param {string} scope Complementary area scope.
 *
 * @return {Object} Action object.
 */
export function disableComplementaryArea( scope ) {
	return setSingleEnableItem( 'complementaryArea', scope, undefined );
}

/**
 * Returns an action object to make an area enabled/disabled.
 *
 * @param {string}  itemType Type of item.
 * @param {string}  scope    Item scope.
 * @param {string}  item     Item identifier.
 * @param {boolean} isEnable Boolean indicating if an area should be pinned or not.
 *
 * @return {Object} Action object.
 */
function setMultipleEnableItem( itemType, scope, item, isEnable ) {
	return {
		type: 'SET_MULTIPLE_ENABLE_ITEM',
		itemType,
		scope,
		item,
		isEnable,
	};
}

/**
 * Returns an action object used in signalling that an item should be pinned.
 *
 * @param {string} scope  Item scope.
 * @param {string} itemId Item identifier.
 *
 * @return {Object} Action object.
 */
export function pinItem( scope, itemId ) {
	return setMultipleEnableItem( 'pinnedItems', scope, itemId, true );
}

/**
 * Returns an action object used in signalling that an item should be unpinned.
 *
 * @param {string} scope  Item scope.
 * @param {string} itemId Item identifier.
 *
 * @return {Object} Action object.
 */
export function unpinItem( scope, itemId ) {
	return setMultipleEnableItem( 'pinnedItems', scope, itemId, false );
}
