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
	/** @type {import('.').Hooks} */
	const actions = Object.create( null );
	/** @type {import('.').Hooks} */
	const filters = Object.create( null );
	actions.__current = [];
	filters.__current = [];

	const hooks = Object.create( null );

	Object.assign( hooks, {
		addAction: createAddHook( actions ).bind( hooks ),
		addFilter: createAddHook( filters ).bind( hooks ),
		removeAction: createRemoveHook( actions ).bind( hooks ),
		removeFilter: createRemoveHook( filters ).bind( hooks ),
		hasAction: createHasHook( actions ),
		hasFilter: createHasHook( filters ),
		removeAllActions: createRemoveHook( actions, true ).bind( hooks ),
		removeAllFilters: createRemoveHook( filters, true ).bind( hooks ),
		doAction: createRunHook( actions ),
		applyFilters: createRunHook( filters, true ),
		currentAction: createCurrentHook( actions ),
		currentFilter: createCurrentHook( filters ),
		doingAction: createDoingHook( actions ),
		doingFilter: createDoingHook( filters ),
		didAction: createDidHook( actions ),
		didFilter: createDidHook( filters ),
		actions,
		filters,
	} );

	return hooks;
}

export default createHooks;
