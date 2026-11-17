import { afterEach, describe, expect, it, vi } from 'vitest';
import { addFilter, removeAllFilters } from '@wordpress/hooks';
import {
	getOverlayViewports,
	getFilteredOverlayViewports,
	isOverlayResponsive,
	isOverlayAlwaysShown,
	getInlineViewports,
	getOverlayEditingViewport,
} from '../overlay-viewports';

describe( 'getOverlayViewports', () => {
	it.each( [
		[ 'never', { mobile: false, tablet: false, desktop: false } ],
		[ 'always', { mobile: true, tablet: true, desktop: true } ],
		[ 'tablet', { mobile: true, tablet: true, desktop: false } ],
	] )( 'maps %s to a viewport map', ( overlayMenu, expected ) => {
		expect( getOverlayViewports( { overlayMenu } ) ).toEqual( expected );
	} );

	it.each( [
		'mobile',
		undefined,
		42,
		[],
		'nonsense',
		'tablet}body{display:none',
	] )( 'returns null (default 600px behavior) for %p', ( overlayMenu ) => {
		expect( getOverlayViewports( { overlayMenu } ) ).toBeNull();
	} );

	it( 'returns null when called without attributes', () => {
		expect( getOverlayViewports() ).toBeNull();
	} );

	it( 'returns null when called with null attributes', () => {
		expect( getOverlayViewports( null ) ).toBeNull();
	} );
} );

// The editor derives `isResponsive` and `isHiddenByDefault` this way. Matches
// the PHP test_overlay_menu_markup() cases.
describe( 'overlay visibility for each overlayMenu value', () => {
	it.each( [
		[ undefined, true, false ],
		[ 'mobile', true, false ],
		[ 'tablet', true, false ],
		[ 'always', true, true ],
		[ 'never', false, false ],
	] )(
		'%p is responsive: %p, always shown: %p',
		( overlayMenu, isResponsive, isAlwaysShown ) => {
			const overlayViewports = getOverlayViewports( { overlayMenu } );
			expect( isOverlayResponsive( overlayViewports ) ).toBe(
				isResponsive
			);
			expect( isOverlayAlwaysShown( overlayViewports ) ).toBe(
				isAlwaysShown
			);
		}
	);
} );

describe( 'overlay viewport helpers', () => {
	const tablet = { mobile: true, tablet: true, desktop: false };
	const never = { mobile: false, tablet: false, desktop: false };
	const always = { mobile: true, tablet: true, desktop: true };

	it( 'treats null and any true viewport as responsive', () => {
		expect( isOverlayResponsive( null ) ).toBe( true );
		expect( isOverlayResponsive( tablet ) ).toBe( true );
		expect( isOverlayResponsive( never ) ).toBe( false );
	} );

	it( 'is always shown only when every viewport is true', () => {
		expect( isOverlayAlwaysShown( always ) ).toBe( true );
		expect( isOverlayAlwaysShown( tablet ) ).toBe( false );
		expect( isOverlayAlwaysShown( null ) ).toBe( false );
	} );

	it( 'lists the viewports where links are inline', () => {
		expect( getInlineViewports( tablet ) ).toEqual( [ 'desktop' ] );
		expect( getInlineViewports( null ) ).toEqual( [] );
		expect( getInlineViewports( never ) ).toEqual( [] );
		expect( getInlineViewports( always ) ).toEqual( [] );
	} );

	it( 'lists inline viewports for a non-contiguous overlay map', () => {
		expect(
			getInlineViewports( { mobile: false, tablet: true, desktop: true } )
		).toEqual( [ 'mobile' ] );
	} );

	// Matches the PHP test_overlay_viewport_helpers_read_only_canonical_keys()
	// cases: only the canonical keys are read, a viewport shows the overlay
	// only when strictly `true`, and the links inline only when strictly `false`.
	it.each( [
		[ 'empty map', {}, false, false, [] ],
		[ 'partial map', { mobile: true, tablet: true }, true, false, [] ],
		[
			'reordered keys',
			{ desktop: false, tablet: true, mobile: true },
			true,
			false,
			[ 'desktop' ],
		],
		[
			'reordered non-contiguous',
			{ desktop: true, tablet: true, mobile: false },
			true,
			false,
			[ 'mobile' ],
		],
		[
			'extra key with tablet',
			{ mobile: true, tablet: true, desktop: false, wide: false },
			true,
			false,
			[ 'desktop' ],
		],
		[
			'extra false key with always',
			{ mobile: true, tablet: true, desktop: true, wide: false },
			true,
			true,
			[],
		],
		[
			'extra true key with never',
			{ mobile: false, tablet: false, desktop: false, wide: true },
			false,
			false,
			[],
		],
	] )(
		'reads only the canonical keys for %s',
		( _name, overlayViewports, isResponsive, isAlwaysShown, inline ) => {
			expect( isOverlayResponsive( overlayViewports ) ).toBe(
				isResponsive
			);
			expect( isOverlayAlwaysShown( overlayViewports ) ).toBe(
				isAlwaysShown
			);
			expect( getInlineViewports( overlayViewports ) ).toEqual( inline );
		}
	);
} );

