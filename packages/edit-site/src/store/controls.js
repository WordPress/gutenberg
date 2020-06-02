/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { findTemplate as findTemplateUtil } from '../utils';

/**
 * Find the template for a given page path.
 *
 * @param {string} path The page path.
 *
 * @return {number} The found template ID.
 */
export function findTemplate( path ) {
	return {
		type: 'FIND_TEMPLATE',
		path,
	};
}

const controls = {
	SELECT: createRegistryControl(
		( registry ) => ( { storeName, selectorName, args } ) => {
			return registry.select( storeName )[ selectorName ]( ...args );
		}
	),
	FIND_TEMPLATE: createRegistryControl( ( registry ) => ( { path } ) =>
		findTemplateUtil(
			path,
			registry.__experimentalResolveSelect( 'core' ).getEntityRecords
		)
	),
};

export default controls;
