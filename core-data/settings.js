/**
 * WordPress dependencies
 */
import { settings } from '@wordpress/api-request';

/**
 * Given a post type slug, returns its REST API base route.
 *
 * @param {string} postType Post type slug.
 *
 * @return {string} Post type REST API base route.
 */
export function getPostTypeRESTBase( postType ) {
	return settings.postTypeRestBaseMapping[ postType ];
}

/**
 * Given a taxonomy slug, returns its REST API base route.
 *
 * @param {string} taxonomy Taxonomy slug.
 *
 * @return {string} Taxonomy REST API base route.
 */
export function getTaxonomyRESTBase( taxonomy ) {
	return settings.taxonomyRestBaseMapping[ taxonomy ];
}
