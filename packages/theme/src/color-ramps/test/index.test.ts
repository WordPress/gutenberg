import { describe, expect, it } from 'vitest';
import { getLuminance, serialize, to, HSL, sRGB } from 'colorjs.io/fn';
import { buildAccentRamp, buildBgRamp } from '..';
import { buildRamp } from '../lib';
import { clampToGamut, getColorString, getContrast } from '../lib/color-utils';
import { BG_RAMP_CONFIG, ACCENT_RAMP_CONFIG } from '../lib/ramp-configs';
import { DEFAULT_SEED_COLORS } from '../lib/constants';
import {
	computeBetterFgColorDirection,
	sortByDependency,
	stepsForStep,
} from '../lib/utils';

const lStops = [ 100, 90, 80, 70, 60, 50, 40, 30, 20, 10 ];
const sStops = [ 100, 80, 60, 40, 20, 0 ];
const hStops = [ 0, 60, 120, 180, 240, 300 ];

describe( 'buildRamps', () => {
	it( 'background ramp snapshots', () => {
		// Generate a set of HSL colors across a broad perceivable range to test
		// support for building ramps with various combinations of lightness,
		// saturation, and hue. Convert to a serialized string format to mirror
		// real-world consumer usage.
		const allBgColors: string[] = lStops.flatMap( ( l ) =>
			sStops.flatMap( ( s ) =>
				hStops.map( ( h ) =>
					serialize(
						to(
							{
								space: HSL,
								coords: [ h, s, l ] as [
									number,
									number,
									number,
								],
								alpha: 1,
							},
							sRGB
						)
					)
				)
			)
		);

		expect(
			allBgColors.map( ( bg ) => {
				const ramp = buildRamp( bg, BG_RAMP_CONFIG );
				const seedOriginal = getColorString( bg );
				const seedComputed = getColorString( ramp.ramp.surface2 );

				return {
					input: {
						seedOriginal,
						seedComputed,
						seedUnchanged: seedOriginal === seedComputed,
					},
					output: ramp,
				};
			} )
		).toMatchSnapshot();
	}, 10000 );

	it( 'accent ramp snapshots', () => {
		const options = [
			{
				pinLightness: { stepName: 'surface2', value: 0 },
				mainDirection: 'lighter',
			},
			{
				pinLightness: { stepName: 'surface2', value: 0.1 },
				mainDirection: 'lighter',
			},
			{
				pinLightness: { stepName: 'surface2', value: 0.2 },
				mainDirection: 'lighter',
			},
			{
				pinLightness: { stepName: 'surface2', value: 0.3 },
				mainDirection: 'lighter',
			},
			{
				pinLightness: { stepName: 'surface2', value: 0.4 },
				mainDirection: 'lighter',
			},
			{
				pinLightness: { stepName: 'surface2', value: 0.7 },
				mainDirection: 'darker',
			},
			{
				pinLightness: { stepName: 'surface2', value: 0.8 },
				mainDirection: 'darker',
			},
			{
				pinLightness: { stepName: 'surface2', value: 0.9 },
				mainDirection: 'darker',
			},
			{
				pinLightness: { stepName: 'surface2', value: 1 },
				mainDirection: 'darker',
			},
		] as const;

		const allPrimaryColors = [
			...Object.values( DEFAULT_SEED_COLORS ),
			'#437aa8', // WP Admin "blue" theme accent
			'#916745', // WP Admin "coffee" theme accent
			'#646c3e', // WP Admin "ectoplasm" theme accent
			'#ad631e', // WP Admin "sunrise" theme accent
		];

		expect(
			allPrimaryColors.map( ( primary ) =>
				options.map( ( o ) => {
					const ramp = buildRamp( primary, ACCENT_RAMP_CONFIG, o );
					const seedOriginal = getColorString( primary );
					const seedComputed = getColorString( ramp.ramp.bgFill1 );

					return {
						input: {
							seedOriginal,
							seedComputed,
							seedUnchanged: seedOriginal === seedComputed,
							bgInfo: o,
						},
						output: ramp,
					};
				} )
			)
		).toMatchSnapshot();
	} );

	it( 'does not return warnings resolved by seed rescaling', () => {
		const result = buildBgRamp( '#3876a8' );

		expect( result.warnings ).toBeUndefined();
	} );

	it( 'meets fill contrast requirements after sRGB serialization', () => {
		const bgRamp = buildBgRamp( '#4f386e' );
		const accentRamp = buildAccentRamp( '#608010', bgRamp );

		expect(
			getContrast( accentRamp.ramp.bgFill1, accentRamp.ramp.fgFill )
		).toBeGreaterThanOrEqual( 4.5 );
		expect(
			getContrast( accentRamp.ramp.bgFill2, accentRamp.ramp.fgFill )
		).toBeGreaterThanOrEqual( 4.5 );
	} );

	it( 'keeps active fills darker than resting fills', () => {
		const bgRamp = buildBgRamp( '#4f386e' );
		const accentRamp = buildAccentRamp( '#608010', bgRamp );

		expect( getLuminance( accentRamp.ramp.bgFill2 ) ).toBeLessThan(
			getLuminance( accentRamp.ramp.bgFill1 )
		);
	} );

	it( 'orders every contrast reference before its dependent step', () => {
		const sortedSteps = sortByDependency( ACCENT_RAMP_CONFIG );

		expect( sortedSteps.indexOf( 'bgFill1' ) ).toBeLessThan(
			sortedSteps.indexOf( 'fgFill' )
		);
		expect( sortedSteps.indexOf( 'bgFill2' ) ).toBeLessThan(
			sortedSteps.indexOf( 'fgFill' )
		);
	} );

	it( 'uses every contrast reference when choosing a direction', () => {
		expect( computeBetterFgColorDirection( '#333' ).better ).toBe(
			'lighter'
		);
		expect(
			computeBetterFgColorDirection( [
				clampToGamut( '#333' ),
				clampToGamut( '#eee' ),
			] ).better
		).toBe( 'darker' );
	} );

	it( 'checks every contrast reference before reusing a ramp color', () => {
		const config = {
			...ACCENT_RAMP_CONFIG,
			fgFill: {
				...ACCENT_RAMP_CONFIG.fgFill,
				sameAsIfPossible: 'fgSurface4' as const,
			},
		};
		const ramp = buildRamp( '#1fad1f', config );

		expect(
			getContrast( ramp.ramp.bgFill1, ramp.ramp.fgSurface4 )
		).toBeGreaterThanOrEqual( 4.5 );
		expect(
			getContrast( ramp.ramp.bgFill2, ramp.ramp.fgSurface4 )
		).toBeLessThan( 4.5 );
		expect( ramp.ramp.fgFill ).not.toBe( ramp.ramp.fgSurface4 );
		expect(
			getContrast( ramp.ramp.bgFill2, ramp.ramp.fgFill )
		).toBeGreaterThanOrEqual( 4.5 );
	} );

	it( 'rescales a seed using every contrast reference', () => {
		const seed = '#85767a';
		const ramp = buildAccentRamp(
			seed,
			buildBgRamp( DEFAULT_SEED_COLORS.background )
		);

		expect( stepsForStep( 'fgFill', ACCENT_RAMP_CONFIG ) ).toEqual(
			expect.arrayContaining( [ 'bgFill1', 'bgFill2' ] )
		);
		expect( ramp.ramp.bgFill1 ).not.toBe( seed );
		expect(
			getContrast( ramp.ramp.bgFill1, ramp.ramp.fgFill )
		).toBeGreaterThanOrEqual( 4.5 );
		expect(
			getContrast( ramp.ramp.bgFill2, ramp.ramp.fgFill )
		).toBeGreaterThanOrEqual( 4.5 );
	} );
} );
