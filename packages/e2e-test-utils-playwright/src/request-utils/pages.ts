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
	status: ( typeof PAGE_STATUS )[ number ];
};

export type CreatePagePayload = {
	title?: string;
	content?: string;
	status: ( typeof PAGE_STATUS )[ number ];
	date?: string;
	date_gmt?: string;
};

export async function deletePage( this: RequestUtils, id: number ) {
	// https://developer.wordpress.org/rest-api/reference/pages/#delete-a-page
	return await this.rest( {
		method: 'DELETE',
		path: `/wp/v2/pages/${ id }`,
		params: {
			force: true,
		},
	} );
}

/**
 * Delete all pages using REST API.
 *
 * @param this
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
	// "/wp/v2/pages" not yet supports batch requests.
	await Promise.all(
		pages.map( ( page ) => deletePage.call( this, page.id ) )
	);
}

/**
 * Create a new page.
 *
 * @param this
 * @param payload The page payload.
 */
export async function createPage(
	this: RequestUtils,
	payload: CreatePagePayload
) {
	// https://developer.wordpress.org/rest-api/reference/pages/#create-a-page
	const page = await this.rest< Page >( {
		method: 'POST',
		path: `/wp/v2/pages`,
		params: payload,
	} );

	return page;
}
