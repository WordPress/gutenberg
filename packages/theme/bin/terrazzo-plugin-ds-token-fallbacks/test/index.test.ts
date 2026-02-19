jest.mock( '@terrazzo/plugin-css', () => ( { FORMAT_ID: 'css/value' } ) );
jest.mock( 'colorjs.io/fn', () => {
	const oklchLookup: Record< string, [ number, number, number ] > = {
		'#3858e9': [ 0.508, 0.207, 271.4 ],
		'#2e49d9': [ 0.47, 0.197, 271.4 ],
		'#ff0000': [ 0.628, 0.258, 29.2 ],
	};

	const OKLCH = { id: 'oklch' };
	return {
		__esModule: true,
		OKLCH,
		sRGB: {},
		P3: {},
		HSL: {},
		ColorSpace: { register: jest.fn() },
		to: jest.fn(
			( hex: string ) => oklchLookup[ hex.toLowerCase() ] || [ 0, 0, 0 ]
		),
		get: jest.fn(
			(
				vals: [ number, number, number ],
				[ , channel ]: [ unknown, string ]
			) => {
				const idx = (
					{ l: 0, c: 1, h: 2 } as Record< string, number >
				 )[ channel ];
				return vals[ idx ] ?? 0;
			}
		),
	};
} );

import { optimalMixPercentage, computeBrandFallback } from '../index';

describe( 'optimalMixPercentage', () => {
	it( 'finds a low-error percentage when mixing seed with black', () => {
		const seedOklab = { l: 0.51, a: -0.02, b: -0.21 };
		const darkerTarget = { l: 0.47, a: -0.019, b: -0.195 };

		const result = optimalMixPercentage( seedOklab, darkerTarget, 'black' );
		expect( result.roundedP ).toBeGreaterThan( 0 );
		expect( result.roundedP ).toBeLessThan( 100 );
		expect( result.dE ).toBeLessThan( 0.05 );
	} );

	it( 'finds a low-error percentage when mixing seed with white', () => {
		const seedOklab = { l: 0.51, a: -0.02, b: -0.21 };
		const lighterTarget = { l: 0.95, a: -0.002, b: -0.021 };

		const result = optimalMixPercentage(
			seedOklab,
			lighterTarget,
			'white'
		);
		expect( result.roundedP ).toBeGreaterThan( 0 );
		expect( result.roundedP ).toBeLessThan( 100 );
		expect( result.dE ).toBeLessThan( 0.05 );
	} );

	it( 'returns Infinity deltaE when the optimal percentage is out of range', () => {
		const seedOklab = { l: 0.51, a: -0.02, b: -0.21 };
		const pureBlack = { l: 0, a: 0, b: 0 };

		const result = optimalMixPercentage( seedOklab, pureBlack, 'black' );
		expect( result.dE ).toBe( Infinity );
	} );
} );

describe( 'computeBrandFallback', () => {
	it( 'returns admin theme color var for the exact seed', () => {
		expect( computeBrandFallback( '#3858e9' ) ).toBe(
			'var(--wp-admin-theme-color, #3858e9)'
		);
	} );

	it( 'returns a color-mix() expression for a derived shade', () => {
		const result = computeBrandFallback( '#2e49d9' );
		expect( result ).toMatch(
			/^color-mix\(in oklch, var\(--wp-admin-theme-color, #3858e9\) \d+%, (black|white)\)$/
		);
	} );

	it( 'returns the plain hex when color-mix cannot approximate', () => {
		expect( computeBrandFallback( '#ff0000' ) ).toBe( '#ff0000' );
	} );

	it( 'throws on colors with alpha (8-digit hex)', () => {
		expect( () => computeBrandFallback( '#3858e980' ) ).toThrow(
			/does not support colors with alpha/
		);
	} );

	it( 'throws on colors with alpha (4-digit hex)', () => {
		expect( () => computeBrandFallback( '#f008' ) ).toThrow(
			/does not support colors with alpha/
		);
	} );
} );
