/**
 * Navigation treats HTML directive content as inert. The router is imported
 * once because it registers global listeners; each test uses fresh stores and
 * regions so its DOM and cached pages are independent.
 */
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { asDangerousHTML, store } from '@wordpress/interactivity';
import { actions } from '../index';
import {
	hydrateHtml,
	nextFrames,
	pageHtml,
	quiet,
	traverseTo,
} from './fixtures/helpers';

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
 * @param content Region content.
 * @return Region markup.
 */
const regionHtml = ( content: string ) =>
	`<div data-wp-interactive="${ namespace }" data-wp-router-region='${ JSON.stringify(
		{
			// Region signals persist across navigations, so ids must be unique.
			id: `${ namespace }/r`,
		}
	) }'>${ content }</div>`;

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
			// Empty owned content unless a test supplies a token.
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
	for ( const prefetched of [ false, true ] ) {
		for ( const nested of [ false, true ] ) {
			test( `ignores a copy-only destination like an absent region (prefetched: ${ prefetched }, nested: ${ nested })`, async () => {
				const current = hydrateHtml( regionHtml( '<p>A</p>' ) );
				// A missing region unmounts its root, not just its children.
				const container = current.parentElement!;
				// Inside a parent region, an unfiltered copy would be recorded as a
				// nested region (`undefined`) and keep the current content.
				const wrap = ( content: string ) =>
					nested
						? `<div data-wp-interactive="${ namespace }" data-wp-router-region="${ namespace }/s">${ content }</div>`
						: `<div data-wp-interactive="${ namespace }">${ content }</div>`;
				if ( nested ) {
					hydrateHtml( wrap( '<p>parent A</p>' ) );
				}
				await navigate( wrap( '<p>no region</p>' ) );
				const absentContent = container.innerHTML;
				expect( absentContent ).toBe( '' );
				await navigate( regionHtml( '<p>A</p>' ) );
				const body = wrap(
					`<div data-wp-html="state.pending">${ regionHtml(
						'<p data-wp-init="actions.mark">copy</p>'
					) }</div>`
				);
				if ( prefetched ) {
					await actions.prefetch( url, {
						html: pageHtml( body ),
						force: true,
					} );
					// No supplied HTML on navigation: use only the prepared cache.
					await actions.navigate( url, quiet );
					await nextFrames();
				} else {
					await navigate( body );
				}
				expect( container.innerHTML ).toBe( absentContent );
				expect( marks ).toBe( 0 );
				expect( document.body ).not.toHaveTextContent( 'copy' );
			} );
		}
	}

	for ( const conflict of [ 'text', 'each' ] ) {
		test( `updates regions beneath html yielding to ${ conflict }`, async () => {
			const current = hydrateHtml( regionHtml( '<p>A</p>' ) );
			await navigate(
				`<div data-wp-interactive="${ namespace }" data-wp-html="state.pending" data-wp-${ conflict }="state.pending">${ regionHtml( '<p>B</p>' ) }</div>`
			);
			expect( current.innerHTML ).toBe( '<p>B</p>' );
		} );
	}

	test( 'updates and restores regions beneath html outside interactive markup', async () => {
		const body = ( letter: string ) =>
			`<div data-wp-html="state.pending">${ regionHtml( `<p>${ letter }</p>` ) }</div>`;
		const current = hydrateHtml( regionHtml( '<p>A</p>' ) );
		const previous = `${ url }-previous`;
		await actions.prefetch( previous, { html: pageHtml( body( 'A' ) ) } );
		await navigate( body( 'B' ) );
		expect( current.innerHTML ).toBe( '<p>B</p>' );
		traverseTo( previous );
		await nextFrames();
		expect( current.innerHTML ).toBe( '<p>A</p>' );
	} );

	test( 'updates beneath a suffixed html attribute but excludes unique-id html content', async () => {
		const current = hydrateHtml( regionHtml( '<p>A</p>' ) );
		const container = current.parentElement!;
		for ( const spelling of [ 'data-wp-html--x', 'data-wp-html---x' ] ) {
			await navigate(
				`<div data-wp-interactive="${ namespace }" ${ spelling }="state.pending">${ regionHtml( '<p>B</p>' ) }</div>`
			);
			expect( container ).toHaveTextContent(
				spelling === 'data-wp-html--x' ? /^B$/ : /^$/
			);
			expect(
				container.querySelectorAll( '[data-wp-router-region]' )
			).toHaveLength( spelling === 'data-wp-html--x' ? 1 : 0 );
		}
	} );

	// The runtime logs each warning once per module, so every region carrying
	// `data-wp-html` stays in this test, the only one expecting the warning.
	test( 'updates and restores a region carrying data-wp-html in either attribute order without writing its token', async () => {
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
			const body = ( content: string ) =>
				`<div data-wp-interactive="${ namespace }" ${ attributes }><p>${ content }</p></div>`;
			const current = hydrateHtml( body( 'current' ) );
			expect( current.innerHTML ).toBe( '<p>current</p>' );
			const previous = `${ url }-previous-${ htmlFirst }`;
			await actions.prefetch( previous, {
				html: pageHtml( body( 'current' ) ),
			} );

			await navigate( body( 'destination' ) );
			expect( current.innerHTML ).toBe( '<p>destination</p>' );

			traverseTo( previous );
			await nextFrames();
			expect( current.innerHTML ).toBe( '<p>current</p>' );
			current.parentElement!.remove();
		}
		expect( console ).toHaveWarnedWith(
			'The data-wp-html directive was ignored because it conflicts with data-wp-router-region.'
		);
	} );

	test( 'never initializes islands in fallback or inserted content inside an updated region', async () => {
		const island = ( text: string ) =>
			`<div data-wp-interactive="${ namespace }" data-wp-init="actions.mark"><p>${ text }</p></div>`;
		store( namespace, {
			state: {
				// Inserted content holding an island that must stay inert.
				html: asDangerousHTML( island( 'inserted' ) ),
			},
		} );
		// The destination declares `state.pending` as derived state the client
		// hasn't defined, so its fallback stays in place.
		const serverData = JSON.stringify( {
			state: { [ namespace ]: { pending: {} } },
			derivedStateClosures: { [ namespace ]: [ 'state.pending' ] },
		} );
		const current = hydrateHtml( regionHtml( '<p>current</p>' ) );

		await navigate(
			regionHtml(
				`<div data-wp-html="state.pending">${ island(
					'fallback'
				) }</div><div data-wp-html="state.html"><p>replaced</p></div>`
			) +
				`<script type="application/json" id="wp-script-module-data-@wordpress/interactivity">${ serverData }</script>`
		);

		const [ fallback, inserted ] =
			current.querySelectorAll( '[data-wp-html]' );
		expect( fallback.querySelector( '[data-wp-init]' ) ).toHaveTextContent(
			/^fallback$/
		);
		expect( inserted.querySelector( '[data-wp-init]' ) ).toHaveTextContent(
			/^inserted$/
		);
		expect( marks ).toBe( 0 );
	} );
} );
