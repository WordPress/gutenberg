import { describe, expect, it } from 'vitest';
import { buildAccentRamp, buildBgRamp } from '..';

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
} );
