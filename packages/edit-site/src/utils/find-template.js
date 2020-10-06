/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Browser dependencies
 */
const { fetch } = window;

/**
 * Find the template for a given page path or find a specific template by using filters.
 *
 * @param {string}   path The page path.
 * @param {Function} getEntityRecords The promise-returning `getEntityRecords` selector to use.
 * @param {string}   [templateType] Filter by template type to find a specific template.
 * @param {string[]} [templates] Filter by template hierarchy to find a specific template.
 *
 * @return {number} The found template ID.
 */
export default async function findTemplate(
	path,
	getEntityRecords,
	templateType,
	templates
) {
	const { data } = await fetch(
		addQueryArgs( findTemplate.siteUrl + path, {
			'_wp-find-template': true,
			'_wp-find-template-type': templateType,
			'_wp-find-template-templates': templates,
		} )
	).then( ( res ) => res.json() );

	let newTemplateId = data.ID;
	if ( newTemplateId === null ) {
		newTemplateId = (
			await getEntityRecords( 'postType', 'wp_template', {
				resolved: true,
				slug: data.post_name,
			} )
		 )[ 0 ].id;
	}

	return newTemplateId;
}

findTemplate.siteUrl = '';
