/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

/**
 * Returns an control descriptor signalling to subscribe to the registry and
 * resolve the control promise only when the next state change occurs.
 *
 * @return {Object} Control descriptor.
 */
export function awaitNextStateChange() {
	return { type: 'AWAIT_NEXT_STATE_CHANGE' };
}

const controls = {
	AWAIT_NEXT_STATE_CHANGE: createRegistryControl(
		( registry ) => () => new Promise( ( resolve ) => {
			const unsubscribe = registry.subscribe( () => {
				unsubscribe();
				resolve();
			} );
		} )
	),
};

export default controls;
