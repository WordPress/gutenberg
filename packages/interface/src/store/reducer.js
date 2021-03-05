/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { combineReducers } from '@wordpress/data';

/**
 * Reducer to keep tract of the active area per scope.
 *
 * @param {boolean} state           Previous state.
 * @param {Object}  action          Action object.
 * @param {string}  action.type     Action type.
 * @param {string}  action.itemType Type of item.
 * @param {string}  action.scope    Item scope.
 * @param {string}  action.item     Item name.
 *
 * @return {Object} Updated state.
 */
export function singleEnableItems(
	state = {},
	{ type, itemType, scope, item }
) {
	if ( type !== 'SET_SINGLE_ENABLE_ITEM' || ! itemType || ! scope ) {
		return state;
	}

	return {
		...state,
		[ itemType ]: {
			...state[ itemType ],
			[ scope ]: item || null,
		},
	};
}

/**
 * Reducer keeping track of the "pinned" items per scope.
 *
 * @param {boolean} state           Previous state.
 * @param {Object}  action          Action object.
 * @param {string}  action.type     Action type.
 * @param {string}  action.itemType Type of item.
 * @param {string}  action.scope    Item scope.
 * @param {string}  action.item     Item name.
 * @param {boolean} action.isEnable Whether the item is pinned.
 *
 * @return {Object} Updated state.
 */
export function multipleEnableItems(
	state = {},
	{ type, itemType, scope, item, isEnable }
) {
	if (
		type !== 'SET_MULTIPLE_ENABLE_ITEM' ||
		! itemType ||
		! scope ||
		! item ||
		get( state, [ itemType, scope, item ] ) === isEnable
	) {
		return state;
	}
	const currentTypeState = state[ itemType ] || {};
	const currentScopeState = currentTypeState[ scope ] || {};

	return {
		...state,
		[ itemType ]: {
			...currentTypeState,
			[ scope ]: {
				...currentScopeState,
				[ item ]: isEnable || false,
			},
		},
	};
}

const enableItems = combineReducers( {
	singleEnableItems,
	multipleEnableItems,
} );

export default combineReducers( {
	enableItems,
} );
