import { ColorSpace, OKLCH } from 'colorjs.io/fn';
import { buildBgRamp, buildAccentRamp } from '../index';
import { buildRamp } from '../lib';
import { BG_RAMP_CONFIG } from '../lib/ramp-configs';

const ACCEPTED_SEEDS = [
	'#3858e9',
	'#3858e94d',
	'rgb(56,88,233)',
	'rgb(56 88 233 / 0.3)',
	'rgba(56,88,233,0.3)',
	'blue',
	'transparent',
];

const REJECTED_SEEDS = [
	'oklch(0.7 0.15 250)',
	'hsl(230 80% 56%)',
	'lab(50% 40 59)',
	'hwb(230 10% 20%)',
	'color(display-p3 1 0 0)',
	'',
	'not-a-color',
];

// Each public entry point shares the same seed-color input contract, so the
// same assertions run against all of them.
function testSeedColorContract( build: ( seed: string ) => unknown ) {
	it.each( ACCEPTED_SEEDS )( 'accepts sRGB-parseable seed %p', ( seed ) => {
		expect( () => build( seed ) ).not.toThrow();
	} );

	it.each( REJECTED_SEEDS )( 'rejects non-sRGB seed %p', ( seed ) => {
		expect( () => build( seed ) ).toThrow();
	} );

	it( 'rejects oklch() even when the OKLCH color space is registered', () => {
		// Registering OKLCH would otherwise make `oklch(...)` strings parse.
		ColorSpace.register( OKLCH );
		expect( () => build( 'oklch(0.7 0.15 250)' ) ).toThrow();
	} );
}

describe( 'buildBgRamp', () => {
	testSeedColorContract( buildBgRamp );
} );

describe( 'buildAccentRamp', () => {
	testSeedColorContract( ( seed ) => buildAccentRamp( seed ) );
} );

describe( 'buildRamp', () => {
	testSeedColorContract( ( seed ) => buildRamp( seed, BG_RAMP_CONFIG ) );
} );
