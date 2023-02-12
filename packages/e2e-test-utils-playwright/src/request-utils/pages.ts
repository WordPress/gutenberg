/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

export type Page = {
	id: number;
	status: 'publish' | 'future' | 'draft' | 'pending' | 'private';
};

/**
 * Delete all pages using REST API.
 *
 * @param {RequestUtils} this
 */
export async function deleteAllPages( this: RequestUtils ) {
	// List all pages.
	// https://developer.wordpress.org/rest-api/reference/pages/#list-pages
	const pages = await this.rest< Page[] >( {
		path: '/wp/v2/pages',
		params: {
			per_page: 100,
			// All possible statuses.
			status: 'publish,future,draft,pending,private,trash',
		},
	} );

	// Delete all pages one by one.
	// https://developer.wordpress.org/rest-api/reference/pages/#delete-a-page
	// "/wp/v2/pages" not yet supports batch requests.
	await Promise.all(
		pages.map( ( page ) =>
			this.rest( {
				method: 'DELETE',
				path: `/wp/v2/pages/${ page.id }`,
				params: {
					force: true,
				},
			} )
		)
	);
}
