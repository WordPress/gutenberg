import { describe, expect, it } from 'vitest';
import { buildAccentRamp, buildBgRamp, DEFAULT_SEED_COLORS } from '..';
import { getContrast } from '../lib/color-utils';
import type { Ramp } from '../lib/types';
import colorTokens from '../../prebuilt/ts/color-tokens';

const combinations = [
	{ background: '#fcfcfc', primary: '#3858e9' },
	{ background: '#1e1e1e', primary: '#3858e9' },
	{ background: '#413256', primary: '#a3b745' },
	{ background: '#777777', primary: '#d63638' },
	{ background: '#fcfcfc', primary: '#ffd700' },
	{ background: '#1e1e1e', primary: '#00ffff' },
] as const;

describe( 'ramp purpose', () => {
	it( 'omits steps with no semantic consumer or downstream dependency', () => {
		const background = buildBgRamp( '#fcfcfc' );
		const accent = buildAccentRamp( '#3858e9', background );

		for ( const { ramp } of [ background, accent ] ) {
			for ( const step of [ 'fgSurface1', 'bgFillDark', 'fgFillDark' ] ) {
				expect( ramp ).not.toHaveProperty( step );
			}
		}
	} );

	it.each( combinations )(
		'preserves semantic colors for every accent purpose over $background',
		( { background, primary } ) => {
			const backgroundRamp = buildBgRamp( background );
			const seeds = {
				...DEFAULT_SEED_COLORS,
				primary,
			};

			for ( const [ role, seed ] of Object.entries( seeds ) ) {
				if ( role === 'background' ) {
					continue;
				}
				const purpose =
					role === 'primary' || role === 'error'
						? 'interactive'
						: 'status';
				const full = buildAccentRamp( seed, backgroundRamp );
				const result = buildAccentRamp( seed, backgroundRamp, purpose );
				const mappedSteps = Object.entries( colorTokens )
					.filter( ( [ key ] ) => key.startsWith( `${ role }-` ) )
					.map(
						( [ key ] ) =>
							key.slice( role.length + 1 ) as keyof Ramp
					);

				for ( const step of mappedSteps ) {
					expect( result.ramp[ step ] ).toBe( full.ramp[ step ] );
				}
				expect( result.warnings ).toEqual( full.warnings );
				expect( result.direction ).toBe( full.direction );
				expect( result.ramp ).not.toHaveProperty( 'stroke2' );
				expect( result.ramp ).not.toHaveProperty( 'surface6' );
				if ( purpose === 'status' ) {
					expect( result.ramp ).not.toHaveProperty( 'stroke4' );
					expect( result.ramp ).not.toHaveProperty( 'fgSurface5' );
				}
			}
		}
	);

	it.each( combinations )(
		'preserves foreground and stroke contrast for each purpose over $background',
		( { background, primary } ) => {
			const backgroundRamp = buildBgRamp( background );
			for ( const purpose of [ 'interactive', 'status' ] as const ) {
				const result = buildAccentRamp(
					primary,
					backgroundRamp,
					purpose
				);
				for ( const referenceRamp of [ backgroundRamp, result ] ) {
					for ( const surface of [
						'surface1',
						'surface2',
						'surface3',
					] as const ) {
						expect(
							getContrast(
								referenceRamp.ramp[ surface ],
								result.ramp.stroke3
							)
						).toBeGreaterThanOrEqual( 3 );
						expect(
							getContrast(
								referenceRamp.ramp[ surface ],
								result.ramp.fgSurface3
							)
						).toBeGreaterThanOrEqual( 4.5 );
					}
					for ( const surface of [
						'surface1',
						'surface2',
						'surface3',
						'surface4',
						'surface5',
					] as const ) {
						expect(
							getContrast(
								referenceRamp.ramp[ surface ],
								result.ramp.fgSurface4
							)
						).toBeGreaterThanOrEqual( 4.5 );
					}
				}
			}
		}
	);
} );
