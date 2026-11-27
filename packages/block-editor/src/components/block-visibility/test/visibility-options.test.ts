import { describe, expect, it } from 'vitest';
import {
	applyVisibilityChanges,
	getVisibilityOptions,
	getVisibilityOptionState,
} from '../visibility-options';
import { getConfiguredViewportRanges, getSavedViewportRanges } from '../ranges';
import { getBlockVisibilityLabel } from '../utils';
import type { ViewportSettings } from '../ranges';

const settings: ViewportSettings = {
	ranges: [
		{ id: 'mobile', label: 'Mobile', maxWidth: '480px' },
		{ id: 'tablet', label: 'Tablet', maxWidth: '782px' },
		{ id: 'desktop', label: 'Desktop', maxWidth: '1024px' },
		{ id: 'desktop-large', label: 'Desktop large', maxWidth: null },
	],
};
const desktopLegacy = { viewport: { desktop: false } };
const desktopLarge = { id: 'desktop-large', min: 1024, max: null };
const savedLarge = {
	viewportRanges: { version: 1 as const, hidden: [ desktopLarge ] },
};

describe( 'Configurable block visibility ranges', () => {
	it( 'projects a saved Desktop rule onto both desktop checkboxes', () => {
		const options = getVisibilityOptions( settings, [ desktopLegacy ] );
		expect( options.map( ( option ) => option.label ) ).toEqual( [
			'Mobile',
			'Tablet',
			'Desktop',
			'Desktop large',
		] );
		expect(
			options.map( ( option ) =>
				getVisibilityOptionState( [ desktopLegacy ], option )
			)
		).toEqual( [ false, false, true, true ] );
		expect( applyVisibilityChanges( desktopLegacy, options, {} ) ).toEqual(
			desktopLegacy
		);
	} );

	it( 'converts a legacy rule only when a mapped checkbox is cleared', () => {
		const options = getVisibilityOptions( settings, [ desktopLegacy ] );
		const desktop = options[ 2 ];
		const updated = applyVisibilityChanges( desktopLegacy, options, {
			[ desktop.key ]: false,
		} );
		expect( updated ).toEqual( { viewport: {}, ...savedLarge } );
	} );

	it( 'preserves per-block choices when toggling a different range in a mixed selection', () => {
		const selected = [ desktopLegacy, undefined ];
		const options = getVisibilityOptions( settings, selected );
		expect( getVisibilityOptionState( selected, options[ 3 ] ) ).toBeNull();
		const changes = { [ options[ 0 ].key ]: true };
		const first = applyVisibilityChanges( selected[ 0 ], options, changes );
		const second = applyVisibilityChanges(
			selected[ 1 ],
			options,
			changes
		);
		expect( first ).toMatchObject( desktopLegacy );
		expect( second ).toMatchObject( { viewport: {} } );
		expect( getSavedViewportRanges( first ) ).toEqual(
			getSavedViewportRanges( second )
		);
		expect( getSavedViewportRanges( first ) ).toEqual( [
			{ id: 'mobile', min: null, max: 480 },
		] );
	} );

	it( 'offers a separate, editable legacy rule when the custom ranges only partly overlap it', () => {
		const options = getVisibilityOptions(
			{ ...settings, mobile: '480px', tablet: '900px' },
			[ desktopLegacy ]
		);
		expect( options[ 4 ].label ).toContain( '900px' );
		expect(
			getVisibilityOptionState( [ desktopLegacy ], options[ 4 ] )
		).toBe( true );
		expect(
			getVisibilityOptionState( [ desktopLegacy ], options[ 2 ] )
		).toBe( false );
	} );

	it( 'keeps the saved range editable when the theme changes its width or removes it', () => {
		const old = savedLarge;
		for ( const configured of [
			undefined,
			{
				ranges: [
					{ id: 'mobile', label: 'Mobile', maxWidth: '1080px' },
					{
						id: 'desktop-large',
						label: 'Desktop large',
						maxWidth: null,
					},
				],
			},
		] ) {
			const options = getVisibilityOptions( configured, [ old ] );
			const saved = options.at( -1 )!;
			expect( saved.label ).toContain( '1024px' );
			expect( getVisibilityOptionState( [ old ], saved ) ).toBe( true );
			expect(
				getSavedViewportRanges(
					applyVisibilityChanges( old, options, {
						[ saved.key ]: false,
					} )
				)
			).toEqual( [] );
		}
		expect( getBlockVisibilityLabel( old, settings ) ).toBe(
			'Block is hidden on Desktop large'
		);
	} );

	it( 'rejects duplicate IDs, descending widths, invalid CSS, and a bounded final range', () => {
		const entries = settings.ranges!;
		for ( const ranges of [
			[ entries[ 0 ], { ...entries[ 3 ], id: 'mobile' } ],
			[ entries[ 1 ], entries[ 0 ], entries[ 3 ] ],
			[
				{ ...entries[ 0 ], maxWidth: '480px, (width > 0px)' },
				entries[ 3 ],
			],
			[ entries[ 0 ] ],
		] ) {
			expect( getConfiguredViewportRanges( { ranges } ) ).toEqual( [] );
		}
	} );
} );
