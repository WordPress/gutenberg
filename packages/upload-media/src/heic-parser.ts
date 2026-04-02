/* eslint-disable no-bitwise */

/**
 * Lightweight HEIC (ISOBMFF) container parser.
 *
 * Extracts the HEVC decoder configuration and compressed image data from
 * HEIC files, including grid/tiled images (the common iPhone format).
 * This enables decoding via the WebCodecs VideoDecoder API without
 * shipping our own HEVC codec.
 *
 * Only the container format is parsed here (no patented codec involved).
 * Actual HEVC decoding is delegated to the browser's platform decoder.
 */

/** A single tile to decode and draw. */
export interface HeicTile {
	/** Raw HEVC bitstream for this tile. */
	data: Uint8Array;
	/** X position on the output canvas. */
	x: number;
	/** Y position on the output canvas. */
	y: number;
}

export interface HeicImageData {
	/** HEVC codec string for VideoDecoder (e.g. 'hvc1.1.6.L93.B0'). */
	codecString: string;
	/** Raw HEVCDecoderConfigurationRecord bytes for VideoDecoder description. */
	description: Uint8Array;
	/** Tiles to decode (1 for single-image, many for grid). */
	tiles: HeicTile[];
	/** Width of each HEVC tile in pixels. */
	tileWidth: number;
	/** Height of each HEVC tile in pixels. */
	tileHeight: number;
	/** Final output width in pixels. */
	outputWidth: number;
	/** Final output height in pixels. */
	outputHeight: number;
	/** Rotation angle in degrees counter-clockwise (0, 90, 180, 270). */
	rotation: number;
}

// ---------------------------------------------------------------------------
// Binary reader
// ---------------------------------------------------------------------------

class Reader {
	readonly view: DataView;
	readonly buffer: ArrayBuffer;
	pos: number;

	constructor( buffer: ArrayBuffer, offset = 0 ) {
		this.buffer = buffer;
		this.view = new DataView( buffer );
		this.pos = offset;
	}

	u8(): number {
		const v = this.view.getUint8( this.pos );
		this.pos += 1;
		return v;
	}

	u16(): number {
		const v = this.view.getUint16( this.pos );
		this.pos += 2;
		return v;
	}

	u32(): number {
		const v = this.view.getUint32( this.pos );
		this.pos += 4;
		return v;
	}

	u64(): number {
		const hi = this.view.getUint32( this.pos );
		const lo = this.view.getUint32( this.pos + 4 );
		this.pos += 8;
		return hi * 0x100000000 + lo;
	}

	/**
	 * Read a variable-width unsigned integer (0, 4 or 8 bytes).
	 *
	 * @param size Byte width to read (0, 4, or 8).
	 */
	uN( size: number ): number {
		if ( size === 0 ) {
			return 0;
		}
		if ( size === 4 ) {
			return this.u32();
		}
		if ( size === 8 ) {
			return this.u64();
		}
		throw new Error( `Unsupported uint size: ${ size }` );
	}

	str( len: number ): string {
		let s = '';
		for ( let i = 0; i < len; i++ ) {
			s += String.fromCharCode( this.view.getUint8( this.pos + i ) );
		}
		this.pos += len;
		return s;
	}

	bytes( len: number ): Uint8Array {
		const b = new Uint8Array( this.buffer, this.pos, len );
		this.pos += len;
		return new Uint8Array( b ); // copy to avoid detach issues
	}
}

// ---------------------------------------------------------------------------
// ISOBMFF box helpers
// ---------------------------------------------------------------------------

interface BoxInfo {
	type: string;
	offset: number;
	size: number;
	headerSize: number;
}

function readBox( r: Reader ): BoxInfo | null {
	if ( r.pos + 8 > r.view.byteLength ) {
		return null;
	}
	const offset = r.pos;
	let size: number = r.u32();
	const type = r.str( 4 );
	let headerSize = 8;

	if ( size === 1 ) {
		size = r.u64();
		headerSize = 16;
	} else if ( size === 0 ) {
		size = r.view.byteLength - offset;
	}

	return { type, offset, size, headerSize };
}

