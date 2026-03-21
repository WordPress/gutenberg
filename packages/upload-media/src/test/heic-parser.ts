/* eslint-disable no-bitwise, jsdoc/require-param */

/**
 * Internal dependencies
 */
import { parseHeic, reverseBits32 } from '../heic-parser';

// ---------------------------------------------------------------------------
// Helpers for constructing synthetic ISOBMFF structures
// ---------------------------------------------------------------------------

/** Write a big-endian uint32 into a DataView. */
function writeU32( view: DataView, offset: number, value: number ) {
	view.setUint32( offset, value );
}

/** Write a big-endian uint16 into a DataView. */
function writeU16( view: DataView, offset: number, value: number ) {
	view.setUint16( offset, value );
}

/** Build an ISOBMFF box (size + fourcc + data). */
function buildBox( type: string, data: Uint8Array ): Uint8Array {
	const size = 8 + data.length;
	const buf = new Uint8Array( size );
	const view = new DataView( buf.buffer );
	writeU32( view, 0, size );
	for ( let i = 0; i < 4; i++ ) {
		buf[ 4 + i ] = type.charCodeAt( i );
	}
	buf.set( data, 8 );
	return buf;
}

/** Build a FullBox (size + fourcc + version + flags + data). */
function buildFullBox(
	type: string,
	version: number,
	flags: number,
	data: Uint8Array
): Uint8Array {
	const inner = new Uint8Array( 4 + data.length );
	inner[ 0 ] = version;
	inner[ 1 ] = ( flags >> 16 ) & 0xff;
	inner[ 2 ] = ( flags >> 8 ) & 0xff;
	inner[ 3 ] = flags & 0xff;
	inner.set( data, 4 );
	return buildBox( type, inner );
}

/** Concatenate multiple Uint8Arrays. */
function concat( ...arrays: Uint8Array[] ): Uint8Array {
	const total = arrays.reduce( ( sum, a ) => sum + a.length, 0 );
	const result = new Uint8Array( total );
	let offset = 0;
	for ( const a of arrays ) {
		result.set( a, offset );
		offset += a.length;
	}
	return result;
}

/** Build a pitm box (Primary Item). */
function buildPitm( primaryItemId: number ): Uint8Array {
	const data = new Uint8Array( 2 );
	const view = new DataView( data.buffer );
	writeU16( view, 0, primaryItemId );
	return buildFullBox( 'pitm', 0, 0, data );
}

/**
 * Build a minimal hvcC box (HEVCDecoderConfigurationRecord).
 *
 * Fields: configVersion=1, profileSpace=0, tier=0, profileIdc=1,
 * compatFlags=0x60000000, constraintBytes=[0xB0,0,0,0,0,0],
 * levelIdc=93, then zeros for remaining fields + 0 NAL arrays.
 */
function buildHvcC(): Uint8Array {
	// HEVCDecoderConfigurationRecord (23 bytes minimum with 0 arrays)
	const record = new Uint8Array( 23 );
	record[ 0 ] = 1; // configurationVersion
	// byte1: profileSpace=0 (bits 6-7), tier=0 (bit 5), profileIdc=1 (bits 0-4)
	record[ 1 ] = 0x01;
	// general_profile_compatibility_flags = 0x60000000
	record[ 2 ] = 0x60;
	record[ 3 ] = 0x00;
	record[ 4 ] = 0x00;
	record[ 5 ] = 0x00;
	// general_constraint_indicator_flags (6 bytes) = [0xB0, 0, 0, 0, 0, 0]
	record[ 6 ] = 0xb0;
	// bytes 7-11 are zero (remaining constraint bytes)
	// general_level_idc = 93
	record[ 12 ] = 93;
	// remaining fields: min_spatial_segmentation_idc, parallelismType,
	// chromaFormat, bitDepthLuma, bitDepthChroma, avgFrameRate, misc, numOfArrays
	// All zero is valid for our test purposes.
	return buildBox( 'hvcC', record );
}

/** Build an ispe (Image Spatial Extents) box. */
function buildIspe( width: number, height: number ): Uint8Array {
	const data = new Uint8Array( 8 );
	const view = new DataView( data.buffer );
	writeU32( view, 0, width );
	writeU32( view, 4, height );
	return buildFullBox( 'ispe', 0, 0, data );
}

/** Build an ipco (Item Property Container) with the given property boxes. */
function buildIpco( ...properties: Uint8Array[] ): Uint8Array {
	return buildBox( 'ipco', concat( ...properties ) );
}

/**
 * Build an ipma (Item Property Association) box.
 *
 * @param associations Array of [itemId, propertyIndices[]]
 */
