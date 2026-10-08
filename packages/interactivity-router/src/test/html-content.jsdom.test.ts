/**
 * Navigation treats HTML directive content as inert. The router is imported
 * once because it registers global listeners; each test uses fresh stores and
 * regions so its DOM and cached pages are independent.
 */
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { asDangerousHTML, store } from '@wordpress/interactivity';
import { actions } from '../index';
import { hydrateHtml, nextFrames, pageHtml, quiet } from './fixtures/helpers';

// Fill jsdom's runtime gaps before the Interactivity API evaluates.
await vi.hoisted( async () => {
	await import( './fixtures/jsdom-setup' );
} );

// Distinguish singleton store registrations and cached destination URLs.
let testCount = 0;
// Namespace shared by the current test's markup and actions.
let namespace: string;
// Destination URL unique to the current test.
let url: string;
// Number of times an island's initialization action actually ran.
let marks: number;

/**
 * Builds an interactive router region for the current test's namespace.
 *
 * @param content    Region content.
 * @param id         Region id within the current namespace.
 * @param attributes Additional attributes on the region element.
 * @return Region markup.
 */
const regionHtml = ( content: string, id = 'r', attributes = '' ) =>
	`<div data-wp-interactive="${ namespace }" data-wp-router-region='${ JSON.stringify(
		{
			// Region signals persist across navigations, so ids must be unique.
			id: `${ namespace }/${ id }`,
		}
	) }' ${ attributes }>${ content }</div>`;

/**
 * Navigates using supplied destination markup and waits for directive effects.
 *
 * @param body Destination body markup.
 * @return A promise resolving after navigation and its scheduled frames.
 */
const navigate = async ( body: string ) => {
	await actions.navigate( url, {
		...quiet,
		html: pageHtml( body ),
		force: true,
	} );
	await nextFrames();
};

// Let the runtime finish preparing the empty initial document before fixtures.
beforeAll( nextFrames );

beforeEach( () => {
	document.body.innerHTML = '';
	namespace = `test/router-html-${ ++testCount }`;
	url = `http://localhost/html-content-${ testCount }`;
	marks = 0;
	store( namespace, {
		state: {
			// Leave fallback content in place unless a test supplies a token.
			html: null,
		},
		actions: {
			/** Records the observable initialization of an interactive island. */
			mark() {
				marks++;
			},
		},
	} );
} );

describe( 'router regions in HTML directive content', () => {
	test( 'updates a region carrying data-wp-html in either attribute order without writing its token', async () => {
		store( namespace, {
			state: {
				// The conflicting HTML directive must never render this token.
				html: asDangerousHTML( '<b>token</b>' ),
			},
		} );
		for ( const htmlFirst of [ false, true ] ) {
			const regionAttribute = `data-wp-router-region="${ namespace }/${ htmlFirst }"`;
			const attributes = htmlFirst
				? `data-wp-html="state.html" ${ regionAttribute }`
				: `${ regionAttribute } data-wp-html="state.html"`;
			const current = hydrateHtml(
				`<div data-wp-interactive="${ namespace }" ${ attributes }><p>current</p></div>`
			);
			expect( current.innerHTML ).toBe( '<p>current</p>' );

			await navigate(
				`<div data-wp-interactive="${ namespace }" ${ attributes }><p>destination</p></div>`
			);

			expect( current.innerHTML ).toBe( '<p>destination</p>' );
			current.parentElement!.remove();
		}
		expect( console ).toHaveWarnedWith(
			'The data-wp-html directive was ignored because it conflicts with data-wp-router-region.'
		);
	} );

	test( 'never initializes an island in fallback content inside an updated region', async () => {
		const current = hydrateHtml( regionHtml( '<p>current</p>' ) );

		await navigate(
			regionHtml(
				`<div data-wp-html="state.html"><div data-wp-interactive="${ namespace }" data-wp-init="actions.mark"><p>static</p></div></div>`
			)
		);

		expect( current ).toHaveTextContent( 'static' );
		expect( marks ).toBe( 0 );
	} );
} );
