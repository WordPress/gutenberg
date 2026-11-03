import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import type { APIFetchOptions } from '@wordpress/api-fetch';
import fetchLinkEntity from '../fetch-link-entity';

vi.mock( import( '@wordpress/api-fetch' ) );

const SITE = { homeUrl: 'https://example.com', siteUrl: 'https://example.com' };

const ABOUT_PAGE = {
	id: 2,
	link: 'https://example.com/about/',
	title: { rendered: 'About &amp; Us' },
};
const CHILD_ABOUT_PAGE = {
	id: 3,
	link: 'https://example.com/team/about/',
	title: { rendered: 'About the team' },
};
const HELLO_POST = {
	id: 1,
	link: 'https://example.com/2026/11/03/hello/',
	title: { rendered: 'Hello' },
};
const NEWS_CATEGORY = {
	id: 5,
	link: 'https://example.com/category/news/',
	name: 'News',
};

/**
 * Answers the requests the lookup makes, like a site with an "About" page, a
 * child page also with the slug `about`, a "Hello" post and a "News" category.
 *
 * @param options      The request options.
 * @param options.path The request path.
 */
function respond( { path = '' }: APIFetchOptions ) {
	const [ route, query = '' ] = path.split( '?' );
	const slug = new URLSearchParams( query ).get( 'slug' );
	switch ( route ) {
		case '/wp/v2/pages':
			return Promise.resolve(
				slug === 'about' ? [ ABOUT_PAGE, CHILD_ABOUT_PAGE ] : []
			);
		case '/wp/v2/posts':
			return Promise.resolve( slug === 'hello' ? [ HELLO_POST ] : [] );
		case '/wp/v2/categories':
			return Promise.resolve( slug === 'news' ? [ NEWS_CATEGORY ] : [] );
		case '/wp/v2/tags':
			return Promise.resolve( [] );
		case '/wp/v2/pages/2':
			return Promise.resolve( ABOUT_PAGE );
		case '/wp/v2/posts/1':
			return Promise.resolve( HELLO_POST );
	}
	return Promise.reject( new Error( `Unexpected path ${ path }` ) );
}

describe( 'fetchLinkEntity', () => {
	beforeEach( () => {
		( apiFetch as unknown as Mock ).mockReset();
		( apiFetch as unknown as Mock ).mockImplementation( respond );
	} );

	describe( 'when the URL is not on this site, it makes no request', () => {
		it.each( [
			// Another site.
			'https://wordpress.org/about/',
			// Another site at a protocol-relative URL.
			'//wordpress.org/about/',
			// Not a web address.
			'mailto:hello@example.com',
			'tel:5555555555',
			// An anchor on the current page.
			'#about',
		] )( '%s', async ( url ) => {
			await expect( fetchLinkEntity( url, SITE ) ).resolves.toBeNull();
			expect( apiFetch ).not.toHaveBeenCalled();
		} );

		it( 'outside the subdirectory the site is installed in', async () => {
			await expect(
				fetchLinkEntity( 'https://example.com/shop/about/', {
					homeUrl: 'https://example.com/blog',
					siteUrl: 'https://example.com/blog',
				} )
			).resolves.toBeNull();
			expect( apiFetch ).not.toHaveBeenCalled();
		} );

		it( 'when the site addresses are unknown', async () => {
			await expect(
				fetchLinkEntity( '/about/', {} )
			).resolves.toBeNull();
			expect( apiFetch ).not.toHaveBeenCalled();
		} );

		it( 'when the URL carries an anchor or a query, which binding would drop', async () => {
			await expect(
				fetchLinkEntity( 'https://example.com/about/#team', SITE )
			).resolves.toBeNull();
			await expect(
				fetchLinkEntity( 'https://example.com/about/?ref=nav', SITE )
			).resolves.toBeNull();
			expect( apiFetch ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'when the URL is on this site, it finds what it links to', () => {
		it.each( [
			// Pasted from the address bar.
			'https://example.com/about/',
			// Typed without the trailing slash or with the other protocol.
			'https://example.com/about',
			'http://example.com/about/',
			// A path relative to the site.
			'/about/',
		] )( 'the "About" page from %s', async ( url ) => {
			await expect( fetchLinkEntity( url, SITE ) ).resolves.toEqual( {
				id: 2,
				url: 'https://example.com/about/',
				title: 'About & Us',
				type: 'page',
				kind: 'post-type',
			} );
		} );

		it( 'a post', async () => {
			await expect(
				fetchLinkEntity( 'https://example.com/2026/11/03/hello/', SITE )
			).resolves.toEqual( {
				id: 1,
				url: 'https://example.com/2026/11/03/hello/',
				title: 'Hello',
				type: 'post',
				kind: 'post-type',
			} );
		} );

		it( 'a category', async () => {
			await expect(
				fetchLinkEntity( 'https://example.com/category/news/', SITE )
			).resolves.toEqual( {
				id: 5,
				url: 'https://example.com/category/news/',
				title: 'News',
				type: 'category',
				kind: 'taxonomy',
			} );
		} );

		it( 'the child page that shares a slug with another page', async () => {
			await expect(
				fetchLinkEntity( 'https://example.com/team/about/', SITE )
			).resolves.toEqual(
				expect.objectContaining( { id: 3, type: 'page' } )
			);
		} );

		it( 'a URL under the WordPress address when it differs from the home address', async () => {
			await expect(
				fetchLinkEntity( 'https://example.com/about/', {
					homeUrl: 'https://www.example.com',
					siteUrl: 'https://example.com',
				} )
			).resolves.toEqual( expect.objectContaining( { id: 2 } ) );
		} );

		it.each( [
			[ 'https://example.com/?page_id=2', '/wp/v2/pages/2', 'page', 2 ],
			[ 'https://example.com/?p=1', '/wp/v2/posts/1', 'post', 1 ],
		] )(
			'a plain permalink %s by its id',
			async ( url, expectedPath, type, id ) => {
				await expect( fetchLinkEntity( url, SITE ) ).resolves.toEqual(
					expect.objectContaining( { id, type, kind: 'post-type' } )
				);
				expect( apiFetch ).toHaveBeenCalledTimes( 1 );
				expect( apiFetch ).toHaveBeenCalledWith(
					expect.objectContaining( {
						path: expect.stringMatching(
							new RegExp( `^${ expectedPath }\\?` )
						),
					} )
				);
			}
		);
	} );

	describe( 'when nothing on this site matches, it finds nothing', () => {
		it( 'no post or term has the slug', async () => {
			await expect(
				fetchLinkEntity( 'https://example.com/missing/', SITE )
			).resolves.toBeNull();
		} );

		it( 'the slug matches, but at another address', async () => {
			// The "About" pages live at /about/ and /team/about/.
			await expect(
				fetchLinkEntity( 'https://example.com/company/about/', SITE )
			).resolves.toBeNull();
		} );

		it( 'the home page itself, which has no slug', async () => {
			await expect(
				fetchLinkEntity( 'https://example.com/', SITE )
			).resolves.toBeNull();
		} );

		it( 'the request fails', async () => {
			( apiFetch as unknown as Mock ).mockRejectedValue( {
				code: 'rest_forbidden',
				message: 'Sorry.',
			} );
			await expect(
				fetchLinkEntity( 'https://example.com/about/', SITE )
			).resolves.toBeNull();
		} );
	} );
} );
