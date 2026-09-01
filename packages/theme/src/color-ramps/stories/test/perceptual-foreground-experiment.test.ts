import { get, OKLCH, Okhsl, parse } from 'colorjs.io/fn';
import { buildAccentRamp, buildBgRamp } from '../..';
import { clampToGamut, getContrast } from '../../lib/color-utils';
import { DEFAULT_SEED_COLORS } from '../../lib/constants';
import type { RampResult } from '../../lib/types';
import {
	EXPERIMENTAL_FOREGROUND_METHODS,
	buildPerceptualForegroundScale,
	getGamutRelativeChroma,
	getPerceptualContrastMagnitude,
	getSignedPerceptualContrast,
	getStateColorDifference,
	type ExperimentalForegroundMethod,
	type ExperimentalForegroundScaleType,
} from '../perceptual-foreground-experiment';

const SAMPLE_COMBINATIONS = [
	{
		background: DEFAULT_SEED_COLORS.background,
		primary: DEFAULT_SEED_COLORS.primary,
	},
	{ background: '#1e1e1e', primary: DEFAULT_SEED_COLORS.primary },
	{ background: '#4f386e', primary: '#608010' },
	{ background: '#777777', primary: '#d63638' },
	{ background: '#fcfcfc', primary: '#ffd700' },
	{ background: '#1e1e1e', primary: '#00ffff' },
] as const;

const EXPERIMENTAL_METHODS = EXPERIMENTAL_FOREGROUND_METHODS.filter(
	( method ) => method !== 'current'
);

const ABSOLUTE_OKLCH_CHROMA_METHODS = EXPERIMENTAL_METHODS.filter(
	( method ) =>
		method !== 'state-skewed-relative-chroma' &&
		method !== 'state-skewed-okhsl'
);

function buildScale(
	method: ExperimentalForegroundMethod,
	ramp: RampResult,
	backgroundRamp: RampResult,
	seed: string,
	scaleType: ExperimentalForegroundScaleType
) {
	return buildPerceptualForegroundScale( {
		method,
		ramp,
		backgroundRamp,
		seed,
		scaleType,
	} );
}

function getTotalChroma( colors: readonly string[] ) {
	return colors.reduce(
		( total, color ) => total + get( parse( color ), [ OKLCH, 'c' ] ),
		0
	);
}

function getHueDifference( first: number, second: number ) {
	const difference = Math.abs( first - second ) % 360;

	return Math.min( difference, 360 - difference );
}

function getConstraintReferences(
	stepIndex: number,
	ramp: RampResult,
	backgroundRamp: RampResult
) {
	let surfaceNames: readonly ( keyof RampResult[ 'ramp' ] )[];
	if ( stepIndex < 2 ) {
		surfaceNames = [ 'surface3' ];
	} else if ( stepIndex < 4 ) {
		surfaceNames = [ 'surface1', 'surface2', 'surface3' ];
	} else {
		surfaceNames = [
			'surface1',
			'surface2',
			'surface3',
			'surface4',
			'surface5',
		];
	}

	return [
		...surfaceNames.map( ( name ) => ramp.ramp[ name ] ),
		...surfaceNames.map( ( name ) => backgroundRamp.ramp[ name ] ),
	];
}

