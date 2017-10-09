import createAddHook from './createAddHook';
import createRemoveHook from './createRemoveHook';
import createHasHook from './createHasHook';
import createRunHook from './createRunHook';
import createCurrentHook from './createCurrentHook';
import createDoingHook from './createDoingHook';
import createDidHook from './createDidHook';


export const createHooks = () => {
	const HOOKS = {
		actions: {},
		filters: {},
	};

	return {
		'addAction':        createAddHook( HOOKS.actions ),
		'addFilter':        createAddHook( HOOKS.filters ),
		'removeAction':     createRemoveHook( HOOKS.actions ),
		'removeFilter':     createRemoveHook( HOOKS.filters ),
		'hasAction':        createHasHook( HOOKS.actions ),
		'hasFilter':        createHasHook( HOOKS.filters ),
		'removeAllActions': createRemoveHook( HOOKS.actions, true ),
		'removeAllFilters': createRemoveHook( HOOKS.filters, true ),
		'doAction':         createRunHook( HOOKS.actions ),
		'applyFilters':     createRunHook( HOOKS.filters, true ),
		'currentAction':    createCurrentHook( HOOKS.actions ),
		'currentFilter':    createCurrentHook( HOOKS.filters ),
		'doingAction':      createDoingHook( HOOKS.actions ),
		'doingFilter':      createDoingHook( HOOKS.filters ),
		'didAction':        createDidHook( HOOKS.actions ),
		'didFilter':        createDidHook( HOOKS.filters ),
		'HOOKS':            HOOKS,
	};
};
