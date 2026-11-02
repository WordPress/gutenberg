/** Navigation resolves attachment targets against the live, interactive DOM. */
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
	vi,
} from 'vitest';
import { asDangerousHTML, privateApis, store } from '@wordpress/interactivity';
import { actions, state } from '../index';
import { hydrateHtml, nextFrames, pageHtml, quiet } from './fixtures/helpers';

// Supply only the browser APIs that jsdom cannot run.
await vi.hoisted( async () => {
	await import( './fixtures/jsdom-setup' );
	// jsdom has no innerText; titles contain only text, with no layout to model.
	Object.defineProperty( HTMLTitleElement.prototype, 'innerText', {
		/** Returns the title text that browsers expose through innerText. */
		get() {
			return this.textContent;
		},
		// Allow the isolated test environment to release the shim.
		configurable: true,
	} );
} );

// History entries belong to the runtime session, as on an initially loaded page.
const { sessionId } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

// Stores, region signals and cached URLs persist for the lifetime of the module.
let testCount = 0;
// Namespace identifying the current test's independent regions and pages.
let namespace: string;
// Hydrated common region, updated on every navigation.
let current: Element;
// Persistent HTML owner outside the common region.
let htmlOwner: Element;
// Original inert content, which attachment must never alter.
let inertContent: string;
// Initial body markup for exact no-append comparisons during skipped renders.
let initialContent: string;
// Browser errors observed during the current test.
let errors: Event[];

/**
 * Records browser errors without suppressing their normal reporting.
 *
 * @param event Browser error or unhandled rejection event.
 * @return Number of recorded events.
 */
const recordError = ( event: Event ) => errors.push( event );

/**
 * Builds a region in the current namespace.
 *
 * @param id       Region id within the namespace.
 * @param content  Region content.
 * @param attachTo Optional attachment selector.
 * @return Interactive region markup.
 */
const regionHtml = ( id: string, content: string, attachTo?: string ) =>
	`<div data-wp-interactive="${ namespace }" data-wp-router-region='${ JSON.stringify(
		{
			// Signal key isolated from other tests.
			id: `${ namespace }/${ id }`,
			// Target resolved anew on each render.
			attachTo,
		}
	) }'>${ content }</div>`;

/**
 * Builds a titled page with the common region and an optional overlay.
 *
 * @param letter   Page title and common region content.
 * @param attachTo Optional overlay target; omission means no overlay.
 * @return Complete destination document.
 */
const destination = ( letter: string, attachTo?: string ) =>
	pageHtml(
		regionHtml( 's', `<p>${ letter }</p>` ) +
			( attachTo === undefined
				? ''
				: regionHtml(
						'o',
						`<p data-overlay>overlay ${ letter }</p>`,
						attachTo
					) )
	).replace( '<title>t</title>', `<title>${ letter }</title>` );

/**
 * Returns a unique page URL for this test.
 *
 * @param letter Page name.
 * @return Absolute URL.
 */
const pageUrl = ( letter: string ) =>
	`http://localhost/${ namespace }/${ letter }`;

/**
 * Navigates through the public action and lets directive effects finish.
 *
 * @param letter   Destination name.
 * @param attachTo Optional destination overlay target.
 * @return Promise resolving after navigation and scheduled effects.
 */
const navigate = async ( letter: string, attachTo?: string ) => {
	await expect(
		actions.navigate( pageUrl( letter ), {
			...quiet,
			html: destination( letter, attachTo ),
		} )
	).resolves.toBeUndefined();
	await nextFrames();
};

/**
 * Exercises the browser history API and the router's popstate listener.
 *
 * @param direction History traversal direction.
 * @return Promise resolving after traversal and router effects.
 */
const traverse = async ( direction: 'back' | 'forward' ) => {
	const popped = new Promise< void >( ( resolve ) =>
		window.addEventListener( 'popstate', () => resolve(), { once: true } )
	);
	window.history[ direction ]();
	await popped;
	await nextFrames();
};

/**
 * Checks the consumer-visible result of a completed page transition.
 *
 * @param letter Expected destination name.
 */
const expectPage = ( letter: string ) => {
	expect( current.innerHTML ).toBe( `<p>${ letter }</p>` );
	expect( document.title ).toBe( letter );
	expect( window.location.href ).toBe( pageUrl( letter ) );
	expect( state.url ).toBe( pageUrl( letter ) );
	expect( state.navigating ).toBe( false );
	expect( inertContent ).toBe( '<div class="target">inert</div>' );
	expect( htmlOwner.innerHTML ).toBe( inertContent );
	expect( errors ).toEqual( [] );
};

/**
 * Checks that only the common region changed, with no appended element anywhere.
 *
 * @param letter Expected destination name.
 */
const expectSkippedPage = ( letter: string ) => {
	expectPage( letter );
	expect( document.body.innerHTML ).toBe(
		initialContent.replace( '<p>A</p>', `<p>${ letter }</p>` )
	);
};

beforeAll( nextFrames );

