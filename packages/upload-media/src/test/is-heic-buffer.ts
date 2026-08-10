import { isHeicBuffer } from '../utils';

/**
 * Builds a minimal ISOBMFF File Type Box.
 *
 * @param brands Major brand, followed by any compatible brands.
 * @return ArrayBuffer of a synthetic file header.
 */
function buildFtyp( ...brands: string[] ): ArrayBuffer {
	const [ majorBrand, ...compatibleBrands ] = brands;
	// "ftyp", the major brand, the zeroed minor version, the compatible brands.
	const box = `ftyp${ majorBrand }\0\0\0\0${ compatibleBrands.join( '' ) }`;
	return new Uint8Array( [
		// Box size, including these four bytes.
		0x00,
		0x00,
		0x00,
		4 + box.length,
		...[ ...box ].map( ( c ) => c.charCodeAt( 0 ) ),
	] ).buffer;
}

describe( 'isHeicBuffer', () => {
	it( 'returns false for a buffer with no File Type Box', () => {
		expect(
			isHeicBuffer(
				new Uint8Array( [ 0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10 ] ).buffer
			)
		).toBe( false );
	} );

	it( 'returns true for a HEIC major brand', () => {
		expect( isHeicBuffer( buildFtyp( 'heic' ) ) ).toBe( true );
	} );

	it( 'returns true for a HEIC compatible brand', () => {
		expect( isHeicBuffer( buildFtyp( 'mif1', 'miaf', 'heic' ) ) ).toBe(
			true
		);
	} );

	it( 'returns false for AVIF, which declares the generic HEIF brand', () => {
		expect( isHeicBuffer( buildFtyp( 'avif', 'mif1' ) ) ).toBe( false );
	} );
} );
