/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Browser dependencies
 */
const { fetch } = window;

/**
 * @typedef {Object} TemplateInfo
 * @property {number} id The template's id.
 * @property {string} slug The template's slug.
 */

/**
 * Find the template for a given page path.
 *
 * @param {string}   path The page path.
 * @param {Function} getEntityRecords The promise-returning `getEntityRecords` selector to use.
 *
 * @return {TemplateInfo} The found template information.
 */
export default async function findTemplate( path, getEntityRecords ) {
	const { data } = await fetch(
		addQueryArgs( findTemplate.siteUrl + path, {
			'_wp-find-template': true,
		} )
	).then( ( res ) => res.json() );

	const { ID: newTemplateId, post_name: slug } = data;
	const templateInfo = { id: newTemplateId, slug };
	if ( newTemplateId === null ) {
		const [ newTemplate ] = await getEntityRecords(
			'postType',
			'wp_template',
			{ resolved: true, slug }
		);
		templateInfo.id = newTemplate.id;
	}
	return templateInfo;
}

findTemplate.siteUrl = '';
