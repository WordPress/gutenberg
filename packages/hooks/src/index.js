import createAddHook from './createAddHook';
import createRemoveHook from './createRemoveHook';
import createHasHook from './createHasHook';
import createRunHook from './createRunHook';
import createCurrentHook from './createCurrentHook';
import createDoingHook from './createDoingHook';
import createDidHook from './createDidHook';

function createHooks() {
	const actions = {};
	const filters = {};

	return {
		addAction:        createAddHook( actions ),
		addFilter:        createAddHook( filters ),
		removeAction:     createRemoveHook( actions ),
		removeFilter:     createRemoveHook( filters ),
		hasAction:        createHasHook( actions ),
		hasFilter:        createHasHook( filters ),
		removeAllActions: createRemoveHook( actions, true ),
		removeAllFilters: createRemoveHook( filters, true ),
		doAction:         createRunHook( actions ),
		applyFilters:     createRunHook( filters, true ),
		currentAction:    createCurrentHook( actions ),
		currentFilter:    createCurrentHook( filters ),
		doingAction:      createDoingHook( actions ),
		doingFilter:      createDoingHook( filters ),
		didAction:        createDidHook( actions ),
		didFilter:        createDidHook( filters ),
		actions:          actions,
		filters:          filters,
	};
};
export default createHooks;
