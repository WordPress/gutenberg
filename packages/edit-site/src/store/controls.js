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
export function findTemplate( path, type, templates ) {
	return {
		type: 'FIND_TEMPLATE',
		path,
		argType: type,
		argTemplates: templates,
	};
}

const controls = {
	FIND_TEMPLATE: createRegistryControl(
		( registry ) => ( { path, argType, argTemplates } ) =>
			findTemplateUtil(
				path,
				argType,
				argTemplates,
				registry.__experimentalResolveSelect( 'core' ).getEntityRecords
			)
	),
};

export default controls;
