import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ColorSpace } from 'colorjs.io/fn';

describe( 'color-space registration', () => {
	const originalRegistry = ColorSpace.registry;

	beforeEach( () => {
		vi.resetModules();
		ColorSpace.registry = {};
	} );

	afterEach( () => {
		ColorSpace.registry = originalRegistry;
	} );

	it( 'imports the ramp builders without registering color spaces', async () => {
		await import( '..' );
		expect( Object.keys( ColorSpace.registry ) ).toEqual( [] );
	} );

	it.each( [
		'assertValidSeedColor',
		'clampToGamut',
		'getColorString',
		'getContrast',
		'getRelativeLuminance',
	] as const )( '%s works without prior registration', async ( name ) => {
		const utils = await import( '../lib/color-utils' );
		// Do not let an import-time registration satisfy the utility's needs.
		ColorSpace.registry = {};

		switch ( name ) {
			case 'assertValidSeedColor':
				expect( () =>
					utils.assertValidSeedColor( '#3858e9' )
				).not.toThrow();
				break;
			case 'clampToGamut':
				expect( utils.clampToGamut( '#3858e9' ).space.id ).toBe(
					'oklch'
				);
				break;
			case 'getColorString':
				expect( utils.getColorString( '#3858e9' ) ).toBe( '#3858e9' );
				break;
			case 'getContrast':
				expect( utils.getContrast( '#000000', '#ffffff' ) ).toBeCloseTo(
					21
				);
				break;
			case 'getRelativeLuminance':
				expect( utils.getRelativeLuminance( '#ffffff' ) ).toBeCloseTo(
					1
				);
				break;
		}
	} );

	it( 'builds a background ramp without prior registration', async () => {
		const { buildBgRamp } = await import( '..' );
		ColorSpace.registry = {};

		const result = buildBgRamp( '#fcfcfc' );

		expect( result.ramp.surface2 ).toBe( '#fcfcfc' );
		expect( result.warnings ).toBeUndefined();
	} );

	it( 'rebuilds surfaces and strokes without prior registration', async () => {
		const { buildBgRamp } = await import( '..' );
		const { buildPerceptualSteps } = await import(
			'../lib/build-perceptual-steps'
		);
		const background = buildBgRamp( '#fcfcfc' );
		ColorSpace.registry = {};

		const result = buildPerceptualSteps( background );

		expect( result.ramp.surface2 ).toBe( background.ramp.surface2 );
		expect( result.warnings ).toBeUndefined();
	} );

	it.each( [ 'full', 'interactive', 'status' ] as const )(
		'builds %s accent ramps from a supplied background without prior registration',
		async ( purpose ) => {
			const { buildBgRamp, buildAccentRamp } = await import( '..' );
			const background = buildBgRamp( '#fcfcfc' );
			ColorSpace.registry = {};

			const result = buildAccentRamp( '#3858e9', background, purpose );

			expect( result.ramp.fgSurface4 ).toMatch( /^#[\da-f]{6}$/ );
			expect( result.warnings ).toBeUndefined();
		}
	);
} );
