import { OKLCH, type PlainColorObject } from 'colorjs.io/fn';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SEED_COLORS } from '../lib/constants';

const SUNRISE_SEEDS = {
	background: '#cc4541',
	primary: '#ad631e',
} as const;

async function loadFreshRampBuilders() {
	vi.resetModules();
	return import( '..' );
}

async function buildSunriseRamps( buildDefaultDarkFirst: boolean ) {
	const { buildAccentRamp, buildBgRamp } = await loadFreshRampBuilders();

	if ( buildDefaultDarkFirst ) {
		const defaultDark = buildBgRamp( '#1e1e1e' );
		buildAccentRamp( DEFAULT_SEED_COLORS.primary, defaultDark );
		buildAccentRamp( DEFAULT_SEED_COLORS.error, defaultDark );
	}

	const background = buildBgRamp( SUNRISE_SEEDS.background );
	return {
		background,
		primary: buildAccentRamp( SUNRISE_SEEDS.primary, background ),
		error: buildAccentRamp( DEFAULT_SEED_COLORS.error, background ),
	};
}

describe( 'color ramp generation order', () => {
	it( 'builds the same Sunrise ramps before and after an unrelated Default dark theme', async () => {
		const sunriseFirst = await buildSunriseRamps( false );
		const sunriseAfterDefaultDark = await buildSunriseRamps( true );

		expect( sunriseAfterDefaultDark ).toEqual( sunriseFirst );
	} );
} );

describe( 'taperChroma', () => {
	it( 'returns the same tapered chroma for exact inputs that share a rounded cache bucket', async () => {
		const target: PlainColorObject = {
			space: OKLCH,
			coords: [ 0.51, 0.12, 41 ],
			alpha: 1,
		};
		const unrelated: PlainColorObject = {
			space: OKLCH,
			coords: [ 0.52, 0.12, 44 ],
			alpha: 1,
		};

		vi.resetModules();
		const freshModule = await import( '../lib/taper-chroma' );
		const expected = freshModule.taperChroma( target, 0.71 );

		vi.resetModules();
		const pollutedModule = await import( '../lib/taper-chroma' );
		pollutedModule.taperChroma( unrelated, 0.72 );
		const actual = pollutedModule.taperChroma( target, 0.71 );

		expect( actual ).toEqual( expected );
	} );
} );
