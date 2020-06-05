/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Browser dependencies
 */
const { fetch } = window;

/**
 * Find the template for a given page path.
 *
 * @param {string}   path The page path.
 * @param {Function} getEntityRecords The promise-returning `getEntityRecords` selector to use.
 *
 * @return {number} The found template ID.
 */
export default async function findTemplate( path, getEntityRecords ) {
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

	return newTemplateId;
}
