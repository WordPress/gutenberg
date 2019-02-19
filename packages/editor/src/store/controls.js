/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

/**
 * Calls a selector using the current state.
 *
 * @param {string} storeKey     Store key.
 * @param {string} selectorName Selector name.
 * @param  {Array} args         Selector arguments.
 *
 * @return {Object} control descriptor.
 */
export function select( storeKey, selectorName, ...args ) {
	return {
		type: 'SELECT',
		storeKey,
		selectorName,
		args,
	};
}

const controls = {
	SELECT: createRegistryControl( ( registry ) => ( { storeKey, selectorName, args } ) => {
		return registry.select( storeKey )[ selectorName ]( ...args );
	} ),
};

export default controls;