function buildIpma( associations: Array< [ number, number[] ] > ): Uint8Array {
	// Calculate data size: 4 (entry_count) + per entry: 2 (itemId) + 1 (assocCount) + N (indices)
	let dataSize = 4;
	for ( const [ , indices ] of associations ) {
		dataSize += 2 + 1 + indices.length;
	}
	const data = new Uint8Array( dataSize );
	const view = new DataView( data.buffer );
	writeU32( view, 0, associations.length );
	let pos = 4;
	for ( const [ itemId, indices ] of associations ) {
		writeU16( view, pos, itemId );
		pos += 2;
		data[ pos ] = indices.length;
		pos += 1;
		for ( const idx of indices ) {
			data[ pos ] = idx & 0x7f; // 7-bit index, essential=0
			pos += 1;
		}
	}
	return buildFullBox( 'ipma', 0, 0, data );
}

/** Build an iprp box containing ipco + ipma. */
function buildIprp( ipco: Uint8Array, ipma: Uint8Array ): Uint8Array {
	return buildBox( 'iprp', concat( ipco, ipma ) );
}

/**
 * Build an iloc box for version 0, with 4-byte offsets and 4-byte lengths.
 *
 * @param items Array of [itemId, [[offset, length], ...]]
 */
function buildIloc(
	items: Array< [ number, Array< [ number, number ] > ] >
): Uint8Array {
	// version 0: offsetSize=4, lengthSize=4, baseOffsetSize=0
	// per item: 2 (itemId) + 2 (data_reference_index) + 0 (base_offset) + 2 (extent_count) + N*(4+4)
	let dataSize = 2 + 2; // sizes byte + item_count
	for ( const [ , extents ] of items ) {
		dataSize += 2 + 2 + 2 + extents.length * 8;
	}
	const data = new Uint8Array( dataSize );
	const view = new DataView( data.buffer );
	// offset_size=4 (upper nibble), length_size=4 (lower nibble)
	data[ 0 ] = 0x44;
	// base_offset_size=0 (upper nibble), reserved=0
	data[ 1 ] = 0x00;
	// item_count
	writeU16( view, 2, items.length );
	let pos = 4;
	for ( const [ itemId, extents ] of items ) {
		writeU16( view, pos, itemId );
		pos += 2;
		// data_reference_index = 0
		writeU16( view, pos, 0 );
		pos += 2;
		// no base_offset (size=0)
		// extent_count
		writeU16( view, pos, extents.length );
		pos += 2;
		for ( const [ offset, length ] of extents ) {
			writeU32( view, pos, offset );
			pos += 4;
			writeU32( view, pos, length );
			pos += 4;
		}
	}
	return buildFullBox( 'iloc', 0, 0, data );
}

/** Build an hdlr (Handler) box with handler_type='pict'. */
function buildHdlr(): Uint8Array {
	// Minimal hdlr: 4 bytes pre_defined + 4 bytes handler_type + 12 bytes reserved + 1 byte name (null)
	const data = new Uint8Array( 21 );
	// handler_type = 'pict' at offset 4
	data[ 4 ] = 0x70; // p
	data[ 5 ] = 0x69; // i
	data[ 6 ] = 0x63; // c
	data[ 7 ] = 0x74; // t
	return buildFullBox( 'hdlr', 0, 0, data );
}

/**
 * Build a minimal single-image HEIC file as an ArrayBuffer.
 *
 * The image data is fake (not decodable) but the container structure
 * is valid for testing the parser.
 */
