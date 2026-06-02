/* eslint-disable no-bitwise */
/**
 * Internal dependencies
 */
import { getAvifBitDepth, isHighBitDepthAvif } from '../avif-utils';

/**
 * Builds a single ISOBMFF box.
 *
 * @param type    Four-character box type.
 * @param payload Box payload bytes.
 * @return The encoded box.
 */
function box( type: string, payload: number[] ): number[] {
	const size = 8 + payload.length;
	return [
		( size >> 24 ) & 0xff,
		( size >> 16 ) & 0xff,
		( size >> 8 ) & 0xff,
		size & 0xff,
		type.charCodeAt( 0 ),
		type.charCodeAt( 1 ),
		type.charCodeAt( 2 ),
		type.charCodeAt( 3 ),
		...payload,
	];
}

/**
 * Builds a minimal AVIF-like container that carries the given `av1C` / `pixi`
 * boxes inside `meta > iprp > ipco`, which is all `getAvifBitDepth` inspects.
 *
 * @param itemBoxes Encoded property boxes to place inside `ipco`.
 * @return A File-like object exposing the encoded bytes.
 */
function makeAvif( itemBoxes: number[] ): File {
	const ipco = box( 'ipco', itemBoxes );
	const iprp = box( 'iprp', ipco );
	// `meta` is a FullBox: 4 bytes of version/flags before its children.
	const meta = box( 'meta', [ 0, 0, 0, 0, ...iprp ] );
	const bytes = new Uint8Array( meta );

	return {
		type: 'image/avif',
		size: bytes.byteLength,
		slice: () => ( {
			arrayBuffer: async () => bytes.buffer,
		} ),
	} as unknown as File;
}

// av1C payload: marker/version, then seq_profile<<5|level, then the flags byte
// holding high_bitdepth (bit 6) and twelve_bit (bit 5).
const av1c = ( { profile = 1, highBitdepth = false, twelveBit = false } ) =>
	box( 'av1C', [
		0x81,
		( profile << 5 ) | 8,
		( highBitdepth ? 0x40 : 0 ) | ( twelveBit ? 0x20 : 0 ),
		0x00,
	] );

// pixi payload: version/flags, num_channels, then bits-per-channel.
const pixi = ( depth: number ) =>
	box( 'pixi', [ 0, 0, 0, 0, 3, depth, depth, depth ] );

describe( 'getAvifBitDepth', () => {
	it( 'reads 10-bit from the av1C box', async () => {
		const file = makeAvif( av1c( { highBitdepth: true } ) );
		expect( await getAvifBitDepth( file ) ).toBe( 10 );
	} );

	it( 'reads 12-bit from the av1C box (profile 2)', async () => {
		const file = makeAvif(
			av1c( { profile: 2, highBitdepth: true, twelveBit: true } )
		);
		expect( await getAvifBitDepth( file ) ).toBe( 12 );
	} );

	it( 'reads 8-bit from the av1C box', async () => {
		const file = makeAvif( av1c( { highBitdepth: false } ) );
		expect( await getAvifBitDepth( file ) ).toBe( 8 );
	} );

	it( 'reads bit depth from the pixi box', async () => {
		const file = makeAvif( pixi( 10 ) );
		expect( await getAvifBitDepth( file ) ).toBe( 10 );
	} );

	it( 'defaults to 8 when no bit-depth box is present', async () => {
		const file = makeAvif( [] );
		expect( await getAvifBitDepth( file ) ).toBe( 8 );
	} );

	it( 'defaults to 8 on unparseable input', async () => {
		const garbage = {
			type: 'image/avif',
			size: 4,
			slice: () => ( {
				arrayBuffer: async () =>
					new Uint8Array( [ 1, 2, 3, 4 ] ).buffer,
			} ),
		} as unknown as File;
		expect( await getAvifBitDepth( garbage ) ).toBe( 8 );
	} );
} );

describe( 'isHighBitDepthAvif', () => {
	it( 'returns true for a 10-bit AVIF', async () => {
		const file = makeAvif( av1c( { highBitdepth: true } ) );
		expect( await isHighBitDepthAvif( file ) ).toBe( true );
	} );

	it( 'returns false for an 8-bit AVIF', async () => {
		const file = makeAvif( av1c( { highBitdepth: false } ) );
		expect( await isHighBitDepthAvif( file ) ).toBe( false );
	} );

	it( 'returns false for non-AVIF files without parsing', async () => {
		const file = {
			type: 'image/jpeg',
			size: 0,
			slice: () => {
				throw new Error( 'should not be called' );
			},
		} as unknown as File;
		expect( await isHighBitDepthAvif( file ) ).toBe( false );
	} );
} );
/* eslint-enable no-bitwise */
