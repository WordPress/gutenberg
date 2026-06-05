import { computeBrandFallback } from '../index';

jest.mock( '@terrazzo/plugin-css', () => ( { FORMAT_ID: 'css/value' } ) );

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
