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

/**
 * Calls a subscriber using the current state.
 *
 * @param {function} listenerCallback  A callback for the subscriber that
 *                                     receives the registry.
 * @return {Object} control descriptor.
 */
export function __unstableSubscribe( listenerCallback ) {
	return { type: 'SUBSCRIBE', listenerCallback };
}

const controls = {
	SELECT: createRegistryControl(
		( registry ) => ( { storeName, selectorName, args } ) => {
			return registry.select( storeName )[ selectorName ]( ...args );
		}
	),
	SUBSCRIBE: createRegistryControl(
		( registry ) => ( { listenerCallback } ) => {
			return registry.subscribe( listenerCallback( registry ) );
		}
	),
};

export default controls;
