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
import type { Store } from './types';

/**
 * Internal class for constructing hooks. Use `createHooks()` function
 *
 * Note, it is necessary to expose this class to make its type public.
 *
 * @private
 */
export class _Hooks {
	public actions: Store;
	public filters: Store;

	public addAction: ReturnType< typeof createAddHook >;
	public addFilter: ReturnType< typeof createAddHook >;
	public removeAction: ReturnType< typeof createRemoveHook >;
	public removeFilter: ReturnType< typeof createRemoveHook >;
	public hasAction: ReturnType< typeof createHasHook >;
	public hasFilter: ReturnType< typeof createHasHook >;
	public removeAllActions: ReturnType< typeof createRemoveHook >;
	public removeAllFilters: ReturnType< typeof createRemoveHook >;
	public doAction: ReturnType< typeof createRunHook >;
	public doActionAsync: ReturnType< typeof createRunHook >;
	public applyFilters: ReturnType< typeof createRunHook >;
	public applyFiltersAsync: ReturnType< typeof createRunHook >;
	public currentAction: ReturnType< typeof createCurrentHook >;
	public currentFilter: ReturnType< typeof createCurrentHook >;
	public doingAction: ReturnType< typeof createDoingHook >;
	public doingFilter: ReturnType< typeof createDoingHook >;
	public didAction: ReturnType< typeof createDidHook >;
	public didFilter: ReturnType< typeof createDidHook >;

	constructor() {
		this.actions = Object.create( null );
		this.actions.__current = new Set();

		this.filters = Object.create( null );
		this.filters.__current = new Set();

		this.addAction = createAddHook( this, 'actions' );
		this.addFilter = createAddHook( this, 'filters' );
		this.removeAction = createRemoveHook( this, 'actions' );
		this.removeFilter = createRemoveHook( this, 'filters' );
		this.hasAction = createHasHook( this, 'actions' );
		this.hasFilter = createHasHook( this, 'filters' );
		this.removeAllActions = createRemoveHook( this, 'actions', true );
		this.removeAllFilters = createRemoveHook( this, 'filters', true );
		this.doAction = createRunHook( this, 'actions', false, false );
		this.doActionAsync = createRunHook( this, 'actions', false, true );
		this.applyFilters = createRunHook( this, 'filters', true, false );
		this.applyFiltersAsync = createRunHook( this, 'filters', true, true );
		this.currentAction = createCurrentHook( this, 'actions' );
		this.currentFilter = createCurrentHook( this, 'filters' );
		this.doingAction = createDoingHook( this, 'actions' );
		this.doingFilter = createDoingHook( this, 'filters' );
		this.didAction = createDidHook( this, 'actions' );
		this.didFilter = createDidHook( this, 'filters' );
	}
}

export type Hooks = _Hooks;

/**
 * Returns an instance of the hooks object.
 *
 * @return A Hooks instance.
 */
function createHooks(): Hooks {
	return new _Hooks();
}

export default createHooks;
