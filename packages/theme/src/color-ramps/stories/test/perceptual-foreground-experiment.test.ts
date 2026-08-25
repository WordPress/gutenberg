import { get, OKLCH, parse } from 'colorjs.io/fn';
import { buildAccentRamp, buildBgRamp } from '../..';
import { getContrast } from '../../lib/color-utils';
import { DEFAULT_SEED_COLORS } from '../../lib/constants';
import type { RampResult } from '../../lib/types';
import {
	EXPERIMENTAL_FOREGROUND_METHODS,
	buildPerceptualForegroundScale,
	getPerceptualContrast,
	type ExperimentalForegroundMethod,
} from '../perceptual-foreground-experiment';

const SAMPLE_COMBINATIONS = [
	{
		background: DEFAULT_SEED_COLORS.background,
		primary: DEFAULT_SEED_COLORS.primary,
	},
	{ background: '#1e1e1e', primary: DEFAULT_SEED_COLORS.primary },
	{ background: '#4f386e', primary: '#608010' },
	{ background: '#777777', primary: '#d63638' },
] as const;

const EXPERIMENTAL_METHODS = EXPERIMENTAL_FOREGROUND_METHODS.filter(
	( method ) => method !== 'current'
);

function buildScale(
	method: ExperimentalForegroundMethod,
	ramp: RampResult,
	backgroundRamp: RampResult,
	seed: string
) {
	return buildPerceptualForegroundScale( {
		method,
		ramp,
		backgroundRamp,
		seed,
	} );
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
			backgroundRamp.ramp.surface2
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
				for ( const [ ramp, seed ] of [
					[ backgroundRamp, backgroundRamp.ramp.surface2 ],
					[ primaryRamp, primaryRamp.ramp.bgFill1 ],
					[ errorRamp, errorRamp.ramp.bgFill1 ],
				] as const ) {
					const perceptualContrasts = buildScale(
						method,
						ramp,
						backgroundRamp,
						seed
					).colors.map( ( color ) =>
						getPerceptualContrast(
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
		'meets every foreground WCAG floor for $background and $primary',
		( { background, primary } ) => {
			const backgroundRamp = buildBgRamp( background );
			const primaryRamp = buildAccentRamp( primary, backgroundRamp );
			const errorRamp = buildAccentRamp(
				DEFAULT_SEED_COLORS.error,
				backgroundRamp
			);
			const floors = [ 2, 3, 4.5, 4.5, 4.5 ];
			const violations: string[] = [];

			for ( const method of EXPERIMENTAL_METHODS ) {
				for ( const [ ramp, seed ] of [
					[ backgroundRamp, backgroundRamp.ramp.surface2 ],
					[ primaryRamp, primaryRamp.ramp.bgFill1 ],
					[ errorRamp, errorRamp.ramp.bgFill1 ],
				] as const ) {
					const scale = buildScale(
						method,
						ramp,
						backgroundRamp,
						seed
					);

					scale.colors.forEach( ( color, index ) => {
						for ( const reference of getConstraintReferences(
							index,
							ramp,
							backgroundRamp
						) ) {
							const contrast = getContrast( reference, color );
							if ( contrast < floors[ index ] ) {
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

	it( 'spaces the uniform variant within one APCA point after serialization', () => {
		const backgroundRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );
		const scale = buildScale(
			'uniform',
			backgroundRamp,
			backgroundRamp,
			backgroundRamp.ramp.surface2
		);
		const contrasts = scale.colors.map( ( color ) =>
			getPerceptualContrast( backgroundRamp.ramp.surface2, color )
		);
		const intervals = contrasts
			.slice( 1 )
			.map( ( contrast, index ) =>
				Math.abs( contrast - contrasts[ index ] )
			);
		expect(
			Math.max( ...intervals ) - Math.min( ...intervals )
		).toBeLessThan( 1 );
	} );

	it( 'preserves lower anchors in the semantic-anchor variant', () => {
		const backgroundRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );
		const scale = buildScale(
			'semantic-anchors',
			backgroundRamp,
			backgroundRamp,
			backgroundRamp.ramp.surface2
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

	it( 'releases the legacy strong endpoint in the chroma-first variant', () => {
		const backgroundRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );
		const primaryRamp = buildAccentRamp(
			DEFAULT_SEED_COLORS.primary,
			backgroundRamp
		);
		const scale = buildScale(
			'chroma-first',
			primaryRamp,
			backgroundRamp,
			primaryRamp.ramp.bgFill1
		);

		expect( scale.colors[ 4 ] ).not.toBe( primaryRamp.ramp.fgSurface4 );
		expect(
			getPerceptualContrast(
				backgroundRamp.ramp.surface2,
				scale.colors[ 4 ]
			)
		).toBeLessThan(
			getPerceptualContrast(
				backgroundRamp.ramp.surface2,
				primaryRamp.ramp.fgSurface4
			)
		);
	} );

	it( 'preserves more accent chroma at the middle-gray polarity boundary', () => {
		const backgroundRamp = buildBgRamp( '#777777' );
		const primaryRamp = buildAccentRamp( '#d63638', backgroundRamp );
		const taperedScale = buildScale(
			'uniform',
			primaryRamp,
			backgroundRamp,
			primaryRamp.ramp.bgFill1
		);
		const chromaFirstScale = buildScale(
			'chroma-first',
			primaryRamp,
			backgroundRamp,
			primaryRamp.ramp.bgFill1
		);
		const getTotalChroma = ( colors: readonly string[] ) =>
			colors
				.slice( 0, -1 )
				.reduce(
					( total, color ) =>
						total + get( parse( color ), [ OKLCH, 'c' ] ),
					0
				);

		expect( getTotalChroma( chromaFirstScale.colors ) ).toBeGreaterThan(
			getTotalChroma( taperedScale.colors )
		);
	} );

	it( 'produces the same palette for identical seeds', () => {
		const backgroundRamp = buildBgRamp( '#1e1e1e' );
		const args = {
			method: 'eased' as const,
			ramp: backgroundRamp,
			backgroundRamp,
			seed: backgroundRamp.ramp.surface2,
		};

		expect( buildPerceptualForegroundScale( args ) ).toEqual(
			buildPerceptualForegroundScale( args )
		);
	} );
} );
