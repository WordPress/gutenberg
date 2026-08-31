import { isHeicBuffer, isHeicFile } from '../utils';

/**
 * Builds a minimal ISOBMFF File Type Box.
 *
 * @param brands Major brand, followed by any compatible brands.
 * @return ArrayBuffer holding a synthetic file header.
 */
function buildFtyp( ...brands: string[] ): ArrayBuffer {
	const [ majorBrand, ...compatibleBrands ] = brands;
	// "ftyp", the major brand, the zeroed minor version, the compatible brands.
	const box = `ftyp${ majorBrand }\0\0\0\0${ compatibleBrands.join( '' ) }`;
	return new Uint8Array( [
		// Box size, counting these four bytes.
		0x00,
		0x00,
		0x00,
		4 + box.length,
		...[ ...box ].map( ( character ) => character.charCodeAt( 0 ) ),
	] ).buffer;
}

describe( 'isHeicBuffer', () => {
	it( 'returns false for a buffer with no File Type Box', () => {
		// A JPEG, which opens with the SOI marker instead.
		expect(
			isHeicBuffer(
				new Uint8Array( [ 0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10 ] ).buffer
			)
		).toBe( false );
	} );

	it( 'returns false for a buffer too short to hold a File Type Box', () => {
		expect( isHeicBuffer( new Uint8Array( [ 0x00, 0x00 ] ).buffer ) ).toBe(
			false
		);
	} );

	it( 'returns true for a HEIC major brand', () => {
		expect( isHeicBuffer( buildFtyp( 'heic' ) ) ).toBe( true );
	} );

	it( 'returns true when HEIC is only a compatible brand', () => {
		expect( isHeicBuffer( buildFtyp( 'mif1', 'miaf', 'heic' ) ) ).toBe(
			true
		);
	} );

	it( 'returns true for a HEIF image sequence', () => {
		expect( isHeicBuffer( buildFtyp( 'msf1', 'hevc' ) ) ).toBe( true );
	} );

	it( 'returns false for AVIF, which declares the generic HEIF brand', () => {
		expect( isHeicBuffer( buildFtyp( 'avif', 'mif1' ) ) ).toBe( false );
	} );

	it( 'returns false for an MP4 video', () => {
		expect( isHeicBuffer( buildFtyp( 'isom', 'iso2', 'mp41' ) ) ).toBe(
			false
		);
	} );
} );

describe( 'isHeicFile', () => {
	it( 'trusts a HEIC MIME type without reading the file', async () => {
		const file = new File( [ 'not really heic' ], 'photo.heic', {
			type: 'image/heic',
		} );

		await expect( isHeicFile( file ) ).resolves.toBe( true );
	} );

	it( 'recognizes a HEIC file named .jpg', async () => {
		const file = new File( [ buildFtyp( 'heic' ) ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		await expect( isHeicFile( file ) ).resolves.toBe( true );
	} );

	it( 'recognizes a HEIC file the browser could not type at all', async () => {
		const file = new File( [ buildFtyp( 'heic' ) ], 'photo', {
			type: '',
		} );

		await expect( isHeicFile( file ) ).resolves.toBe( true );
	} );

	it( 'leaves a real JPEG alone', async () => {
		const file = new File(
			[ new Uint8Array( [ 0xff, 0xd8, 0xff, 0xe0 ] ) ],
			'photo.jpg',
			{ type: 'image/jpeg' }
		);

		await expect( isHeicFile( file ) ).resolves.toBe( false );
	} );

	it( 'does not read files that are not images', async () => {
		// A HEIF-branded video container: nothing here should reach the
		// still-image conversion path.
		const file = new File( [ buildFtyp( 'msf1' ) ], 'clip.mp4', {
			type: 'video/mp4',
		} );

		await expect( isHeicFile( file ) ).resolves.toBe( false );
	} );
} );
