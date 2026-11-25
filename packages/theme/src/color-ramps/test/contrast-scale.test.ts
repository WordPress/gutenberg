import { describe, expect, it } from 'vitest';
import {
	contrastToExponent,
	getContrastThresholds,
	getRampConfigs,
	K_MAX,
	K_MIN,
	quantizeContrast,
	scaleBackgroundSeed,
} from '../lib/contrast-scale';
import { ACCENT_RAMP_CONFIG, BG_RAMP_CONFIG } from '../lib/ramp-configs';
import { getContrast } from '../lib/color-utils';

const LEVELS = Array.from( { length: 21 }, ( _, i ) => ( i - 10 ) / 10 );

describe( 'quantizeContrast', () => {
	it( 'rounds to steps of 0.1 and clamps to -1..1', () => {
		expect( quantizeContrast( 0.44 ) ).toBe( 0.4 );
		expect( quantizeContrast( 0.45 ) ).toBe( 0.5 );
		expect( quantizeContrast( -0.26 ) ).toBe( -0.3 );
		expect( quantizeContrast( 3 ) ).toBe( 1 );
		expect( quantizeContrast( -3 ) ).toBe( -1 );
	} );

	it( 'treats missing and non-finite values as 0, never -0', () => {
		expect( quantizeContrast( undefined ) ).toBe( 0 );
		expect( quantizeContrast( NaN ) ).toBe( 0 );
		expect( quantizeContrast( Infinity ) ).toBe( 0 );
		expect( Object.is( quantizeContrast( -0.04 ), 0 ) ).toBe( true );
	} );
} );

describe( 'contrastToExponent', () => {
	it( 'maps -1, 0 and 1 onto K_MIN, 1 and K_MAX', () => {
		expect( contrastToExponent( -1 ) ).toBeCloseTo( K_MIN );
		expect( contrastToExponent( 0 ) ).toBe( 1 );
		expect( contrastToExponent( 1 ) ).toBeCloseTo( K_MAX );
	} );

	it( 'applies a sensitivity on each side of 0 independently', () => {
		expect( contrastToExponent( -1, 3 ) ).toBeCloseTo(
			1 - 3 * ( 1 - K_MIN )
		);
		expect( contrastToExponent( 1, 3 ) ).toBeCloseTo( K_MAX );
		expect( contrastToExponent( -1, 0 ) ).toBe( 1 );
		expect( contrastToExponent( 1, 1, 0 ) ).toBe( 1 );
	} );
} );

