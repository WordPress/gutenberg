import HOOKS from './hooks';
import {
	addAction,
	addFilter,
	removeAction,
	removeFilter,
	removeAllActions,
	removeAllFilters,
	hasAction,
	hasFilter,
	doAction,
	applyFilters,
	currentAction,
	currentFilter,
	doingAction,
	doingFilter,
	didAction,
	didFilter
} from './';

const hooks = {
	addAction,
	addFilter,
	removeAction,
	removeFilter,
	removeAllActions,
	removeAllFilters,
	hasAction,
	hasFilter,
	doAction,
	applyFilters,
	currentAction,
	currentFilter,
	doingAction,
	doingFilter,
	didAction,
	didFilter
}

window.wp = window.wp || {};
window.wp.hooks = hooks;
