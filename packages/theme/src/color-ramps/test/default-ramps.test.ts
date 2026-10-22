import { describe, expect, it } from 'vitest';
import { buildAccentRamp, buildBgRamp, DEFAULT_SEED_COLORS } from '..';
import { DEFAULT_RAMPS } from '../lib/default-ramps';

// `ThemeProvider` uses the prebuilt ramps in place of building the ramps of
// the default seeds, so they must be what building them gives. Regenerate
// them with `npm run build:default-ramps` in `packages/theme`.
describe( 'DEFAULT_RAMPS', () => {
	const bgRamp = buildBgRamp( DEFAULT_SEED_COLORS.background );

	it( 'holds the ramp of the default background seed', () => {
		expect( DEFAULT_RAMPS.background ).toEqual( bgRamp );
	} );

	it.each(
		Object.entries( DEFAULT_SEED_COLORS ).filter(
			( [ rampName ] ) => rampName !== 'background'
		)
	)( 'holds the ramp of the default %s seed', ( rampName, seed ) => {
		expect(
			DEFAULT_RAMPS[ rampName as keyof typeof DEFAULT_SEED_COLORS ]
		).toEqual( buildAccentRamp( seed, bgRamp ) );
	} );
} );
