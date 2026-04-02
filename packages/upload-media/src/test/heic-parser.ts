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

/** Build an irot (Image Rotation) box. angle is 0-3 (multiplied by 90°). */
function buildIrot( angle: number ): Uint8Array {
	const data = new Uint8Array( [ angle & 0x3 ] );
	return buildBox( 'irot', data );
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
	rotation,
}: {
	width?: number;
	height?: number;
	imageData?: Uint8Array;
	rotation?: number;
} = {} ): ArrayBuffer {
	const primaryItemId = 1;

	// Build property boxes (1-indexed: 1=ispe, 2=hvcC, optionally 3=irot)
	const ispe = buildIspe( width, height );
	const hvcC = buildHvcC();
	const propBoxes: Uint8Array[] = [ ispe, hvcC ];
	const propIndices = [ 1, 2 ];
	if ( rotation !== undefined ) {
		propBoxes.push( buildIrot( rotation / 90 ) );
		propIndices.push( 3 );
	}
	const ipco = buildIpco( ...propBoxes );
	const ipma = buildIpma( [ [ primaryItemId, propIndices ] ] );
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

		it( 'should return rotation 0 when no irot box present', () => {
			const buffer = buildSingleImageHeic();
			const result = parseHeic( buffer );

			expect( result.rotation ).toBe( 0 );
		} );

		it( 'should parse 90° CCW rotation from irot box', () => {
			const buffer = buildSingleImageHeic( { rotation: 90 } );
			const result = parseHeic( buffer );

			expect( result.rotation ).toBe( 90 );
		} );

		it( 'should parse 270° CCW rotation from irot box', () => {
			const buffer = buildSingleImageHeic( { rotation: 270 } );
			const result = parseHeic( buffer );

			expect( result.rotation ).toBe( 270 );
		} );
	} );

	describe( 'parseHeic – grid/tiled image', () => {
		/**
		 * Build a grid HEIC file with multiple tiles (like iPhone photos).
		 *
		 * The structure is: ftyp, meta (hdlr, pitm, iinf, iref, iloc, iprp), mdat.
		 * The primary item is type 'grid' referencing tile items of type 'hvc1'.
		 */
		function buildGridHeic( {
			rows = 2,
			columns = 2,
			tileWidth = 512,
			tileHeight = 512,
			outputWidth = 1024,
			outputHeight = 1024,
			tileData = new Uint8Array( [ 0xca, 0xfe ] ),
		}: {
			rows?: number;
			columns?: number;
			tileWidth?: number;
			tileHeight?: number;
			outputWidth?: number;
			outputHeight?: number;
			tileData?: Uint8Array;
		} = {} ): ArrayBuffer {
			const gridItemId = 1;
			const tileCount = rows * columns;
			// Tile item IDs start at 2.
			const tileItemIds = Array.from(
				{ length: tileCount },
				( _, i ) => i + 2
			);

			// Grid descriptor: version(1), flags(1), rows_minus_one(1), columns_minus_one(1),
			// output_width(2), output_height(2) = 8 bytes (small fields).
			const gridDescriptor = new Uint8Array( 8 );
			gridDescriptor[ 0 ] = 0; // version
			gridDescriptor[ 1 ] = 0; // flags (no large fields)
			gridDescriptor[ 2 ] = rows - 1;
			gridDescriptor[ 3 ] = columns - 1;
			const gdv = new DataView( gridDescriptor.buffer );
			gdv.setUint16( 4, outputWidth );
			gdv.setUint16( 6, outputHeight );

			// Build property boxes (1=hvcC, 2=ispe)
			const hvcC = buildHvcC();
			const ispe = buildIspe( tileWidth, tileHeight );
			const ipco = buildIpco( hvcC, ispe );

			// ipma: each tile item → [1, 2] (hvcC at index 1, ispe at index 2)
			const associations: Array< [ number, number[] ] > = tileItemIds.map(
				( id ) => [ id, [ 1, 2 ] ] as [ number, number[] ]
			);
			const ipma = buildIpma( associations );
			const iprp = buildIprp( ipco, ipma );

			// iinf: grid item type 'grid', tile items type 'hvc1'.
			const iinf = buildIinf( [
				[ gridItemId, 'grid' ],
				...tileItemIds.map(
					( id ) => [ id, 'hvc1' ] as [ number, string ]
				),
			] );

			// iref: dimg reference from grid to tiles.
			const iref = buildIref( gridItemId, tileItemIds );

			// Build everything except iloc and mdat first to calculate offsets.
			const ftyp = buildBox(
				'ftyp',
				new Uint8Array( [ 0x68, 0x65, 0x69, 0x63 ] )
			);
			const hdlr = buildHdlr();
			const pitm = buildPitm( gridItemId );

			// We need iloc for grid item + all tile items.
			// First, build a placeholder iloc to calculate meta size.
			const placeholderItems: Array<
				[ number, Array< [ number, number ] > ]
			> = [
				[ gridItemId, [ [ 0, gridDescriptor.length ] ] ],
				...tileItemIds.map(
					( id ) =>
						[ id, [ [ 0, tileData.length ] ] ] as [
							number,
							Array< [ number, number ] >,
						]
				),
			];
			const placeholderIloc = buildIloc( placeholderItems );

			const metaChildren = concat(
				hdlr,
				pitm,
				iinf,
				iref,
				placeholderIloc,
				iprp
			);
			const metaSize = 8 + 4 + metaChildren.length; // box header + fullbox
			const mdatHeaderSize = 8;
			const mdatDataStart = ftyp.length + metaSize + mdatHeaderSize;

			// Grid descriptor is at the start of mdat, tiles follow.
			const gridOffset = mdatDataStart;
			let currentOffset = gridOffset + gridDescriptor.length;
			const tileOffsets: number[] = [];
			for ( let i = 0; i < tileCount; i++ ) {
				tileOffsets.push( currentOffset );
				currentOffset += tileData.length;
			}

			// Build real iloc.
			const realItems: Array< [ number, Array< [ number, number ] > ] > =
				[
					[ gridItemId, [ [ gridOffset, gridDescriptor.length ] ] ],
					...tileItemIds.map(
						( id, i ) =>
							[
								id,
								[ [ tileOffsets[ i ], tileData.length ] ],
							] as [ number, Array< [ number, number ] > ]
					),
				];
			const iloc = buildIloc( realItems );

			const realMetaChildren = concat(
				hdlr,
				pitm,
				iinf,
				iref,
				iloc,
				iprp
			);
			const meta = buildFullBox( 'meta', 0, 0, realMetaChildren );

			// Build mdat: grid descriptor + tile data.
			const mdatPayload = concat(
				gridDescriptor,
				...Array( tileCount ).fill( tileData )
			);
			const mdat = buildBox( 'mdat', mdatPayload );

			return concat( ftyp, meta, mdat ).buffer;
		}

		/** Build an iinf box with infe entries. */
		function buildIinf( items: Array< [ number, string ] > ): Uint8Array {
			// Each infe: version=2, flags=0, itemId(u16), protection_index(u16), item_type(4 bytes)
			const infeBoxes = items.map( ( [ itemId, itemType ] ) => {
				const infeData = new Uint8Array( 8 );
				const idv = new DataView( infeData.buffer );
				idv.setUint16( 0, itemId );
				idv.setUint16( 2, 0 ); // protection index
				for ( let k = 0; k < 4; k++ ) {
					infeData[ 4 + k ] = itemType.charCodeAt( k );
				}
				return buildFullBox( 'infe', 2, 0, infeData );
			} );

			// iinf: version=0, entry_count(u16), then infe boxes.
			const countData = new Uint8Array( 2 );
			new DataView( countData.buffer ).setUint16( 0, items.length );
			return buildFullBox(
				'iinf',
				0,
				0,
				concat( countData, ...infeBoxes )
			);
		}

		/** Build an iref box with a single dimg reference. */
		function buildIref( fromId: number, toIds: number[] ): Uint8Array {
			// dimg reference box: fromId(u16), refCount(u16), toIds(u16 each)
			const dimgData = new Uint8Array( 4 + toIds.length * 2 );
			const dv = new DataView( dimgData.buffer );
			dv.setUint16( 0, fromId );
			dv.setUint16( 2, toIds.length );
			for ( let i = 0; i < toIds.length; i++ ) {
				dv.setUint16( 4 + i * 2, toIds[ i ] );
			}
			const dimgBox = buildBox( 'dimg', dimgData );

			// iref is a FullBox (version=0).
			return buildFullBox( 'iref', 0, 0, dimgBox );
		}

		it( 'should parse a 2x2 grid HEIC', () => {
			const tileData = new Uint8Array( [ 0x11, 0x22, 0x33 ] );
			const buffer = buildGridHeic( {
				rows: 2,
				columns: 2,
				tileWidth: 512,
				tileHeight: 512,
				outputWidth: 1024,
				outputHeight: 1024,
				tileData,
			} );

			const result = parseHeic( buffer );

			expect( result.outputWidth ).toBe( 1024 );
			expect( result.outputHeight ).toBe( 1024 );
			expect( result.tileWidth ).toBe( 512 );
			expect( result.tileHeight ).toBe( 512 );
			expect( result.tiles ).toHaveLength( 4 );
		} );

		it( 'should place tiles in correct grid positions', () => {
			const buffer = buildGridHeic( {
				rows: 2,
				columns: 2,
				tileWidth: 256,
				tileHeight: 256,
			} );

			const result = parseHeic( buffer );

			expect( result.tiles[ 0 ].x ).toBe( 0 );
			expect( result.tiles[ 0 ].y ).toBe( 0 );
			expect( result.tiles[ 1 ].x ).toBe( 256 );
			expect( result.tiles[ 1 ].y ).toBe( 0 );
			expect( result.tiles[ 2 ].x ).toBe( 0 );
			expect( result.tiles[ 2 ].y ).toBe( 256 );
			expect( result.tiles[ 3 ].x ).toBe( 256 );
			expect( result.tiles[ 3 ].y ).toBe( 256 );
		} );

		it( 'should extract tile data for each tile', () => {
			const tileData = new Uint8Array( [ 0xaa, 0xbb ] );
			const buffer = buildGridHeic( { tileData } );

			const result = parseHeic( buffer );

			for ( const tile of result.tiles ) {
				expect( tile.data ).toEqual( tileData );
			}
		} );

		it( 'should extract codec string from grid tiles', () => {
			const buffer = buildGridHeic();
			const result = parseHeic( buffer );

			// Same hvcC as single image tests.
			expect( result.codecString ).toBe( 'hvc1.1.6.L93.B0' );
		} );

		it( 'should parse a 1x3 grid', () => {
			const buffer = buildGridHeic( {
				rows: 1,
				columns: 3,
				tileWidth: 100,
				tileHeight: 300,
				outputWidth: 300,
				outputHeight: 300,
			} );

			const result = parseHeic( buffer );

			expect( result.tiles ).toHaveLength( 3 );
			expect( result.tiles[ 0 ].x ).toBe( 0 );
			expect( result.tiles[ 1 ].x ).toBe( 100 );
			expect( result.tiles[ 2 ].x ).toBe( 200 );
			expect( result.outputWidth ).toBe( 300 );
			expect( result.outputHeight ).toBe( 300 );
		} );

		it( 'should extract the HEVCDecoderConfigurationRecord from grid', () => {
			const buffer = buildGridHeic();
			const result = parseHeic( buffer );

			expect( result.description ).toBeInstanceOf( Uint8Array );
			expect( result.description.length ).toBe( 23 );
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

		it( 'should throw for missing ipco or ipma inside iprp', () => {
			// meta with pitm, iloc, iprp but iprp is empty (no ipco/ipma)
			const hdlr = buildHdlr();
			const pitm = buildPitm( 1 );
			const iloc = buildIloc( [ [ 1, [ [ 0, 4 ] ] ] ] );
			const emptyIprp = buildBox( 'iprp', new Uint8Array( 0 ) );
			const meta = buildFullBox(
				'meta',
				0,
				0,
				concat( hdlr, pitm, iloc, emptyIprp )
			);
			expect( () => parseHeic( meta.buffer ) ).toThrow(
				'Missing ipco or ipma'
			);
		} );

		it( 'should throw when primary item has no location data', () => {
			// iloc with item ID 99, but pitm says primary is 1
			const hdlr = buildHdlr();
			const pitm = buildPitm( 1 );
			const iloc = buildIloc( [ [ 99, [ [ 0, 4 ] ] ] ] );
			const hvcC = buildHvcC();
			const ispe = buildIspe( 100, 100 );
			const ipco = buildIpco( hvcC, ispe );
			const ipma = buildIpma( [ [ 1, [ 1, 2 ] ] ] );
			const iprp = buildIprp( ipco, ipma );
			const meta = buildFullBox(
				'meta',
				0,
				0,
				concat( hdlr, pitm, iloc, iprp )
			);
			expect( () => parseHeic( meta.buffer ) ).toThrow(
				'No location data for primary item'
			);
		} );

		it( 'should throw when primary item has no property associations', () => {
			const hdlr = buildHdlr();
			const pitm = buildPitm( 1 );
			const iloc = buildIloc( [ [ 1, [ [ 0, 4 ] ] ] ] );
			const hvcC = buildHvcC();
			const ispe = buildIspe( 100, 100 );
			const ipco = buildIpco( hvcC, ispe );
			// ipma associates item 99, not item 1
			const ipma = buildIpma( [ [ 99, [ 1, 2 ] ] ] );
			const iprp = buildIprp( ipco, ipma );
			const meta = buildFullBox(
				'meta',
				0,
				0,
				concat( hdlr, pitm, iloc, iprp )
			);
			expect( () => parseHeic( meta.buffer ) ).toThrow(
				'No property associations'
			);
		} );
	} );
} );

/* eslint-enable no-bitwise, jsdoc/require-param */
