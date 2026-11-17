import { describe, expect, it } from 'vitest';
import {
	getOverlayViewports,
	isOverlayResponsive,
	isOverlayAlwaysShown,
	getInlineViewports,
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