describe( 'getRampConfigs', () => {
	it( 'returns the original configs at 0', () => {
		const { bg, accent } = getRampConfigs( 0 );
		expect( bg ).toBe( BG_RAMP_CONFIG );
		expect( accent ).toBe( ACCENT_RAMP_CONFIG );
	} );

	it( 'returns the same objects for the same value', () => {
		expect( getRampConfigs( 0.3 ) ).toBe( getRampConfigs( 0.3 ) );
	} );

	it( 'keeps every target at or above 1 and in the same order as at 0', () => {
		const steps = Object.keys( BG_RAMP_CONFIG ) as Array<
			keyof typeof BG_RAMP_CONFIG
		>;
		const byBaseTarget = [ ...steps ].sort(
			( a, b ) =>
				BG_RAMP_CONFIG[ a ].contrast.target -
				BG_RAMP_CONFIG[ b ].contrast.target
		);
		for ( const level of LEVELS ) {
			const { bg } = getRampConfigs( level );
			for ( const step of steps ) {
				expect( bg[ step ].contrast.target ).toBeGreaterThanOrEqual(
					1
				);
			}
			// Steps on the shared curve keep their order.
			const shared = byBaseTarget.filter(
				( step ) =>
					! step.startsWith( 'stroke' ) &&
					! step.startsWith( 'fgFill' ) &&
					! step.startsWith( 'bgFillInverted' )
			);
			for ( let i = 1; i < shared.length; i++ ) {
				expect(
					bg[ shared[ i ] ].contrast.target
				).toBeGreaterThanOrEqual(
					bg[ shared[ i - 1 ] ].contrast.target
				);
			}
		}
	} );

	it( 'keeps text on solid fills at its standard target below 0', () => {
		for ( const level of [ -1, -0.5, -0.1 ] ) {
			const { bg, accent } = getRampConfigs( level );
			for ( const step of [
				'fgFill',
				'fgFillInverted',
				'fgFillDark',
			] as const ) {
				expect( bg[ step ].contrast.target ).toBe(
					BG_RAMP_CONFIG[ step ].contrast.target
				);
				expect( accent[ step ].contrast.target ).toBe(
					ACCENT_RAMP_CONFIG[ step ].contrast.target
				);
				expect( bg[ step ].contrast.skipSeedAdjustment ).toBe( true );
			}
		}
		expect( getRampConfigs( 1 ).bg.fgFill.contrast.target ).toBeGreaterThan(
			BG_RAMP_CONFIG.fgFill.contrast.target
		);
	} );

	it( 'softens strokes faster than other steps below 0, with floors', () => {
		const { bg, accent } = getRampConfigs( -1 );
		// Shared curve: 3 ** 0.75 is about 2.28; the stroke curve reaches the
		// 1.5 floor instead.
		expect( bg.stroke3.contrast.target ).toBe( 1.5 );
		// The accent `stroke3` provides the focus ring, so it keeps 3:1.
		expect( accent.stroke3.contrast.target ).toBe( 3 );
		for ( const config of [ bg, accent ] ) {
			expect( config.stroke1.minimumContrastWith?.step ).toBe(
				'surface3'
			);
		}
	} );

	it( 'derives the weaker strokes from their own contrast with the surface', () => {
		// With `stroke3` held by the focus floor, the step back from it must
		// grow, so `stroke1` moves towards the surface instead of `stroke3`.
		const { accent } = getRampConfigs( -1 );
		const surfaceContrast =
			accent.stroke3.contrast.target / accent.stroke1.contrast.target;
		expect( surfaceContrast ).toBeLessThan(
			ACCENT_RAMP_CONFIG.stroke3.contrast.target /
				ACCENT_RAMP_CONFIG.stroke1.contrast.target
		);
	} );

	it( 'stops the strongest stroke adjusting the seed above 0', () => {
		expect(
			getRampConfigs( 0.5 ).accent.stroke4.contrast.skipSeedAdjustment
		).toBe( true );
		expect(
			getRampConfigs( -0.5 ).accent.stroke4.contrast.skipSeedAdjustment
		).toBeUndefined();
	} );
} );

describe( 'getContrastThresholds', () => {
	it( 'uses the standard minimums at 0', () => {
		expect( getContrastThresholds( 0 ) ).toEqual( {
			text: 4.5,
			fillText: 4.5,
			focus: 3,
		} );
	} );

	it( 'follows the scale, holding fill text and focus below 0', () => {
		const minimum = getContrastThresholds( -1 );
		expect( minimum.text ).toBeCloseTo( 4.5 ** K_MIN );
		expect( minimum.fillText ).toBe( 4.5 );
		expect( minimum.focus ).toBe( 3 );

		const enhanced = getContrastThresholds( 1 );
		expect( enhanced.text ).toBeGreaterThanOrEqual( 7 );
		expect( enhanced.fillText ).toBeGreaterThanOrEqual( 7 );
		expect( enhanced.focus ).toBeGreaterThan( 3 );
	} );
} );

describe( 'scaleBackgroundSeed', () => {
	it( 'returns the seed unchanged at 0 and below', () => {
		for ( const level of [ -1, -0.5, 0 ] ) {
			expect( scaleBackgroundSeed( '#25292b', level ) ).toBe( '#25292b' );
		}
	} );

	it( 'darkens a dark seed above 0 without reaching black', () => {
		let previous = getContrast( '#25292b', '#000' );
		for ( const level of [ 0.1, 0.5, 1 ] ) {
			const seed = scaleBackgroundSeed( '#25292b', level );
			const toBlack = getContrast( seed, '#000' );
			expect( toBlack ).toBeLessThan( previous );
			expect( toBlack ).toBeGreaterThanOrEqual( 1.07 );
			previous = toBlack;
		}
	} );

	it( 'barely moves a near-white seed', () => {
		const seed = scaleBackgroundSeed( '#fcfcfc', 1 );
		expect( getContrast( seed, '#fcfcfc' ) ).toBeLessThan( 1.02 );
	} );
} );
