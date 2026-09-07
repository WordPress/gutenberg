import { describe, expect, it } from 'vitest';
import { contrastAPCA, get, OKLrab } from 'colorjs.io/fn';
import { buildAccentRamp, buildBgRamp } from '..';
import { getColorString, getContrast } from '../lib/color-utils';
import { DEFAULT_SEED_COLORS } from '../lib/constants';
import type { RampResult } from '../lib/types';

const endpointSeeds = [ '#ffffff', '#fefefe', '#000000', '#010101' ];

const sampleCombinations = [
	{
		background: DEFAULT_SEED_COLORS.background,
		primary: DEFAULT_SEED_COLORS.primary,
	},
	{ background: '#1e1e1e', primary: DEFAULT_SEED_COLORS.primary },
	{ background: '#777777', primary: '#d63638' },
	{ background: '#cc4541', primary: '#00ffff' },
] as const;

function getPerceptualLightness( color: string ) {
	return get( color, [ OKLrab, 'l' ] );
}

function getRamps( background: string, primary: string ) {
	const backgroundRamp = buildBgRamp( background );

	return {
		backgroundRamp,
		ramps: [
			backgroundRamp,
			buildAccentRamp( primary, backgroundRamp ),
			buildAccentRamp( DEFAULT_SEED_COLORS.error, backgroundRamp ),
		],
	};
}

function getRequiredStrokeReferences(
	ramp: RampResult,
	backgroundRamp: RampResult
) {
	return Array.from(
		new Set( [
			ramp.ramp.surface1,
			ramp.ramp.surface2,
			ramp.ramp.surface3,
			backgroundRamp.ramp.surface1,
			backgroundRamp.ramp.surface2,
			backgroundRamp.ramp.surface3,
		] )
	);
}

