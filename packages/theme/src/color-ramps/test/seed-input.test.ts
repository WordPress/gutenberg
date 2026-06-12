import { ColorSpace, OKLCH } from 'colorjs.io/fn';
import { buildBgRamp, buildAccentRamp } from '../index';
import { buildRamp } from '../lib';
import { BG_RAMP_CONFIG } from '../lib/ramp-configs';

describe( 'seed color input contract', () => {
	const accepted = [
		'#3858e9',
		'#3858e94d',
		'rgb(56,88,233)',
		'rgb(56 88 233 / 0.3)',
		'rgba(56,88,233,0.3)',
		'blue',
		'transparent',
	];

	const rejected = [
		'oklch(0.7 0.15 250)',
		'hsl(230 80% 56%)',
		'lab(50% 40 59)',
		'hwb(230 10% 20%)',
		'color(display-p3 1 0 0)',
		'',
		'not-a-color',
	];

	describe.each( accepted )( 'accepts sRGB-parseable seed %p', ( seed ) => {
		it( 'buildBgRamp does not throw', () => {
			expect( () => buildBgRamp( seed ) ).not.toThrow();
		} );

		it( 'buildAccentRamp does not throw', () => {
			expect( () => buildAccentRamp( seed ) ).not.toThrow();
		} );

		it( 'buildRamp does not throw', () => {
			expect( () => buildRamp( seed, BG_RAMP_CONFIG ) ).not.toThrow();
		} );
	} );

	describe.each( rejected )( 'rejects non-sRGB seed %p', ( seed ) => {
		it( 'buildBgRamp throws', () => {
			expect( () => buildBgRamp( seed ) ).toThrow();
		} );

		it( 'buildAccentRamp throws', () => {
			expect( () => buildAccentRamp( seed ) ).toThrow();
		} );

		it( 'buildRamp throws', () => {
			expect( () => buildRamp( seed, BG_RAMP_CONFIG ) ).toThrow();
		} );
	} );

	it( 'rejects oklch() even when the OKLCH color space is globally registered', () => {
		// Registering OKLCH would otherwise make `oklch(...)` strings parse.
		ColorSpace.register( OKLCH );

		expect( () =>
			buildRamp( 'oklch(0.7 0.15 250)', BG_RAMP_CONFIG )
		).toThrow();
		expect( () => buildBgRamp( 'oklch(0.7 0.15 250)' ) ).toThrow();
		expect( () => buildAccentRamp( 'oklch(0.7 0.15 250)' ) ).toThrow();
	} );
} );