function findBoxes( r: Reader, start: number, end: number ): BoxInfo[] {
	const boxes: BoxInfo[] = [];
	r.pos = start;
	while ( r.pos < end ) {
		const box = readBox( r );
		if ( ! box || box.size < 8 ) {
			break;
		}
		boxes.push( box );
		r.pos = box.offset + box.size;
	}
	return boxes;
}

function findBox(
	r: Reader,
	start: number,
	end: number,
	type: string
): BoxInfo | undefined {
	r.pos = start;
	while ( r.pos < end ) {
		const box = readBox( r );
		if ( ! box || box.size < 8 ) {
			break;
		}
		if ( box.type === type ) {
			return box;
		}
		r.pos = box.offset + box.size;
	}
	return undefined;
}

// ---------------------------------------------------------------------------
// Specific box parsers
// ---------------------------------------------------------------------------

/**
 * Parse Primary Item Box → primary item ID.
 *
 * @param r   Binary reader.
 * @param box BoxInfo for the pitm box.
 */
function parsePitm( r: Reader, box: BoxInfo ): number {
	r.pos = box.offset + box.headerSize;
	const version = r.u8();
	r.pos += 3; // flags
	return version === 0 ? r.u16() : r.u32();
}

interface ItemExtent {
	offset: number;
	length: number;
}

interface ItemLocation {
	/** 0 = file offset (mdat), 1 = idat offset. */
	constructionMethod: number;
	extents: ItemExtent[];
}

/**
 * Parse Item Location Box → map of item ID to data extents.
 *
 * @param r   Binary reader.
 * @param box BoxInfo for the iloc box.
 */
function parseIloc( r: Reader, box: BoxInfo ): Map< number, ItemLocation > {
	r.pos = box.offset + box.headerSize;
	const version = r.u8();
	r.pos += 3; // flags

	const byte1 = r.u8();
	const offsetSize = ( byte1 >> 4 ) & 0xf;
	const lengthSize = byte1 & 0xf;

	const byte2 = r.u8();
	const baseOffsetSize = ( byte2 >> 4 ) & 0xf;
	const indexSize = version >= 1 ? byte2 & 0xf : 0;

	const itemCount = version < 2 ? r.u16() : r.u32();
	const items = new Map< number, ItemLocation >();

	for ( let i = 0; i < itemCount; i++ ) {
		const itemId = version < 2 ? r.u16() : r.u32();

		let constructionMethod = 0;
		if ( version === 1 || version === 2 ) {
			const cm = r.u16();
			constructionMethod = cm & 0xf; // lower 4 bits
		}

		r.u16(); // data_reference_index
		const baseOffset = r.uN( baseOffsetSize );
		const extentCount = r.u16();
		const extents: ItemExtent[] = [];

		for ( let j = 0; j < extentCount; j++ ) {
			if ( version >= 1 ) {
				r.uN( indexSize ); // extent_index — skip
			}
			const extOffset = r.uN( offsetSize );
			const extLength = r.uN( lengthSize );
			extents.push( {
				offset: baseOffset + extOffset,
				length: extLength,
			} );
		}

		items.set( itemId, { constructionMethod, extents } );
	}

	return items;
}

/**
 * Parse Item Property Association Box → map of item ID to 1-based property indices.
 *
 * @param r   Binary reader.
 * @param box BoxInfo for the ipma box.
 */
