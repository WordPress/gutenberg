/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

const controls = {
	SELECT: createRegistryControl(
		( registry ) => ( { storeName, selectorName, args } ) => {
			return registry.select( storeName )[ selectorName ]( ...args );
		}
	),
};

export default controls;