describe( 'perceptual foreground experiment', () => {
	it( 'keeps the current control foreground values unchanged', () => {
		const backgroundRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );
		const scale = buildScale(
			'current',
			backgroundRamp,
			backgroundRamp,
			backgroundRamp.ramp.surface2,
			'neutral'
		);

		expect( scale.colors ).toEqual( [
			backgroundRamp.ramp.fgSurface1,
			backgroundRamp.ramp.fgSurface2,
			backgroundRamp.ramp.fgSurface3,
			backgroundRamp.ramp.fgSurface4,
			backgroundRamp.ramp.fgSurface4,
		] );
	} );

	it.each( SAMPLE_COMBINATIONS )(
		'orders every experimental foreground scale for $background and $primary',
		( { background, primary } ) => {
			const backgroundRamp = buildBgRamp( background );
			const primaryRamp = buildAccentRamp( primary, backgroundRamp );
			const errorRamp = buildAccentRamp(
				DEFAULT_SEED_COLORS.error,
				backgroundRamp
			);

			for ( const method of EXPERIMENTAL_METHODS ) {
				for ( const [ ramp, seed, scaleType ] of [
					[ backgroundRamp, backgroundRamp.ramp.surface2, 'neutral' ],
					[ primaryRamp, primaryRamp.ramp.bgFill1, 'accent' ],
					[ errorRamp, errorRamp.ramp.bgFill1, 'accent' ],
				] as const ) {
					const perceptualContrasts = buildScale(
						method,
						ramp,
						backgroundRamp,
						seed,
						scaleType
					).colors.map( ( color ) =>
						getPerceptualContrastMagnitude(
							backgroundRamp.ramp.surface2,
							color
						)
					);

					expect( perceptualContrasts ).toEqual(
						[ ...perceptualContrasts ].sort( ( a, b ) => a - b )
					);
				}
			}
		}
	);

	it.each( SAMPLE_COMBINATIONS )(
		'meets every foreground contrast target for $background and $primary',
		( { background, primary } ) => {
			const backgroundRamp = buildBgRamp( background );
			const primaryRamp = buildAccentRamp( primary, backgroundRamp );
			const errorRamp = buildAccentRamp(
				DEFAULT_SEED_COLORS.error,
				backgroundRamp
			);
			const violations: string[] = [];

			for ( const method of EXPERIMENTAL_METHODS ) {
				for ( const [ ramp, seed, scaleType ] of [
					[ backgroundRamp, backgroundRamp.ramp.surface2, 'neutral' ],
					[ primaryRamp, primaryRamp.ramp.bgFill1, 'accent' ],
					[ errorRamp, errorRamp.ramp.bgFill1, 'accent' ],
				] as const ) {
					const scale = buildScale(
						method,
						ramp,
						backgroundRamp,
						seed,
						scaleType
					);

					scale.colors.forEach( ( color, index ) => {
						for ( const reference of getConstraintReferences(
							index,
							ramp,
							backgroundRamp
						) ) {
							const contrast = getContrast( reference, color );
							if ( contrast < scale.contrastTargets[ index ] ) {
								violations.push(
									`${ method } step ${
										index + 1
									}: ${ contrast }`
								);
							}
						}
					} );
				}
			}

			expect( violations ).toEqual( [] );
		}
	);

	it.each( [ 'uniform', 'uniform-free-endpoint' ] as const )(
		'spaces the %s variant within one APCA point after serialization',
		( method ) => {
			const backgroundRamp = buildBgRamp(
				DEFAULT_SEED_COLORS.background
			);
			const scale = buildScale(
				method,
				backgroundRamp,
				backgroundRamp,
				backgroundRamp.ramp.surface2,
				'neutral'
			);
			const contrasts = scale.colors.map( ( color ) =>
				getPerceptualContrastMagnitude(
					backgroundRamp.ramp.surface2,
					color
				)
			);
			const intervals = contrasts
				.slice( 1 )
				.map( ( contrast, index ) =>
					Math.abs( contrast - contrasts[ index ] )
				);
			expect(
				Math.max( ...intervals ) - Math.min( ...intervals )
			).toBeLessThan( 1 );
		}
	);

	it( 'preserves lower anchors in the semantic-anchor variant', () => {
		const backgroundRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );
		const scale = buildScale(
			'semantic-anchors',
			backgroundRamp,
			backgroundRamp,
			backgroundRamp.ramp.surface2,
			'neutral'
		);

		expect( scale.colors.slice( 0, 3 ) ).toEqual( [
			backgroundRamp.ramp.fgSurface1,
			backgroundRamp.ramp.fgSurface2,
			backgroundRamp.ramp.fgSurface3,
		] );
		expect( scale.colors[ 4 ] ).toBe( backgroundRamp.ramp.fgSurface4 );
		expect( scale.colors[ 3 ] ).not.toBe( scale.colors[ 2 ] );
		expect( scale.colors[ 3 ] ).not.toBe( scale.colors[ 4 ] );
	} );

	it( 'uses the neutral chroma taper at every Ectoplasm step', () => {
		const backgroundRamp = buildBgRamp( '#4f386e' );

		for ( const method of EXPERIMENTAL_METHODS ) {
			const neutralScale = buildScale(
				method,
				backgroundRamp,
				backgroundRamp,
				backgroundRamp.ramp.surface2,
				'neutral'
			);
			const untaperedScale = buildScale(
				method,
				backgroundRamp,
				backgroundRamp,
				backgroundRamp.ramp.surface2,
				'accent'
			);

			for ( const [ index, color ] of neutralScale.colors.entries() ) {
				expect(
					get( parse( color ), [ OKLCH, 'c' ] )
				).toBeLessThanOrEqual(
					get( parse( untaperedScale.colors[ index ] ), [
						OKLCH,
						'c',
					] )
				);
			}

			expect( getTotalChroma( neutralScale.colors ) ).toBeLessThan(
				getTotalChroma( untaperedScale.colors )
			);
		}
	} );

	it( 'preserves accent chroma and hue at every Ectoplasm intermediate step', () => {
		const backgroundRamp = buildBgRamp( '#4f386e' );
		const primaryRamp = buildAccentRamp( '#608010', backgroundRamp );
		const seed = parse( primaryRamp.ramp.bgFill1 );
		const seedChroma = get( seed, [ OKLCH, 'c' ] );
		const seedHue = get( seed, [ OKLCH, 'h' ] );

		for ( const method of ABSOLUTE_OKLCH_CHROMA_METHODS ) {
			const scale = buildScale(
				method,
				primaryRamp,
				backgroundRamp,
				primaryRamp.ramp.bgFill1,
				'accent'
			);
			for ( const color of scale.colors.slice( 0, -1 ) ) {
				const parsed = parse( color );
				const expected = clampToGamut( {
					space: OKLCH,
					coords: [
						get( parsed, [ OKLCH, 'l' ] ),
						seedChroma,
						seedHue,
					],
					alpha: seed.alpha ?? null,
				} );
				const expectedChroma = get( expected, [ OKLCH, 'c' ] );

				expect(
					get( parsed, [ OKLCH, 'c' ] ) / expectedChroma
				).toBeGreaterThan( 0.9 );
				expect(
					getHueDifference( get( parsed, [ OKLCH, 'h' ] ), seedHue )
				).toBeLessThan( 2 );
			}
		}
	} );

	it.each( [
		{ background: '#4f386e', primary: '#608010' },
		{ background: '#fcfcfc', primary: '#ffd700' },
		{ background: '#1e1e1e', primary: '#00ffff' },
	] )(
		"preserves the seed's relative chroma for $background and $primary",
		( { background, primary } ) => {
			const backgroundRamp = buildBgRamp( background );
			const primaryRamp = buildAccentRamp( primary, backgroundRamp );
			const seedRelativeChroma = getGamutRelativeChroma(
				primaryRamp.ramp.bgFill1
			);
			const scale = buildScale(
				'state-skewed-relative-chroma',
				primaryRamp,
				backgroundRamp,
				primaryRamp.ramp.bgFill1,
				'accent'
			);

			for ( const color of scale.colors.slice( 0, -1 ) ) {
				expect(
					Math.abs(
						getGamutRelativeChroma( color ) - seedRelativeChroma
					)
				).toBeLessThan( 0.04 );
			}
		}
	);

	it.each( [
		{ background: '#4f386e', primary: '#608010' },
		{ background: '#fcfcfc', primary: '#ffd700' },
		{ background: '#1e1e1e', primary: '#00ffff' },
	] )(
		"preserves the seed's OKHSL saturation and hue for $background and $primary",
		( { background, primary } ) => {
			const backgroundRamp = buildBgRamp( background );
			const primaryRamp = buildAccentRamp( primary, backgroundRamp );
			const seed = parse( primaryRamp.ramp.bgFill1 );
			const seedSaturation = get( seed, [ Okhsl, 's' ] );
			const seedHue = get( seed, [ Okhsl, 'h' ] );
			const scale = buildScale(
				'state-skewed-okhsl',
				primaryRamp,
				backgroundRamp,
				primaryRamp.ramp.bgFill1,
				'accent'
			);

			for ( const color of scale.colors.slice( 0, -1 ) ) {
				const parsed = parse( color );
				expect(
					Math.abs( get( parsed, [ Okhsl, 's' ] ) - seedSaturation )
				).toBeLessThan( 0.04 );
				expect(
					getHueDifference( get( parsed, [ Okhsl, 'h' ] ), seedHue )
				).toBeLessThan( 2 );
			}
		}
	);

	it( 'reports APCA polarity separately from its spacing magnitude', () => {
		const darkOnLight = getSignedPerceptualContrast( '#ffffff', '#000000' );
		const lightOnDark = getSignedPerceptualContrast( '#000000', '#ffffff' );

		expect( darkOnLight ).toBeGreaterThan( 0 );
		expect( lightOnDark ).toBeLessThan( 0 );
		expect( getPerceptualContrastMagnitude( '#ffffff', '#000000' ) ).toBe(
			Math.abs( darkOnLight )
		);
	} );

	it( 'isolates endpoint release to the uniform free-endpoint variant', () => {
		const backgroundRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );
		const primaryRamp = buildAccentRamp(
			DEFAULT_SEED_COLORS.primary,
			backgroundRamp
		);

		for ( const method of [
			'uniform',
			'state-skewed',
			'state-skewed-relative-chroma',
			'state-skewed-okhsl',
			'semantic-anchors',
			'eased',
		] as const ) {
			expect(
				buildScale(
					method,
					primaryRamp,
					backgroundRamp,
					primaryRamp.ramp.bgFill1,
					'accent'
				).colors[ 4 ]
			).toBe( primaryRamp.ramp.fgSurface4 );
		}

		const releasedScale = buildScale(
			'uniform-free-endpoint',
			primaryRamp,
			backgroundRamp,
			primaryRamp.ramp.bgFill1,
			'accent'
		);

		expect( releasedScale.colors[ 4 ] ).not.toBe(
			primaryRamp.ramp.fgSurface4
		);
		expect(
			getPerceptualContrastMagnitude(
				backgroundRamp.ramp.surface2,
				releasedScale.colors[ 4 ]
			)
		).toBeLessThan(
			getPerceptualContrastMagnitude(
				backgroundRamp.ramp.surface2,
				primaryRamp.ramp.fgSurface4
			)
		);
	} );

	it( 'preserves the legacy Step 5 in the floating-point regression case', () => {
		const backgroundRamp = buildBgRamp( '#000040' );
		const primaryRamp = buildAccentRamp(
			DEFAULT_SEED_COLORS.primary,
			backgroundRamp
		);

		for ( const method of [
			'uniform',
			'state-skewed',
			'state-skewed-relative-chroma',
			'state-skewed-okhsl',
			'eased',
		] as const ) {
			expect(
				buildScale(
					method,
					primaryRamp,
					backgroundRamp,
					primaryRamp.ramp.bgFill1,
					'accent'
				).colors[ 4 ]
			).toBe( primaryRamp.ramp.fgSurface4 );
		}
	} );

	it( 'reserves more state difference in the state-skewed fixed-endpoint variant', () => {
		const backgroundRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );
		const seed = backgroundRamp.ramp.surface2;
		const uniformScale = buildScale(
			'uniform',
			backgroundRamp,
			backgroundRamp,
			seed,
			'neutral'
		);
		const stateSkewedScale = buildScale(
			'state-skewed',
			backgroundRamp,
			backgroundRamp,
			seed,
			'neutral'
		);
		const contrasts = stateSkewedScale.colors.map( ( color ) =>
			getPerceptualContrastMagnitude(
				backgroundRamp.ramp.surface2,
				color
			)
		);
		const finalInterval = contrasts[ 4 ] - contrasts[ 3 ];
		const totalRange = contrasts[ 4 ] - contrasts[ 0 ];

		expect( stateSkewedScale.colors[ 4 ] ).toBe(
			backgroundRamp.ramp.fgSurface4
		);
		expect( finalInterval / totalRange ).toBeGreaterThanOrEqual( 0.35 );
		expect(
			getStateColorDifference( stateSkewedScale.colors )
		).toBeGreaterThan( getStateColorDifference( uniformScale.colors ) );
	} );

	it( 'produces the same palette for identical seeds', () => {
		const backgroundRamp = buildBgRamp( '#1e1e1e' );
		const args = {
			method: 'eased' as const,
			ramp: backgroundRamp,
			backgroundRamp,
			seed: backgroundRamp.ramp.surface2,
			scaleType: 'neutral' as const,
		};

		expect( buildPerceptualForegroundScale( args ) ).toEqual(
			buildPerceptualForegroundScale( args )
		);
	} );
} );