function parseIpma( r: Reader, box: BoxInfo ): Map< number, number[] > {
	r.pos = box.offset + box.headerSize;
	const vf = r.u32(); // version (8 bits) + flags (24 bits)
	const version = vf >>> 24;
	const flags = vf & 0xffffff;
	const largeIndex = ( flags & 1 ) !== 0;

	const entryCount = r.u32();
	const associations = new Map< number, number[] >();

	for ( let i = 0; i < entryCount; i++ ) {
		const itemId = version < 1 ? r.u16() : r.u32();
		const assocCount = r.u8();
		const indices: number[] = [];

		for ( let j = 0; j < assocCount; j++ ) {
			if ( largeIndex ) {
				indices.push( r.u16() & 0x7fff ); // strip essential bit
			} else {
				indices.push( r.u8() & 0x7f ); // strip essential bit
			}
		}

		associations.set( itemId, indices );
	}

	return associations;
}

/**
 * Parse Image Spatial Extents → width & height.
 *
 * @param r   Binary reader.
 * @param box BoxInfo for the ispe box.
 */
function parseIspe(
	r: Reader,
	box: BoxInfo
): { width: number; height: number } {
	// ispe is a FullBox: skip version (1) + flags (3).
	r.pos = box.offset + box.headerSize + 4;
	return { width: r.u32(), height: r.u32() };
}

/**
 * Parse Image Rotation box → rotation angle in degrees CCW.
 *
 * Format: 1 byte with reserved (6 bits) + angle (2 bits).
 * angle * 90 = rotation in degrees counter-clockwise.
 *
 * @param r   Binary reader.
 * @param box BoxInfo for the irot box.
 */
function parseIrot( r: Reader, box: BoxInfo ): number {
	r.pos = box.offset + box.headerSize;
	return ( r.u8() & 0x3 ) * 90;
}

/**
 * Parse Item Info Box → map of item ID to item type (4-char code).
 *
 * @param r   Binary reader.
 * @param box BoxInfo for the iinf box.
 */
function parseIinf( r: Reader, box: BoxInfo ): Map< number, string > {
	r.pos = box.offset + box.headerSize;
	const version = r.u8();
	r.pos += 3; // flags

	const entryCount = version === 0 ? r.u16() : r.u32();
	const itemTypes = new Map< number, string >();

	// Parse infe (ItemInfoEntry) sub-boxes.
	const entriesStart = r.pos;
	const boxEnd = box.offset + box.size;

	const infeBoxes = findBoxes( r, entriesStart, boxEnd );
	for ( let i = 0; i < Math.min( entryCount, infeBoxes.length ); i++ ) {
		const infe = infeBoxes[ i ];
		if ( infe.type !== 'infe' ) {
			continue;
		}
		r.pos = infe.offset + infe.headerSize;
		const infeVersion = r.u8();
		r.pos += 3; // flags

		if ( infeVersion >= 2 ) {
			const itemId = infeVersion === 2 ? r.u16() : r.u32();
			r.u16(); // item_protection_index
			const itemType = r.str( 4 );
			itemTypes.set( itemId, itemType );
		}
	}

	return itemTypes;
}

/**
 * Parse Item Reference Box → map of (fromItemId) to array of referenced item IDs,
 * filtered by reference type.
 *
 * @param r       Binary reader.
 * @param box     BoxInfo for the iref box.
 * @param refType Reference type to filter (e.g. 'dimg').
 */
function parseIref(
	r: Reader,
	box: BoxInfo,
	refType: string
): Map< number, number[] > {
	r.pos = box.offset + box.headerSize;
	const version = r.u8();
	r.pos += 3; // flags

	const refs = new Map< number, number[] >();
	const boxEnd = box.offset + box.size;

	while ( r.pos < boxEnd ) {
		const refBox = readBox( r );
		if ( ! refBox || refBox.size < 8 ) {
			break;
		}

		r.pos = refBox.offset + refBox.headerSize;
		const fromId = version === 0 ? r.u16() : r.u32();
		const refCount = r.u16();
		const toIds: number[] = [];

		for ( let i = 0; i < refCount; i++ ) {
			toIds.push( version === 0 ? r.u16() : r.u32() );
		}

		if ( refBox.type === refType ) {
			refs.set( fromId, toIds );
		}

		r.pos = refBox.offset + refBox.size;
	}

	return refs;
}