beforeEach( async () => {
	// Attachment fragments are keyed by parent identity, including body itself.
	document.body.replaceWith( document.createElement( 'body' ) );
	namespace = `test/router-attach-${ ++testCount }`;
	store( namespace, {
		state: {
			// Trusted inserted HTML remains opaque to hydration and attachment.
			html: asDangerousHTML( '<div class="target">inert</div>' ),
		},
	} );
	errors = [];
	window.addEventListener( 'error', recordError );
	window.addEventListener( 'unhandledrejection', recordError );
	window.history.replaceState(
		{ wpInteractivityId: sessionId },
		'',
		pageUrl( 'A' )
	);
	document.title = 'A';
	current = hydrateHtml( regionHtml( 's', '<p>A</p>' ) );
	const island = hydrateHtml(
		`<section data-wp-interactive="${ namespace }"><div class="owner" data-wp-html="state.html"><div class="target">inert</div></div></section>`
	);
	htmlOwner = island.firstElementChild!;
	inertContent = htmlOwner.innerHTML;
	initialContent = document.body.innerHTML;
	// Fixtures hydrate after module initialization, so seed their initial page.
	await actions.prefetch( pageUrl( 'A' ), { html: destination( 'A' ) } );
} );

afterEach( () => {
	window.removeEventListener( 'error', recordError );
	window.removeEventListener( 'unhandledrejection', recordError );
} );

describe( 'attachment targets', () => {
	for ( const selector of [ '.target', '.owner' ] ) {
		test( `attaches to the first usable match after inert ${ selector } matches`, async () => {
			const outside = document.createElement( 'div' );
			outside.className = selector.slice( 1 );
			document.body.appendChild( outside );
			const later = outside.cloneNode() as Element;
			document.body.appendChild( later );
			await navigate( 'B', selector );
			expectPage( 'B' );
			const expected = document.createElement( 'div' );
			expected.innerHTML = regionHtml(
				'o',
				'<p data-overlay>overlay B</p>',
				selector
			);
			expect( outside.innerHTML ).toBe( expected.innerHTML );
			expect( later ).toBeEmptyDOMElement();
			expect(
				document.querySelectorAll( '[data-overlay]' )
			).toHaveLength( 1 );
		} );
	}

	for ( const selector of [ '#missing', '.target', '.owner', '[[' ] ) {
		test( `completes navigation and cached Back/Forward without an unusable ${ selector } attachment, then attaches once`, async () => {
			await navigate( 'B', selector );
			expectSkippedPage( 'B' );
			expect(
				document.querySelectorAll( '[data-overlay]' )
			).toHaveLength( 0 );
			await traverse( 'back' );
			expectSkippedPage( 'A' );
			await traverse( 'forward' );
			expectSkippedPage( 'B' );
			await navigate( 'C' );
			expectSkippedPage( 'C' );
			await traverse( 'back' );
			expectSkippedPage( 'B' );
			await traverse( 'forward' );
			expectSkippedPage( 'C' );
			expect(
				document.querySelectorAll( '[data-overlay]' )
			).toHaveLength( 0 );
			// Control: a region attached on its first attempt, to compare with
			// the retried attachment below.
			await actions.navigate( pageUrl( 'control' ), {
				...quiet,
				html: pageHtml(
					regionHtml( 's', '<p>control</p>' ) +
						regionHtml(
							'direct',
							'<p data-overlay>overlay D</p>',
							'body'
						)
				),
			} );
			await nextFrames();
			const directContent =
				document.querySelector( '[data-overlay]' )!.parentElement!
					.innerHTML;
			await navigate( 'D', 'body' );
			expectPage( 'D' );
			const overlays = document.querySelectorAll( '[data-overlay]' );
			expect( overlays ).toHaveLength( 1 );
			expect( overlays[ 0 ].parentElement!.innerHTML ).toBe(
				directContent
			);
			expect(
				overlays[ 0 ].closest( '[data-wp-router-region]' )!
					.parentElement
			).toBe( document.body );
		} );

		test( `clears an earlier attachment when its destination target ${ selector } is unusable, like an absent region`, async () => {
			await navigate( 'D', 'body' );
			expectPage( 'D' );
			expect(
				document.querySelectorAll( '[data-overlay]' )
			).toHaveLength( 1 );
			await navigate( 'C' );
			expectPage( 'C' );
			const absentContent = document.body.innerHTML;
			await navigate( 'B', selector );
			expectPage( 'B' );
			expect( document.body.innerHTML ).toBe(
				absentContent.replace( '<p>C</p>', '<p>B</p>' )
			);
			expect(
				document.querySelectorAll( '[data-overlay]' )
			).toHaveLength( 0 );
		} );
	}

	for ( const selector of [ '#missing', '.target' ] ) {
		test( `resolves cached ${ selector } attachments again when the live target becomes usable`, async () => {
			await navigate( 'B', selector );
			expectSkippedPage( 'B' );
			await navigate( 'C' );
			expectSkippedPage( 'C' );
			const target = document.createElement( 'div' );
			if ( selector === '#missing' ) {
				target.id = 'missing';
			} else {
				target.className = 'target';
			}
			document.body.appendChild( target );
			await traverse( 'back' );
			expectPage( 'B' );
			expect( target.children ).toHaveLength( 1 );
			expect( target.firstElementChild!.innerHTML ).toBe(
				'<p data-overlay="">overlay B</p>'
			);
			await traverse( 'forward' );
			expectPage( 'C' );
			expect( target ).toBeEmptyDOMElement();
		} );
	}
} );
