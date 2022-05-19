/**
 * Internal dependencies
 */
import createAddHook from './createAddHook';
import createRemoveHook from './createRemoveHook';
import createHasHook from './createHasHook';
import createRunHook from './createRunHook';
import createCurrentHook from './createCurrentHook';
import createDoingHook from './createDoingHook';
import createDidHook from './createDidHook';

/**
 * Internal class for constructing hooks. Use `createHooks()` function
 *
 * Note, it is necessary to expose this class to make its type public.
 *
 * @private
 */
export class _Hooks {
	constructor() {
		/** @type {import('.').Store} actions */
		this.actions = Object.create( null );
		this.actions.__current = [];

		/** @type {import('.').Store} filters */
		this.filters = Object.create( null );
		this.filters.__current = [];

		this.addAction = createAddHook( this, 'actions' );
		this.addFilter = createAddHook( this, 'filters' );
		this.removeAction = createRemoveHook( this, 'actions' );
		this.removeFilter = createRemoveHook( this, 'filters' );
		this.hasAction = createHasHook( this, 'actions' );
		this.hasFilter = createHasHook( this, 'filters' );
		this.removeAllActions = createRemoveHook( this, 'actions', true );
		this.removeAllFilters = createRemoveHook( this, 'filters', true );
		this.doAction = createRunHook( this, 'actions' );
		this.applyFilters = createRunHook( this, 'filters', true );
		this.currentAction = createCurrentHook( this, 'actions' );
		this.currentFilter = createCurrentHook( this, 'filters' );
		this.doingAction = createDoingHook( this, 'actions' );
		this.doingFilter = createDoingHook( this, 'filters' );
		this.didAction = createDidHook( this, 'actions' );
		this.didFilter = createDidHook( this, 'filters' );
	}
}

/** @typedef {_Hooks} Hooks */

/**
 * Returns an instance of the hooks object.
 *
 * @return {Hooks} A Hooks instance.
 */
function createHooks() {
	return new _Hooks();
}

export default createHooks;
