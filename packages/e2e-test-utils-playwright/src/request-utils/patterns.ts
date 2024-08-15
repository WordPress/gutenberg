/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

/**
 * Delete all pattern categories using REST API.
 *
 * @see https://developer.wordpress.org/rest-api/reference/categories/#list-categories
 * @param this
 */
export async function deleteAllPatternCategories( this: RequestUtils ) {
	// List all pattern categories.
	// https://developer.wordpress.org/rest-api/reference/categories/#list-categories
	const categories = await this.rest( {
		path: '/wp/v2/wp_pattern_category',
		params: {
			per_page: 100,
		},
	} );

	// Delete pattern categories.
	// https://developer.wordpress.org/rest-api/reference/categories/#delete-a-category
	// "/wp/v2/category" does not yet supports batch requests.
	await this.batchRest(
		categories.map( ( category: { id: number } ) => ( {
			method: 'DELETE',
			path: `/wp/v2/wp_pattern_category/${ category.id }?force=true`,
		} ) )
	);
}
