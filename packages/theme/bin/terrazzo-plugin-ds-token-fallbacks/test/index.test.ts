jest.mock( '@terrazzo/plugin-css', () => ( { FORMAT_ID: 'css/value' } ) );
jest.mock( 'colorjs.io/fn', () => {
	const OKLCH = { id: 'oklch' };
	return {
		__esModule: true,
		OKLCH,
		sRGB: {},
		P3: {},
		HSL: {},
		ColorSpace: { register: jest.fn() },
		to: jest.fn( () => [ 0, 0, 0 ] ),
		get: jest.fn( () => 0 ),
	};
} );

import { computeBrandFallback } from '../index';

describe( 'computeBrandFallback', () => {
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
