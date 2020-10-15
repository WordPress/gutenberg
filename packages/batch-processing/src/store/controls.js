/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { MODULE_KEY } from './constants';

/**
 * Calls a selector using chosen registry.
 *
 * @param {string} selectorName Selector name.
 * @param {Array} args          Selector arguments.
 * @return {Object} control descriptor.
 */
export function select( selectorName, ...args ) {
	return {
		type: 'SELECT',
		selectorName,
		args,
	};
}

/**
 * Dispatches an action using chosen registry.
 *
 * @param {string} actionName   Action name.
 * @param {Array} args          Selector arguments.
 * @return {Object} control descriptor.
 */
export function dispatch( actionName, ...args ) {
	return {
		type: 'DISPATCH',
		actionName,
		args,
	};
}

const controls = {
	SELECT: createRegistryControl(
		( registry ) => ( { selectorName, args } ) => {
			return registry.select( MODULE_KEY )[ selectorName ]( ...args );
		}
	),

	DISPATCH: createRegistryControl(
		( registry ) => ( { actionName, args } ) => {
			return registry.dispatch( MODULE_KEY )[ actionName ]( ...args );
		}
	),
};

export default controls;
