/**
 * Internal dependencies
 */
import createHooks from './createHooks';

/** @typedef {(...args: any[])=>any} Callback */

/**
 * @typedef Handler
 * @property {Callback} callback  The callback
 * @property {string}   namespace The namespace
 * @property {number}   priority  The namespace
 */

/**
 * @typedef Hook
 * @property {Handler[]} handlers Array of handlers
 * @property {number}    runs     Run counter
 */

/**
 * @typedef Current
 * @property {string} name         Hook name
 * @property {number} currentIndex The index
 */

/**
 * @typedef {Record<string, Hook> & {__current: Current[]}} Store
 */

/**
 * @typedef {'actions' | 'filters'} StoreKey
 */

/**
 * @typedef {import('./createHooks').Hooks} Hooks
 */

export const defaultHooks = createHooks();

const {
	addAction,
	addFilter,
	removeAction,
	removeFilter,
	hasAction,
	hasFilter,
	removeAllActions,
	removeAllFilters,
	doAction,
	applyFilters,
	currentAction,
	currentFilter,
	doingAction,
	doingFilter,
	didAction,
	didFilter,
	actions,
	filters,
} = defaultHooks;

export {
	createHooks,
	addAction,
	addFilter,
	removeAction,
	removeFilter,
	hasAction,
	hasFilter,
	removeAllActions,
	removeAllFilters,
	doAction,
	applyFilters,
	currentAction,
	currentFilter,
	doingAction,
	doingFilter,
	didAction,
	didFilter,
	actions,
	filters,
};