// ---------------------------------------------------------------------------
// HEVC codec string construction
// ---------------------------------------------------------------------------

/**
 * Reverse all 32 bits of a number.
 *
 * @param n 32-bit unsigned integer.
 */
export function reverseBits32( n: number ): number {
	n = ( ( n >>> 1 ) & 0x55555555 ) | ( ( n & 0x55555555 ) << 1 );
	n = ( ( n >>> 2 ) & 0x33333333 ) | ( ( n & 0x33333333 ) << 2 );
	n = ( ( n >>> 4 ) & 0x0f0f0f0f ) | ( ( n & 0x0f0f0f0f ) << 4 );
	n = ( ( n >>> 8 ) & 0x00ff00ff ) | ( ( n & 0x00ff00ff ) << 8 );
	n = ( n >>> 16 ) | ( n << 16 );
	return n >>> 0;
}

/**
 * Build an HEVC codec string from an HEVCDecoderConfigurationRecord.
 *
 * Format: hvc1.{profile}.{compat}.{tier}{level}[.{constraints}]
 * See ISO 14496-15 Annex E and W3C WebCodecs HEVC Codec Registration.
 *
 * @param r            Binary reader.
 * @param recordOffset Byte offset of the HEVCDecoderConfigurationRecord.
 */
function buildCodecString( r: Reader, recordOffset: number ): string {
	r.pos = recordOffset;
	r.u8(); // configurationVersion

	const byte1 = r.u8();
	const profileSpace = ( byte1 >> 6 ) & 0x3;
	const tierFlag = ( byte1 >> 5 ) & 0x1;
	const profileIdc = byte1 & 0x1f;

	const compatFlags = r.u32();
	const constraintBytes = r.bytes( 6 );
	const levelIdc = r.u8();

	// Profile: optional space prefix (A/B/C) + profile_idc.
	const spacePrefix =
		profileSpace > 0 ? String.fromCharCode( 64 + profileSpace ) : '';

	// Compatibility flags: bit-reversed, as hex.
	const compatHex = reverseBits32( compatFlags ).toString( 16 ).toUpperCase();

	// Tier: 'L' (Main) or 'H' (High).
	const tierChar = tierFlag ? 'H' : 'L';

	// Constraint indicator flags: each byte as hex, trailing zeros removed.
	let lastNonZero = -1;
	for ( let i = 5; i >= 0; i-- ) {
		if ( constraintBytes[ i ] !== 0 ) {
			lastNonZero = i;
			break;
		}
	}
	let constraintStr = '';
	if ( lastNonZero >= 0 ) {
		const parts: string[] = [];
		for ( let i = 0; i <= lastNonZero; i++ ) {
			parts.push( constraintBytes[ i ].toString( 16 ).toUpperCase() );
		}
		constraintStr = '.' + parts.join( '.' );
	}

	return `hvc1.${ spacePrefix }${ profileIdc }.${ compatHex }.${ tierChar }${ levelIdc }${ constraintStr }`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read item data by concatenating all extents for a given item location.
 *
 * For construction_method 0, offsets are absolute file positions.
 * For construction_method 1, offsets are relative to the idat box data.
 *
 * @param buffer     File ArrayBuffer.
 * @param loc        Item location with extents.
 * @param idatOffset Byte offset of the idat box's data within the file.
 */
function readItemData(
	buffer: ArrayBuffer,
	loc: ItemLocation,
	idatOffset: number
): Uint8Array {
	const baseOffset = loc.constructionMethod === 1 ? idatOffset : 0;

	if ( loc.extents.length === 1 ) {
		const ext = loc.extents[ 0 ];
		const start = baseOffset + ext.offset;
		return new Uint8Array( buffer.slice( start, start + ext.length ) );
	}
	let totalLength = 0;
	for ( const ext of loc.extents ) {
		totalLength += ext.length;
	}
	const data = new Uint8Array( totalLength );
	let pos = 0;
	for ( const ext of loc.extents ) {
		const start = baseOffset + ext.offset;
		data.set(
			new Uint8Array( buffer.slice( start, start + ext.length ) ),
			pos
		);
		pos += ext.length;
	}
	return data;
}

/**
 * Find hvcC, ispe, and irot property boxes for a given item.
 *
 * @param propIndices 1-based property indices from ipma.
 * @param properties  All property boxes from ipco.
 */
function findHvcProperties(
	propIndices: number[],
	properties: BoxInfo[]
): { hvcCBox: BoxInfo; ispeBox: BoxInfo; irotBox?: BoxInfo } {
	let hvcCBox: BoxInfo | undefined;
	let ispeBox: BoxInfo | undefined;
	let irotBox: BoxInfo | undefined;

	for ( const idx of propIndices ) {
		if ( idx < 1 || idx > properties.length ) {
			continue;
		}
		const prop = properties[ idx - 1 ];
		if ( prop.type === 'hvcC' && ! hvcCBox ) {
			hvcCBox = prop;
		}
		if ( prop.type === 'ispe' && ! ispeBox ) {
			ispeBox = prop;
		}
		if ( prop.type === 'irot' && ! irotBox ) {
			irotBox = prop;
		}
	}

	if ( ! hvcCBox ) {
		throw new Error( 'No HEVC configuration (hvcC) found' );
	}
	if ( ! ispeBox ) {
		throw new Error( 'No image dimensions (ispe) found' );
	}

	return { hvcCBox, ispeBox, irotBox };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Parse a HEIC file and extract the data needed for VideoDecoder.
 *
 * Handles both single-image HEIC files and grid/tiled images (the common
 * iPhone format where the full image is split into multiple HEVC tiles).
 *
 * @param buffer Raw HEIC file contents.
 * @return Parsed image data including codec config and HEVC tile data.
 * @throws If the file is not a valid HEIC or lacks required boxes.
 */
export function parseHeic( buffer: ArrayBuffer ): HeicImageData {
	const r = new Reader( buffer );
	const fileEnd = buffer.byteLength;

	// Find top-level 'meta' box.
	const metaBox = findBox( r, 0, fileEnd, 'meta' );
	if ( ! metaBox ) {
		throw new Error( 'No meta box found in HEIC file' );
	}

	// meta is a FullBox: children start after version (1) + flags (3).
	const metaChildStart = metaBox.offset + metaBox.headerSize + 4;
	const metaEnd = metaBox.offset + metaBox.size;

	// Locate required child boxes within meta.
	const children = findBoxes( r, metaChildStart, metaEnd );
	const pitmBox = children.find( ( b ) => b.type === 'pitm' );
	const ilocBox = children.find( ( b ) => b.type === 'iloc' );
	const iprpBox = children.find( ( b ) => b.type === 'iprp' );
	const iinfBox = children.find( ( b ) => b.type === 'iinf' );
	const irefBox = children.find( ( b ) => b.type === 'iref' );
	const idatBox = children.find( ( b ) => b.type === 'idat' );

	// idat data offset (for construction_method 1 items).
	const idatOffset = idatBox ? idatBox.offset + idatBox.headerSize : 0;

	if ( ! pitmBox || ! ilocBox || ! iprpBox ) {
		throw new Error( 'Missing required boxes (pitm, iloc, iprp) in HEIC' );
	}

	// Primary item ID.
	const primaryId = parsePitm( r, pitmBox );

	// Item locations.
	const locations = parseIloc( r, ilocBox );

	// Item properties: iprp contains ipco (properties) + ipma (associations).
	const iprpStart = iprpBox.offset + iprpBox.headerSize;
	const iprpEnd = iprpBox.offset + iprpBox.size;
	const iprpChildren = findBoxes( r, iprpStart, iprpEnd );
	const ipcoBox = iprpChildren.find( ( b ) => b.type === 'ipco' );
	const ipmaBox = iprpChildren.find( ( b ) => b.type === 'ipma' );

	if ( ! ipcoBox || ! ipmaBox ) {
		throw new Error( 'Missing ipco or ipma in HEIC properties' );
	}

	const allAssoc = parseIpma( r, ipmaBox );

	// Enumerate ipco children (properties are 1-indexed).
	const ipcoStart = ipcoBox.offset + ipcoBox.headerSize;
	const ipcoEnd = ipcoBox.offset + ipcoBox.size;
	const properties = findBoxes( r, ipcoStart, ipcoEnd );

	// Determine if the primary item is a grid or a direct HEVC image.
	let primaryItemType = 'hvc1';
	if ( iinfBox ) {
		const itemTypes = parseIinf( r, iinfBox );
		const t = itemTypes.get( primaryId );
		if ( t ) {
			primaryItemType = t;
		}
	}

	if ( primaryItemType === 'grid' ) {
		// --- Grid/tiled image (common iPhone format) ---
		return parseGridImage(
			r,
			buffer,
			primaryId,
			locations,
			allAssoc,
			properties,
			irefBox,
			idatOffset
		);
	}

	// --- Single HEVC image ---
	const primaryLoc = locations.get( primaryId );
	if ( ! primaryLoc || primaryLoc.extents.length === 0 ) {
		throw new Error( `No location data for primary item ${ primaryId }` );
	}

	const primaryPropIndices = allAssoc.get( primaryId );
	if ( ! primaryPropIndices || primaryPropIndices.length === 0 ) {
		throw new Error( 'No property associations for primary item' );
	}

	const { hvcCBox, ispeBox, irotBox } = findHvcProperties(
		primaryPropIndices,
		properties
	);

	const hvcCDataStart = hvcCBox.offset + hvcCBox.headerSize;
	const hvcCDataSize = hvcCBox.size - hvcCBox.headerSize;
	const description = new Uint8Array(
		buffer.slice( hvcCDataStart, hvcCDataStart + hvcCDataSize )
	);
	const codecString = buildCodecString( r, hvcCDataStart );
	const { width, height } = parseIspe( r, ispeBox );
	const rotation = irotBox ? parseIrot( r, irotBox ) : 0;

	return {
		codecString,
		description,
		tiles: [
			{
				data: readItemData( buffer, primaryLoc, idatOffset ),
				x: 0,
				y: 0,
			},
		],
		tileWidth: width,
		tileHeight: height,
		outputWidth: width,
		outputHeight: height,
		rotation,
	};
}

/**
 * Parse a grid/tiled HEIC image.
 *
 * @param r          Binary reader.
 * @param buffer     File ArrayBuffer.
 * @param gridItemId The grid item's ID.
 * @param locations  Parsed iloc data.
 * @param allAssoc   Parsed ipma data.
 * @param properties ipco property boxes.
 * @param irefBox    iref box (required for grid).
 * @param idatOffset Byte offset of idat box data (for construction_method 1).
 */
function parseGridImage(
	r: Reader,
	buffer: ArrayBuffer,
	gridItemId: number,
	locations: Map< number, ItemLocation >,
	allAssoc: Map< number, number[] >,
	properties: BoxInfo[],
	irefBox: BoxInfo | undefined,
	idatOffset: number
): HeicImageData {
	// Parse grid descriptor from the grid item's data.
	const gridLoc = locations.get( gridItemId );
	if ( ! gridLoc || gridLoc.extents.length === 0 ) {
		throw new Error( 'No location data for grid item' );
	}
	const gridData = readItemData( buffer, gridLoc, idatOffset );

	// Grid descriptor format:
	// version (1 byte), flags (1 byte),
	// rows_minus_one (1 byte), columns_minus_one (1 byte),
	// output_width (2 or 4 bytes), output_height (2 or 4 bytes)
	const largeFields = gridData.length > 1 && ( gridData[ 1 ] & 1 ) !== 0;
	const minGridSize = largeFields ? 12 : 8;
	if ( gridData.length < minGridSize ) {
		throw new Error(
			`Grid descriptor too short: ${ gridData.length } bytes`
		);
	}

	const rows = gridData[ 2 ] + 1;
	const columns = gridData[ 3 ] + 1;

	const gv = new DataView( gridData.buffer, gridData.byteOffset );
	let outputWidth: number;
	let outputHeight: number;
	if ( largeFields ) {
		outputWidth = gv.getUint32( 4 );
		outputHeight = gv.getUint32( 8 );
	} else {
		outputWidth = gv.getUint16( 4 );
		outputHeight = gv.getUint16( 6 );
	}

	// Find tile item IDs from iref 'dimg' references.
	if ( ! irefBox ) {
		throw new Error( 'Grid image requires iref box' );
	}
	const dimgRefs = parseIref( r, irefBox, 'dimg' );
	const tileItemIds = dimgRefs.get( gridItemId );
	if ( ! tileItemIds || tileItemIds.length === 0 ) {
		throw new Error( 'No tile references found for grid item' );
	}

	// The iref may include extra references (alpha planes, thumbnails).
	// Use at least rows * columns tiles; ignore any surplus.
	const expectedTiles = rows * columns;
	if ( tileItemIds.length < expectedTiles ) {
		throw new Error(
			`Grid expects ${ expectedTiles } tiles but found ${ tileItemIds.length }`
		);
	}

	// Get hvcC and ispe from the first tile item's properties.
	// All tiles in a grid share the same HEVC configuration.
	const firstTileProps = allAssoc.get( tileItemIds[ 0 ] );
	if ( ! firstTileProps || firstTileProps.length === 0 ) {
		throw new Error( 'No property associations for tile item' );
	}

	const { hvcCBox, ispeBox } = findHvcProperties(
		firstTileProps,
		properties
	);

	// irot is associated with the grid item, not the tiles.
	const gridProps = allAssoc.get( gridItemId ) || [];
	let irotBox: BoxInfo | undefined;
	for ( const idx of gridProps ) {
		if ( idx >= 1 && idx <= properties.length ) {
			const prop = properties[ idx - 1 ];
			if ( prop.type === 'irot' ) {
				irotBox = prop;
				break;
			}
		}
	}

	const hvcCDataStart = hvcCBox.offset + hvcCBox.headerSize;
	const hvcCDataSize = hvcCBox.size - hvcCBox.headerSize;
	const description = new Uint8Array(
		buffer.slice( hvcCDataStart, hvcCDataStart + hvcCDataSize )
	);
	const codecString = buildCodecString( r, hvcCDataStart );
	const { width: tileWidth, height: tileHeight } = parseIspe( r, ispeBox );

	// Extract tile data in raster scan order (left→right, top→bottom).
	const tiles: HeicTile[] = [];
	for ( let row = 0; row < rows; row++ ) {
		for ( let col = 0; col < columns; col++ ) {
			const tileIdx = row * columns + col;
			const tileId = tileItemIds[ tileIdx ];
			const tileLoc = locations.get( tileId );
			if ( ! tileLoc || tileLoc.extents.length === 0 ) {
				throw new Error( `No location data for tile item ${ tileId }` );
			}
			tiles.push( {
				data: readItemData( buffer, tileLoc, idatOffset ),
				x: col * tileWidth,
				y: row * tileHeight,
			} );
		}
	}

	const rotation = irotBox ? parseIrot( r, irotBox ) : 0;

	return {
		codecString,
		description,
		tiles,
		tileWidth,
		tileHeight,
		outputWidth,
		outputHeight,
		rotation,
	};
}

/* eslint-enable no-bitwise */