describe( 'getOverlayEditingViewport', () => {
	it.each( [
		[ 'null (default 600px behavior)', null, true, 'mobile' ],
		[
			'never',
			{ mobile: false, tablet: false, desktop: false },
			true,
			undefined,
		],
		[
			'always',
			{ mobile: true, tablet: true, desktop: true },
			true,
			undefined,
		],
		[
			'tablet with a tablet breakpoint',
			{ mobile: true, tablet: true, desktop: false },
			true,
			'tablet',
		],
		[
			'tablet without a tablet breakpoint',
			{ mobile: true, tablet: true, desktop: false },
			false,
			'mobile',
		],
		[
			'tablet only, with a tablet breakpoint',
			{ mobile: false, tablet: true, desktop: false },
			true,
			'tablet',
		],
		[
			'tablet only, without a tablet breakpoint',
			{ mobile: false, tablet: true, desktop: false },
			false,
			undefined,
		],
		[
			'mobile and desktop',
			{ mobile: true, tablet: false, desktop: true },
			true,
			undefined,
		],
		[
			'desktop only',
			{ mobile: false, tablet: false, desktop: true },
			true,
			undefined,
		],
		[ 'empty map', {}, true, undefined ],
		[
			'truthy values that are not strictly true',
			{ mobile: 1, tablet: 'yes', desktop: false },
			true,
			undefined,
		],
	] )(
		'returns the preview for %s',
		( _name, overlayViewports, hasTabletViewport, expected ) => {
			expect(
				getOverlayEditingViewport(
					overlayViewports as Parameters<
						typeof getOverlayEditingViewport
					>[ 0 ],
					{ hasTabletViewport }
				)
			).toBe( expected );
		}
	);
} );

describe( 'getFilteredOverlayViewports', () => {
	const HOOK = 'blocks.navigation.overlayViewports';

	afterEach( () => {
		removeAllFilters( HOOK );
	} );

	it( 'returns the unfiltered viewports when no filter is registered', () => {
		for ( const overlayMenu of [ 'never', 'mobile', 'tablet', 'always' ] ) {
			expect(
				getFilteredOverlayViewports( { overlayMenu }, 'client-1' )
			).toEqual( getOverlayViewports( { overlayMenu } ) );
		}
	} );

	it( 'passes the resolved viewports, the attributes and the client ID to the filter', () => {
		const callback = vi.fn( ( value ) => value );
		addFilter( HOOK, 'test/overlay-viewports', callback );
		const attributes = { overlayMenu: 'tablet', ref: 12 };

		getFilteredOverlayViewports( attributes, 'client-1' );

		expect( callback ).toHaveBeenCalledWith(
			{ mobile: true, tablet: true, desktop: false },
			attributes,
			'client-1'
		);
	} );

	it( 'passes null to the filter for the default behavior', () => {
		const callback = vi.fn( ( value ) => value );
		addFilter( HOOK, 'test/overlay-viewports', callback );

		getFilteredOverlayViewports( { overlayMenu: 'mobile' }, 'client-1' );

		expect( callback ).toHaveBeenCalledWith(
			null,
			{ overlayMenu: 'mobile' },
			'client-1'
		);
	} );

	it( 'skips the filter for a block inside an overlay', () => {
		const callback = vi.fn( () => ( {
			mobile: true,
			tablet: true,
			desktop: true,
		} ) );
		addFilter( HOOK, 'test/overlay-viewports', callback );

		expect(
			getFilteredOverlayViewports(
				{ overlayMenu: 'always' },
				'client-1',
				{ isWithinOverlay: true }
			)
		).toEqual( { mobile: false, tablet: false, desktop: false } );
		expect( callback ).not.toHaveBeenCalled();
	} );

	it( 'lets a filter replace the default behavior with a viewport map', () => {
		addFilter( HOOK, 'test/overlay-viewports', () => ( {
			mobile: true,
			tablet: true,
			desktop: false,
		} ) );

		expect(
			getFilteredOverlayViewports( { overlayMenu: 'mobile' }, 'client-1' )
		).toEqual( { mobile: true, tablet: true, desktop: false } );
	} );

	it( 'lets a filter return null for the default behavior', () => {
		addFilter( HOOK, 'test/overlay-viewports', () => null );

		expect(
			getFilteredOverlayViewports( { overlayMenu: 'tablet' }, 'client-1' )
		).toBeNull();
	} );

	it.each( [
		[ 'a string', '900px' ],
		[ 'a partial map', { mobile: true } ],
		[ 'non-boolean values', { mobile: 1, tablet: 'yes', desktop: false } ],
		[ 'an array', [ true, true, false ] ],
		[ 'undefined', undefined ],
	] )(
		'ignores %s and keeps the unfiltered viewports',
		( _name, filtered ) => {
			addFilter( HOOK, 'test/overlay-viewports', () => filtered );

			expect(
				getFilteredOverlayViewports(
					{ overlayMenu: 'tablet' },
					'client-1'
				)
			).toEqual( { mobile: true, tablet: true, desktop: false } );
		}
	);

	it( 'keeps only the known viewports from a returned map', () => {
		addFilter( HOOK, 'test/overlay-viewports', () => ( {
			mobile: true,
			tablet: false,
			desktop: false,
			wide: true,
		} ) );

		const result = getFilteredOverlayViewports(
			{ overlayMenu: 'never' },
			'client-1'
		);

		expect( result ).toEqual( {
			mobile: true,
			tablet: false,
			desktop: false,
		} );
	} );

	it( 'returns a copy of the map the filter returned', () => {
		const filtered = { mobile: true, tablet: true, desktop: false };
		addFilter( HOOK, 'test/overlay-viewports', () => filtered );

		const result = getFilteredOverlayViewports(
			{ overlayMenu: 'never' },
			'client-1'
		);
		filtered.desktop = true;

		expect( result ).not.toBe( filtered );
		expect( result ).toEqual( {
			mobile: true,
			tablet: true,
			desktop: false,
		} );
	} );
} );
