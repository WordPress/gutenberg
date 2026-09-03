import { describe, expect, it } from 'vitest';
import { get, OKLrab } from 'colorjs.io/fn';
import { buildAccentRamp, buildBgRamp, checkAccessibleCombinations } from '..';
import { DEFAULT_SEED_COLORS } from '../lib/constants';

const endpointSeeds = [ '#fff', '#fefefe', '#000', '#010101' ];

describe( 'surface spacing at lightness endpoints', () => {
	it.each( [ '#fff', '#fefefe' ] )(
		'keeps useful darker surface spacing near white for %s',
		( seed ) => {
			const { ramp } = buildBgRamp( seed );
			const lightness = ( color: string ) =>
				get( color, [ OKLrab, 'l' ] );

			expect( ramp.surface2 ).toBe( seed );
			expect( lightness( ramp.surface3 ) ).toBeGreaterThanOrEqual(
				lightness( ramp.surface2 )
			);
			// A single differing RGB value must not count as restored spacing.
			expect(
				lightness( ramp.surface2 ) - lightness( ramp.surface1 )
			).toBeGreaterThan( 0.01 );
		}
	);

	it.each( [ '#000', '#010101' ] )(
		'keeps useful lighter surface spacing near black for %s',
		( seed ) => {
			const { ramp } = buildBgRamp( seed );
			const lightness = ( color: string ) =>
				get( color, [ OKLrab, 'l' ] );

			expect( ramp.surface2 ).toBe( seed );
			expect( lightness( ramp.surface1 ) ).toBeLessThanOrEqual(
				lightness( ramp.surface2 )
			);
			expect(
				lightness( ramp.surface3 ) - lightness( ramp.surface2 )
			).toBeGreaterThan( 0.01 );
		}
	);

	it.each( endpointSeeds )(
		'keeps surface ordering and contrast floors at the %s endpoint',
		( seed ) => {
			const backgroundRamp = buildBgRamp( seed );
			const accentRamps = [
				buildAccentRamp( DEFAULT_SEED_COLORS.primary, backgroundRamp ),
				buildAccentRamp( DEFAULT_SEED_COLORS.error, backgroundRamp ),
			];

			for ( const result of [ backgroundRamp, ...accentRamps ] ) {
				const { ramp, direction, warnings } = result;
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
				const lightnesses = orderedSteps.map( ( step ) =>
					get( ramp[ step ], [ OKLrab, 'l' ] )
				);

				expect( lightnesses ).toEqual(
					[ ...lightnesses ].sort( ( a, b ) => a - b )
				);
				// Only the side blocked by black or white may collapse.
				const distinctSteps =
					direction === 'lighter'
						? lightnesses.slice( 1 )
						: lightnesses.slice( 0, -1 );
				for ( let index = 1; index < distinctSteps.length; index++ ) {
					expect( distinctSteps[ index ] ).toBeGreaterThan(
						distinctSteps[ index - 1 ]
					);
				}
				expect( warnings ).toBeUndefined();
				// Check each ramp's own fill/text pairs. Cross-ramp fill pairs
				// are not semantic combinations used by ThemeProvider.
				expect(
					checkAccessibleCombinations( { bgRamp: result } )
				).toEqual( [] );
			}
		}
	);
} );