function buildSingleImageHeic( {
	width = 100,
	height = 80,
	imageData = new Uint8Array( [ 0xde, 0xad, 0xbe, 0xef ] ),
}: {
	width?: number;
	height?: number;
	imageData?: Uint8Array;
} = {} ): ArrayBuffer {
	const primaryItemId = 1;

	// Build property boxes (1-indexed: 1=ispe, 2=hvcC)
	const ispe = buildIspe( width, height );
	const hvcC = buildHvcC();
	const ipco = buildIpco( ispe, hvcC );
	const ipma = buildIpma( [ [ primaryItemId, [ 1, 2 ] ] ] );
	const iprp = buildIprp( ipco, ipma );

	// We need to know where mdat data will be placed.
	// Build everything except mdat first to calculate the offset.
	const ftyp = buildBox(
		'ftyp',
		new Uint8Array( [ 0x68, 0x65, 0x69, 0x63 ] )
	); // brand='heic'
	const pitm = buildPitm( primaryItemId );
	// iloc will reference the image data at an absolute file offset.
	// We'll calculate the actual offset after constructing the meta box.
	// Use a placeholder first, then fix it up.

	// Build meta children (without iloc - we'll add it after calculating offset)
	const hdlr = buildHdlr();
	const metaChildrenWithoutIloc = concat( hdlr, pitm, iprp );

	// Calculate sizes to determine mdat data offset:
	// ftyp + meta box header (8 + 4 fullbox) + metaChildren + iloc + mdat header (8)
	// iloc size depends on items, so build a placeholder iloc to get its size.
	const placeholderIloc = buildIloc( [
		[ primaryItemId, [ [ 0, imageData.length ] ] ],
	] );
	const metaSize =
		8 + 4 + metaChildrenWithoutIloc.length + placeholderIloc.length;
	const mdatDataOffset = ftyp.length + metaSize + 8; // +8 for mdat box header

	// Now build the real iloc with the correct offset
	const iloc = buildIloc( [
		[ primaryItemId, [ [ mdatDataOffset, imageData.length ] ] ],
	] );

	// Build meta box (FullBox)
	const metaChildren = concat( hdlr, pitm, iloc, iprp );
	const meta = buildFullBox( 'meta', 0, 0, metaChildren );

	// Build mdat
	const mdat = buildBox( 'mdat', imageData );

	// Assemble full file
	const file = concat( ftyp, meta, mdat );
	return file.buffer;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe( 'heic-parser', () => {
	describe( 'reverseBits32', () => {
		it( 'should reverse bits of 0x60000000 to 0x00000006', () => {
			expect( reverseBits32( 0x60000000 ) ).toBe( 0x00000006 );
		} );

		it( 'should reverse bits of 0 to 0', () => {
			expect( reverseBits32( 0 ) ).toBe( 0 );
		} );

		it( 'should reverse bits of 0xFFFFFFFF to 0xFFFFFFFF', () => {
			expect( reverseBits32( 0xffffffff ) ).toBe( 0xffffffff );
		} );

		it( 'should reverse bits of 1 to 0x80000000', () => {
			expect( reverseBits32( 1 ) ).toBe( 0x80000000 );
		} );

		it( 'should reverse bits of 0x80000000 to 1', () => {
			expect( reverseBits32( 0x80000000 ) ).toBe( 1 );
		} );
	} );

	describe( 'parseHeic – single image', () => {
		it( 'should parse a minimal single-image HEIC', () => {
			const imageData = new Uint8Array( [ 1, 2, 3, 4, 5, 6 ] );
			const buffer = buildSingleImageHeic( {
				width: 200,
				height: 150,
				imageData,
			} );

			const result = parseHeic( buffer );

			expect( result.outputWidth ).toBe( 200 );
			expect( result.outputHeight ).toBe( 150 );
			expect( result.tileWidth ).toBe( 200 );
			expect( result.tileHeight ).toBe( 150 );
			expect( result.tiles ).toHaveLength( 1 );
			expect( result.tiles[ 0 ].x ).toBe( 0 );
			expect( result.tiles[ 0 ].y ).toBe( 0 );
			expect( result.tiles[ 0 ].data ).toEqual( imageData );
		} );

		it( 'should build correct codec string for Main Profile L3.1', () => {
			const buffer = buildSingleImageHeic();
			const result = parseHeic( buffer );

			// profileIdc=1, compatFlags=0x60000000→reversed=6,
			// tier=L, level=93, constraints=B0
			expect( result.codecString ).toBe( 'hvc1.1.6.L93.B0' );
		} );

		it( 'should extract the HEVCDecoderConfigurationRecord', () => {
			const buffer = buildSingleImageHeic();
			const result = parseHeic( buffer );

			expect( result.description ).toBeInstanceOf( Uint8Array );
			expect( result.description.length ).toBe( 23 ); // minimal hvcC record
			expect( result.description[ 0 ] ).toBe( 1 ); // configurationVersion
		} );
	} );

	describe( 'parseHeic – error cases', () => {
		it( 'should throw for empty buffer', () => {
			expect( () => parseHeic( new ArrayBuffer( 0 ) ) ).toThrow(
				'No meta box found'
			);
		} );

		it( 'should throw for buffer without meta box', () => {
			const ftyp = buildBox(
				'ftyp',
				new Uint8Array( [ 0x68, 0x65, 0x69, 0x63 ] )
			);
			expect( () => parseHeic( ftyp.buffer ) ).toThrow(
				'No meta box found'
			);
		} );

		it( 'should throw when required boxes are missing', () => {
			// meta box with only hdlr (no pitm, iloc, iprp)
			const hdlr = buildHdlr();
			const meta = buildFullBox( 'meta', 0, 0, hdlr );
			expect( () => parseHeic( meta.buffer ) ).toThrow(
				'Missing required boxes'
			);
		} );
	} );
} );

/* eslint-enable no-bitwise, jsdoc/require-param */
