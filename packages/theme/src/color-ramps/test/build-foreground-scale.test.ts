import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildAccentRamp, buildBgRamp } from '..';
import { buildForegroundScale } from '../lib/build-foreground-scale';
import * as colorUtils from '../lib/color-utils';
import { ACCENT_RAMP_CONFIG } from '../lib/ramp-configs';

function createFixture( backgroundSeed: string, accentSeed = '#0090ff' ) {
	const background = buildBgRamp( backgroundSeed );
	const full = buildAccentRamp( accentSeed, background );
	const { fgSurface4, fgSurface5, ...baseColors } = full.ramp;
	const scale = ACCENT_RAMP_CONFIG.foregroundScale;
	const strongStep = scale.steps.find(
		( step ) => step.name === 'fgSurface5'
	)!;
	// Reading this target marks the strong-color calculation, without replacing
	// any of the color math or exposing the private solver to the test.
	const readStrongTarget = vi.fn( () => strongStep.contrast.target );
	const config = {
		...scale,
		steps: scale.steps.map( ( step ) =>
			step === strongStep
				? {
						...step,
						contrast: {
							...step.contrast,
							get target() {
								return readStrongTarget();
							},
						},
				  }
				: step
		),
	};
	return {
		background,
		base: { ...full, ramp: baseColors },
		config,
		readStrongTarget,
		expected: { fgSurface4, fgSurface5 },
	};
}

describe( 'status foreground calculation', () => {
	afterEach( () => {
		vi.restoreAllMocks();
	} );

	it( 'skips the interaction color when retained colors serialize above their contrast floors', () => {
		const { background, base, config, readStrongTarget, expected } =
			createFixture( '#fcfcfc' );

		const result = buildForegroundScale( base, background, config, false );

		expect( readStrongTarget ).not.toHaveBeenCalled();
		expect( result.ramp ).not.toHaveProperty( 'fgSurface5' );
		expect( result.ramp.fgSurface4 ).toBe( expected.fgSurface4 );
		expect( result.warnings ).toBeUndefined();
	} );

	it( 'defers the interaction color until a rounded foreground needs the existing correction', () => {
		const { background, base, config, readStrongTarget } =
			createFixture( '#a4a4a4' );
		const serialize = colorUtils.getColorString;
		const solvesBeforeCorrection: number[] = [];
		vi.spyOn( colorUtils, 'getColorString' ).mockImplementation(
			( color ) => {
				const serialized = serialize( color );
				if ( serialized === '#003767' ) {
					solvesBeforeCorrection.push(
						readStrongTarget.mock.calls.length
					);
				}
				return serialized;
			}
		);

		const result = buildForegroundScale( base, background, config, false );

		expect( solvesBeforeCorrection[ 0 ] ).toBe( 0 );
		expect( readStrongTarget ).toHaveBeenCalledTimes( 1 );
		// This is the exact pre-optimization correction for this rounding edge.
		expect( result.ramp.fgSurface3 ).toBe( '#003667' );
		expect( result.ramp.fgSurface4 ).toBe( '#002b53' );
		expect( result.warnings ).toBeUndefined();
		for ( const ramp of [ background.ramp, result.ramp ] ) {
			for ( const surface of [
				'surface1',
				'surface2',
				'surface3',
			] as const ) {
				expect(
					colorUtils.getContrast(
						ramp[ surface ],
						result.ramp.fgSurface3
					)
				).toBeGreaterThanOrEqual( 4.5 );
			}
		}
	} );

	it( 'reuses one interaction-color calculation for multiple serialization corrections', () => {
		const { background, base, config, readStrongTarget } = createFixture(
			'#dfdfdf',
			'#4ab866'
		);
		const serialize = colorUtils.getColorString;
		const solvesBeforeCorrection = new Map< string, number >();
		vi.spyOn( colorUtils, 'getColorString' ).mockImplementation(
			( color ) => {
				const serialized = serialize( color );
				if (
					[ '#236032', '#286b39' ].includes( serialized ) &&
					! solvesBeforeCorrection.has( serialized )
				) {
					solvesBeforeCorrection.set(
						serialized,
						readStrongTarget.mock.calls.length
					);
				}
				return serialized;
			}
		);

		const result = buildForegroundScale( base, background, config, false );

		expect( [ ...solvesBeforeCorrection ] ).toEqual( [
			[ '#236032', 0 ],
			[ '#286b39', 1 ],
		] );
		expect( readStrongTarget ).toHaveBeenCalledTimes( 1 );
		expect( result.ramp.fgSurface3 ).toBe( '#286a39' );
		expect( result.ramp.fgSurface4 ).toBe( '#235f32' );
		expect( result.warnings ).toBeUndefined();
	} );
} );
