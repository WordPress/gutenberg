/**
 * Internal dependencies
 */
import type { RequestUtils } from './index';

const PAGE_STATUS = [
	'publish',
	'future',
	'draft',
	'pending',
	'private',
	'trash',
] as const;

export type Page = {
	id: number;
	status: typeof PAGE_STATUS[ number ];
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

			status: PAGE_STATUS.join( ',' ),
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
