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
 * Returns an instance of the hooks object.
 */
function createHooks() {
	/** @type {import('.').Store} */
	const actions = Object.create( null );
	/** @type {import('.').Store} */
	const filters = Object.create( null );
	actions.__current = [];
	filters.__current = [];

	/** @type {import('.').Hooks} */
	const hooks = Object.create( null );

	Object.assign( hooks, {
		addAction: createAddHook( hooks, 'actions' ),
		addFilter: createAddHook( hooks, 'filters' ),
		removeAction: createRemoveHook( hooks, 'actions' ),
		removeFilter: createRemoveHook( hooks, 'filters' ),
		hasAction: createHasHook( hooks, 'actions' ),
		hasFilter: createHasHook( hooks, 'filters' ),
		removeAllActions: createRemoveHook( hooks, 'actions', true ),
		removeAllFilters: createRemoveHook( hooks, 'filters', true ),
		doAction: createRunHook( hooks, 'actions' ),
		applyFilters: createRunHook( hooks, 'filters', true ),
		currentAction: createCurrentHook( hooks, 'actions' ),
		currentFilter: createCurrentHook( hooks, 'filters' ),
		doingAction: createDoingHook( hooks, 'actions' ),
		doingFilter: createDoingHook( hooks, 'filters' ),
		didAction: createDidHook( hooks, 'actions' ),
		didFilter: createDidHook( hooks, 'filters' ),
		actions,
		filters,
	} );

	return hooks;
}

export default createHooks;
