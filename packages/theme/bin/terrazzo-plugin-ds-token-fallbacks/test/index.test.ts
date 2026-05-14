jest.mock( '@terrazzo/plugin-css', () => ( { FORMAT_ID: 'css/value' } ) );
jest.mock( 'colorjs.io/fn', () => {
	const OKLCH = { id: 'oklch' };
	const sRGB = { id: 'srgb' };
	const registry: Record< string, unknown > = {};
	return {
		__esModule: true,
		OKLCH,
		sRGB,
		ColorSpace: {
			register: jest.fn( ( s: { id: string } ) => {
				registry[ s.id ] = s;
			} ),
			registry,
		},
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
