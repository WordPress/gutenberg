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
	mockFetch,
	nextFrames,
	pageHtml,
	quiet,
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
 * @param content    Region content.
 * @param id         Region id within the current namespace.
 * @param attributes Additional attributes on the region element.
 * @param attachTo   Optional attachment selector.
 * @return Region markup.
 */
const regionHtml = (
	content: string,
	id = 'r',
	attributes = '',
	attachTo?: string
) =>
	`<div data-wp-interactive="${ namespace }" data-wp-router-region='${ JSON.stringify(
		{
			// Region signals persist across navigations, so ids must be unique.
			id: `${ namespace }/${ id }`,
			// JSON serialization omits this property for ordinary regions.
			attachTo,
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
	test.each( [ 'direct', 'prefetched' ] )(
		'treats a destination region in a fallback as missing on %s navigation',
		async ( mode ) => {
			const current = hydrateHtml( regionHtml( '<p>current</p>' ) );
			const destination = `<div data-wp-html="state.html">${ regionHtml(
				'<p>nested</p>',
				'r',
				'data-wp-init="actions.mark"'
			) }</div>`;

			if ( mode === 'prefetched' ) {
				const requests = mockFetch();
				const prefetch = actions.prefetch( url );
				requests[ 0 ].respond( pageHtml( destination ) );
				await prefetch;
				await actions.navigate( url, quiet );
				await nextFrames();
			} else {
				await navigate( destination );
			}

			expect( current.isConnected ).toBe( false );
			expect( document.body ).not.toHaveTextContent( 'current' );
			expect( document.body ).not.toHaveTextContent( 'nested' );
			expect( marks ).toBe( 0 );
		}
	);

	test( 'does not attach a destination region inside a fallback', async () => {
		const target = document.createElement( 'div' );
		target.id = 'attach-target';
		document.body.appendChild( target );

		await navigate(
			`<div data-wp-html="state.html">${ regionHtml(
				'<p>nested</p>',
				'r',
				'data-wp-init="actions.mark"',
				'#attach-target'
			) }</div>`
		);

		expect( target ).toBeEmptyDOMElement();
		expect( marks ).toBe( 0 );
	} );

	test( 'removes a current region when its destination copy is in HTML content inside another region', async () => {
		const current = hydrateHtml( regionHtml( '<p>current</p>' ) );
		const outer = hydrateHtml( regionHtml( '<p>old outer</p>', 'outer' ) );

		await navigate(
			regionHtml(
				`<div data-wp-html="state.html">${ regionHtml(
					'<p>nested</p>',
					'r',
					'data-wp-init="actions.mark"'
				) }</div>`,
				'outer'
			)
		);

		expect( current.isConnected ).toBe( false );
		expect( document.body ).not.toHaveTextContent( 'current' );
		expect( outer ).toHaveTextContent( 'nested' );
		expect( outer.querySelector( '[data-wp-html]' ) ).toHaveTextContent(
			'nested'
		);
		expect( marks ).toBe( 0 );
	} );

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

describe( 'attachTo targets', () => {
	test.each( [ 'content', 'element', 'absent' ] )(
		'skips a region with only an ineligible %s target while updating other regions',
		async ( targetPosition ) => {
			const protectedElement = document.createElement( 'div' );
			protectedElement.setAttribute( 'data-wp-html', 'state.html' );
			protectedElement.innerHTML = '<div>unchanged</div>';
			if ( targetPosition === 'content' ) {
				protectedElement.firstElementChild!.id = 'attach-target';
			} else if ( targetPosition === 'element' ) {
				protectedElement.id = 'attach-target';
			}
			document.body.appendChild( protectedElement );
			const fallback = protectedElement.innerHTML;
			const current = hydrateHtml( regionHtml( '<p>current</p>', 's' ) );

			await navigate(
				regionHtml(
					'<p>attached</p>',
					'r',
					'data-wp-init="actions.mark"',
					'#attach-target'
				) + regionHtml( '<p>destination</p>', 's' )
			);

			expect( protectedElement.innerHTML ).toBe( fallback );
			expect( current.innerHTML ).toBe( '<p>destination</p>' );
			expect( marks ).toBe( 0 );
		}
	);

	test( 'attaches to the first eligible match after a match inside HTML content', async () => {
		const container = document.createElement( 'div' );
		container.innerHTML =
			'<div data-wp-html="state.html"><div class="target">protected</div></div><div class="target">eligible</div>';
		document.body.appendChild( container );
		const [ protectedTarget, eligibleTarget ] =
			container.querySelectorAll( '.target' );

		await navigate(
			regionHtml(
				'<p>attached</p>',
				'r',
				'data-wp-init="actions.mark"',
				'.target'
			)
		);

		expect( protectedTarget.innerHTML ).toBe( 'protected' );
		expect( eligibleTarget.querySelector( 'p' ) ).toHaveTextContent(
			'attached'
		);
		expect( marks ).toBe( 1 );
	} );
} );
