/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Browser dependencies
 */
const { fetch } = window;

// Naive cache to avoid running expensive template resolution for the same path
// multiple times.
const TEMPLATE_ID_CACHE = {};

/**
 * Find the template for a given page path.
 *
 * @param {string}   path The page path.
 * @param {Function} getEntityRecords The promise-returning `getEntityRecords` selector to use.
 *
 * @return {number} The found template ID.
 */
export default async function findTemplate( path, getEntityRecords ) {
	if ( TEMPLATE_ID_CACHE[ path ] ) {
		return TEMPLATE_ID_CACHE[ path ];
	}
	const { data } = await fetch(
		addQueryArgs( path, { '_wp-find-template': true } )
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
	TEMPLATE_ID_CACHE[ path ] = newTemplateId;
	return newTemplateId;
}
