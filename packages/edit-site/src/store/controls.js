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
 * @param {string}   path The page path.
 * @param {string}   [templateType] Filter by template type to find a specific template.
 * @param {string[]} [templates] Filter by template hierarchy to find a specific template.
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