describe( 'perceptual surface spacing', () => {
	it.each( [ '#ffffff', '#fefefe' ] )(
		'keeps useful darker surface spacing near white for %s',
		( seed ) => {
			const { ramp } = buildBgRamp( seed );

			expect( getColorString( ramp.surface2 ) ).toBe(
				getColorString( seed )
			);
			expect(
				getPerceptualLightness( ramp.surface2 ) -
					getPerceptualLightness( ramp.surface1 )
			).toBeGreaterThan( 0.01 );
		}
	);

	it.each( [ '#000000', '#010101' ] )(
		'keeps useful lighter surface spacing near black for %s',
		( seed ) => {
			const { ramp } = buildBgRamp( seed );

			expect( getColorString( ramp.surface2 ) ).toBe(
				getColorString( seed )
			);
			expect(
				getPerceptualLightness( ramp.surface3 ) -
					getPerceptualLightness( ramp.surface2 )
			).toBeGreaterThan( 0.01 );
		}
	);

	it.each( endpointSeeds )(
		'keeps surfaces ordered at the %s endpoint',
		( seed ) => {
			const { backgroundRamp, ramps } = getRamps(
				seed,
				DEFAULT_SEED_COLORS.primary
			);

			for ( const ramp of ramps ) {
				const orderedSteps =
					ramp.direction === 'lighter'
						? ( [
								'surface1',
								'surface2',
								'surface3',
								'surface4',
								'surface5',
								'surface6',
						  ] as const )
						: ( [
								'surface6',
								'surface5',
								'surface4',
								'surface1',
								'surface2',
								'surface3',
						  ] as const );
				const lightnesses = orderedSteps.map( ( step ) =>
					getPerceptualLightness( ramp.ramp[ step ] )
				);

				expect( lightnesses ).toEqual(
					[ ...lightnesses ].sort( ( a, b ) => a - b )
				);

				const distinctSteps =
					ramp.direction === 'lighter'
						? lightnesses.slice( 1 )
						: lightnesses.slice( 0, -1 );
				for ( let index = 1; index < distinctSteps.length; index++ ) {
					expect( distinctSteps[ index ] ).toBeGreaterThan(
						distinctSteps[ index - 1 ]
					);
				}

				for ( const reference of getRequiredStrokeReferences(
					ramp,
					backgroundRamp
				) ) {
					expect(
						getContrast(
							getColorString( reference ),
							getColorString( ramp.ramp.stroke3 )
						)
					).toBeGreaterThanOrEqual( 3 );
				}
			}
		}
	);

	it.each( sampleCombinations )(
		'orders elevation and emphasis surfaces for $background and $primary',
		( { background, primary } ) => {
			const { ramps } = getRamps( background, primary );

			for ( const { ramp, direction } of ramps ) {
				const lightness = ( step: keyof typeof ramp ) =>
					getPerceptualLightness( ramp[ step ] );
				const orderedSteps =
					direction === 'lighter'
						? ( [
								'surface1',
								'surface2',
								'surface3',
								'surface4',
								'surface5',
								'surface6',
						  ] as const )
						: ( [
								'surface6',
								'surface5',
								'surface4',
								'surface1',
								'surface2',
								'surface3',
						  ] as const );
				const lightnesses = orderedSteps.map( lightness );

				for ( let index = 1; index < lightnesses.length; index++ ) {
					expect( lightnesses[ index ] ).toBeGreaterThan(
						lightnesses[ index - 1 ]
					);
				}

				expect(
					Math.abs(
						lightness( 'surface5' ) -
							( lightness( 'surface4' ) +
								lightness( 'surface6' ) ) /
								2
					)
				).toBeLessThan( 0.004 );
			}
		}
	);

	it.each( sampleCombinations.slice( 0, 3 ) )(
		'balances elevation around surface2 for $background and $primary',
		( { background, primary } ) => {
			const { ramps } = getRamps( background, primary );

			for ( const { ramp } of ramps ) {
				const lightness = ( step: keyof typeof ramp ) =>
					getPerceptualLightness( ramp[ step ] );
				const lowerGap =
					lightness( 'surface2' ) - lightness( 'surface1' );
				const upperGap =
					lightness( 'surface3' ) - lightness( 'surface2' );
				const elevationGap = Math.max( lowerGap, upperGap );

				expect(
					Math.abs(
						lowerGap -
							Math.min( elevationGap, lightness( 'surface2' ) )
					)
				).toBeLessThan( 0.004 );
				expect(
					Math.abs(
						upperGap -
							Math.min(
								elevationGap,
								1 - lightness( 'surface2' )
							)
					)
				).toBeLessThan( 0.004 );
			}
		}
	);
} );

describe( 'perceptual stroke spacing', () => {
	it.each( sampleCombinations )(
		'keeps stroke strength ordered and serialized stroke3 accessible for $background and $primary',
		( { background, primary } ) => {
			const { backgroundRamp, ramps } = getRamps( background, primary );

			for ( const ramp of ramps ) {
				const strokeStrengths = [
					'stroke1',
					'stroke2',
					'stroke3',
					'stroke4',
				].map( ( step ) =>
					Math.abs(
						contrastAPCA(
							ramp.ramp.surface3,
							ramp.ramp[ step as keyof typeof ramp.ramp ]
						)
					)
				);

				expect( strokeStrengths ).toEqual(
					[ ...strokeStrengths ].sort( ( a, b ) => a - b )
				);

				const serializedStroke3 = getColorString( ramp.ramp.stroke3 );
				for ( const reference of getRequiredStrokeReferences(
					ramp,
					backgroundRamp
				) ) {
					expect(
						getContrast(
							getColorString( reference ),
							serializedStroke3
						)
					).toBeGreaterThanOrEqual( 3 );
				}
			}
		}
	);
} );

describe( 'perceptual ramp determinism', () => {
	it.each( sampleCombinations )(
		'generates identical ramps for repeated $background and $primary inputs',
		( { background, primary } ) => {
			expect( getRamps( background, primary ) ).toEqual(
				getRamps( background, primary )
			);
		}
	);
} );
