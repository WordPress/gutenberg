import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { privateApis } from '@wordpress/interactivity';
import { closestHtmlDirectiveElement } from '../html-directive-element';

// jsdom has no navigation timing entry; report the empty document as ready.
vi.hoisted( () => {
	vi.spyOn( performance, 'getEntriesByType' ).mockReturnValue( [
		{ domContentLoadedEventStart: 1 } as PerformanceNavigationTiming,
	] );
} );

/** Runtime entry points available to internal consumers. */
const { toVdom } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

/** Default, empty-suffix, unique-ID and suffixed HTML directive spellings. */
const htmlSpellings = [
	'data-wp-html',
	'data-wp-html--',
	'data-wp-html---unique-id',
	'data-wp-html--suffix',
] as const;

/** Bare, empty-suffix, unique-ID and suffixed conflict spellings. */
const conflicts = [ 'text', 'each', 'router-region' ].flatMap( ( prefix ) =>
	[ '', '--', '---', '---unique-id', '--suffix', '----' ].map(
		( suffix ) => `data-wp-${ prefix }${ suffix }`
	)
);

beforeEach( () => {
	vi.stubGlobal( 'SCRIPT_DEBUG', false );
} );

afterEach( () => {
	vi.unstubAllGlobals();
} );

afterAll( () => {
	vi.restoreAllMocks();
} );

describe( 'closestHtmlDirectiveElement', () => {
	it.each(
		htmlSpellings.flatMap( ( html ) =>
			[ '', ...conflicts ].flatMap( ( conflict ) =>
				[ true, false ].map(
					( htmlFirst ) => [ html, conflict, htmlFirst ] as const
				)
			)
		)
	)(
		'classifies %s with conflict %s like toVdom (HTML first: %s)',
		( html, conflict, htmlFirst ) => {
			const island = document.createElement( 'section' );
			island.setAttribute( 'data-wp-interactive', 'test' );
			const target = document.createElement( 'div' );
			const attributes = [ html, conflict ].filter( Boolean );
			if ( ! htmlFirst ) {
				attributes.reverse();
			}
			for ( const name of attributes ) {
				target.setAttribute( name, 'state.value' );
			}
			target.innerHTML = '<span><!--inert-->fallback</span>';
			island.append( target );

			// Conversion removes comments only from content it traverses.
			// Convert the whole island, just as hydration does, and derive
			// ownership from its treatment of the target's actual content.
			toVdom( island );
			const ownsContent = target.innerHTML.includes( '<!--inert-->' );
			expect( closestHtmlDirectiveElement( target ) ).toBe(
				ownsContent ? target : null
			);
		}
	);

	it.each( htmlSpellings )(
		'does not classify %s outside an interactive region',
		( html ) => {
			const target = document.createElement( 'div' );
			target.setAttribute( html, 'state.value' );
			const child = document.createElement( 'span' );
			target.append( child );
			expect( closestHtmlDirectiveElement( target ) ).toBeNull();
			expect( closestHtmlDirectiveElement( child ) ).toBeNull();
		}
	);

	it( 'does not classify each-child content as HTML content', () => {
		const target = document.createElement( 'div' );
		target.setAttribute( 'data-wp-interactive', 'test' );
		target.setAttribute( 'data-wp-each-child', '' );
		const child = document.createElement( 'span' );
		target.append( child );
		expect( closestHtmlDirectiveElement( target ) ).toBeNull();
		expect( closestHtmlDirectiveElement( child ) ).toBeNull();
	} );

	it( 'finds the nearest inclusive HTML ancestor across plain and yielding elements', () => {
		const outer = document.createElement( 'section' );
		outer.setAttribute( 'data-wp-interactive', 'test' );
		outer.setAttribute( 'data-wp-html', 'state.outer' );
		outer.innerHTML =
			'<div data-wp-html---inner="state.inner"><div data-wp-html="state.ignored" data-wp-text--suffix="state.text"><span></span></div></div>';
		const inner = outer.firstElementChild!;
		const yielding = inner.firstElementChild!;
		const child = yielding.firstElementChild!;
		expect( closestHtmlDirectiveElement( outer ) ).toBe( outer );
		expect( closestHtmlDirectiveElement( inner ) ).toBe( inner );
		expect( closestHtmlDirectiveElement( yielding ) ).toBe( inner );
		expect( closestHtmlDirectiveElement( child ) ).toBe( inner );
	} );

	it( 'does not classify an HTML ancestor outside a descendant interactive region', () => {
		const outer = document.createElement( 'div' );
		outer.setAttribute( 'data-wp-html', 'state.value' );
		const island = document.createElement( 'section' );
		island.setAttribute( 'data-wp-interactive', 'test' );
		outer.append( island );
		expect( closestHtmlDirectiveElement( island ) ).toBeNull();
	} );

	it( 'returns null when no HTML ancestor exists', () => {
		expect(
			closestHtmlDirectiveElement( document.createElement( 'div' ) )
		).toBeNull();
	} );

	it( 'returns null when the input is null', () => {
		expect( closestHtmlDirectiveElement( null ) ).toBeNull();
	} );
} );
