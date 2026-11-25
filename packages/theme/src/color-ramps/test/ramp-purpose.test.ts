import { describe, expect, it } from 'vitest';
import { buildAccentRamp, buildBgRamp } from '..';

describe( 'ramp purpose', () => {
	it( 'omits steps with no semantic consumer or downstream dependency', () => {
		const background = buildBgRamp( '#fcfcfc' );
		const accent = buildAccentRamp( 'primary', '#3858e9', background );

		for ( const { ramp } of [ background, accent ] ) {
			expect( ramp ).not.toHaveProperty( 'fgSurface1' );
		}
	} );
} );
