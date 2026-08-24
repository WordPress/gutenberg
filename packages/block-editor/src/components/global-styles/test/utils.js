import { getDuotoneSlugFromPreset } from '../utils';

describe( 'global styles utils', () => {
	describe( 'getDuotoneSlugFromPreset', () => {
		it( 'should return the slug of a preset reference', () => {
			expect(
				getDuotoneSlugFromPreset( 'var:preset|duotone|grayscale' )
			).toBe( 'grayscale' );
		} );

		it( 'should return the slug of a custom preset', () => {
			expect(
				getDuotoneSlugFromPreset(
					'var:preset|duotone|custom-duotone-2'
				)
			).toBe( 'custom-duotone-2' );
		} );

		it( 'should return undefined for custom colors', () => {
			expect(
				getDuotoneSlugFromPreset( [ '#000000', '#ffffff' ] )
			).toBeUndefined();
		} );

		it( 'should return undefined for unset and for no value', () => {
			expect( getDuotoneSlugFromPreset( 'unset' ) ).toBeUndefined();
			expect( getDuotoneSlugFromPreset( undefined ) ).toBeUndefined();
		} );
	} );
} );
