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
export function findTemplate( path, templateType, templates ) {
	return {
		type: 'FIND_TEMPLATE',
		path,
		templateType,
		templates,
	};
}

const controls = {
	FIND_TEMPLATE: createRegistryControl(
		( registry ) => ( { path, templateType, templates } ) =>
			findTemplateUtil(
				path,
				registry.__experimentalResolveSelect( 'core' ).getEntityRecords,
				templateType,
				templates
			)
	),
};

export default controls;
