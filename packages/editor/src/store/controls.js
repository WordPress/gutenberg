/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

/**
 * Dispatches an action.
 *
 * @param {string} storeKey   Store key.
 * @param {string} actionName Action name.
 * @param  {Array} args       Action arguments.
 *
 * @return {Object} control descriptor.
 */
export function dispatch( storeKey, actionName, ...args ) {
	return {
		type: 'DISPATCH',
		storeKey,
		actionName,
		args,
	};
}

const controls = {
	DISPATCH: createRegistryControl( ( registry ) => ( { storeKey, actionName, args } ) => {
		return registry.dispatch( storeKey )[ actionName ]( ...args );
	} ),
};

export default controls;
