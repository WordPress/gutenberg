/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

/**
 * Calls a selector using the current state.
 *
 * @param {string} storeName    Store name.
 * @param {string} selectorName Selector name.
 * @param  {Array} args         Selector arguments.
 *
 * @return {Object} control descriptor.
 */
export function select( storeName, selectorName, ...args ) {
	return {
		type: 'SELECT',
		storeName,
		selectorName,
		args,
	};
}

const controls = {
	SELECT: createRegistryControl(
		( registry ) => ( { storeName, selectorName, args } ) => {
			return registry.select( storeName )[ selectorName ]( ...args );
		}
	),
};

export default controls;
