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

/*
 * HEIC/HEIF image sequence (msf1 / Live Photo / burst) demuxing.
 */

/** A single temporal frame (HEVC access unit) of an image sequence. */
export interface HeicSequenceSample {
	/** Raw HEVC bitstream for this frame (length-prefixed NAL units). */
	data: Uint8Array;
	/** Whether this frame is a sync sample (IDR/keyframe). */
	isSync: boolean;
	/** Presentation timestamp in microseconds. */
	timestampUs: number;
	/** Frame duration in microseconds. */
	durationUs: number;
}

export interface HeicSequenceData {
	/** HEVC codec string for VideoDecoder (e.g. 'hvc1.1.6.L93.B0'). */
	codecString: string;
	/** Raw HEVCDecoderConfigurationRecord bytes for VideoDecoder description. */
	description: Uint8Array;
	/** Coded frame width in pixels. */
	codedWidth: number;
	/** Coded frame height in pixels. */
	codedHeight: number;
	/** Display rotation in degrees clockwise (0, 90, 180, 270). */
	rotation: number;
	/** Temporal frames in decode order. */
	samples: HeicSequenceSample[];
}

/**
 * Read a track handler type (e.g. 'pict', 'vide') from an hdlr box.
 *
 * @param r   Binary reader.
 * @param box BoxInfo for the hdlr box.
 */
function parseHdlrType( r: Reader, box: BoxInfo ): string {
	// FullBox (4) + pre_defined (4), then handler_type (4 chars).
	r.pos = box.offset + box.headerSize + 8;
	return r.str( 4 );
}

/**
 * Read the media timescale (ticks per second) from an mdhd box.
 *
 * @param r   Binary reader.
 * @param box BoxInfo for the mdhd box.
 */
function parseMdhdTimescale( r: Reader, box: BoxInfo ): number {
	r.pos = box.offset + box.headerSize;
	const version = r.u8();
	r.pos += 3; // flags
	if ( version === 1 ) {
		r.pos += 16; // creation_time (8) + modification_time (8)
	} else {
		r.pos += 8; // creation_time (4) + modification_time (4)
	}
	return r.u32();
}

/**
 * Derive display rotation (degrees clockwise) from a tkhd transformation
 * matrix. Only the common right-angle rotations are recognised.
 *
 * @param r   Binary reader.
 * @param box BoxInfo for the tkhd box.
 */
function parseTkhdRotation( r: Reader, box: BoxInfo ): number {
	r.pos = box.offset + box.headerSize;
	const version = r.u8();
	r.pos += 3; // flags
	if ( version === 1 ) {
		r.pos += 32; // creation(8)+modification(8)+track_id(4)+reserved(4)+duration(8)
	} else {
		r.pos += 20; // creation(4)+modification(4)+track_id(4)+reserved(4)+duration(4)
	}
	r.pos += 8; // reserved[2]
	r.pos += 8; // layer(2)+alternate_group(2)+volume(2)+reserved(2)
	// 3x3 matrix in 16.16 fixed point; a = [0], b = [1].
	const a = r.view.getInt32( r.pos ) / 65536;
	const b = r.view.getInt32( r.pos + 4 ) / 65536;
	let deg = Math.round( ( Math.atan2( b, a ) * 180 ) / Math.PI );
	deg = ( ( deg % 360 ) + 360 ) % 360;
	// Snap to the nearest right angle.
	return ( Math.round( deg / 90 ) * 90 ) % 360;
}

/**
 * Parse a Decoding/Composition Time-to-Sample box into per-sample deltas.
 *
 * @param r   Binary reader.
 * @param box BoxInfo for the stts box.
 */
function parseStts( r: Reader, box: BoxInfo ): number[] {
	r.pos = box.offset + box.headerSize + 4; // version + flags
	const entryCount = r.u32();
	const deltas: number[] = [];
	for ( let i = 0; i < entryCount; i++ ) {
		const count = r.u32();
		const delta = r.u32();
		for ( let j = 0; j < count; j++ ) {
			deltas.push( delta );
		}
	}
	return deltas;
}

/**
 * Parse a Sample Size box into per-sample byte sizes.
 *
 * @param r   Binary reader.
 * @param box BoxInfo for the stsz box.
 */
function parseStsz( r: Reader, box: BoxInfo ): number[] {
	r.pos = box.offset + box.headerSize + 4; // version + flags
	const sampleSize = r.u32();
	const sampleCount = r.u32();
	const sizes: number[] = [];
	if ( sampleSize !== 0 ) {
		for ( let i = 0; i < sampleCount; i++ ) {
			sizes.push( sampleSize );
		}
	} else {
		for ( let i = 0; i < sampleCount; i++ ) {
			sizes.push( r.u32() );
		}
	}
	return sizes;
}

/**
 * Parse a Chunk Offset box (stco = 32-bit, co64 = 64-bit) into file offsets.
 *
 * @param r     Binary reader.
 * @param box   BoxInfo for the stco/co64 box.
 * @param large Whether offsets are 64-bit (co64).
 */
function parseStco( r: Reader, box: BoxInfo, large: boolean ): number[] {
	r.pos = box.offset + box.headerSize + 4; // version + flags
	const entryCount = r.u32();
	const offsets: number[] = [];
	for ( let i = 0; i < entryCount; i++ ) {
		offsets.push( large ? r.u64() : r.u32() );
	}
	return offsets;
}

interface StscEntry {
	firstChunk: number;
	samplesPerChunk: number;
}

/**
 * Parse a Sample-to-Chunk box.
 *
 * @param r   Binary reader.
 * @param box BoxInfo for the stsc box.
 */
function parseStsc( r: Reader, box: BoxInfo ): StscEntry[] {
	r.pos = box.offset + box.headerSize + 4; // version + flags
	const entryCount = r.u32();
	const entries: StscEntry[] = [];
	for ( let i = 0; i < entryCount; i++ ) {
		const firstChunk = r.u32();
		const samplesPerChunk = r.u32();
		r.u32(); // sample_description_index
		entries.push( { firstChunk, samplesPerChunk } );
	}
	return entries;
}

/**
 * Parse a Sync Sample box into a set of 0-based sample indices.
 *
 * @param r   Binary reader.
 * @param box BoxInfo for the stss box.
 */
function parseStss( r: Reader, box: BoxInfo ): Set< number > {
	r.pos = box.offset + box.headerSize + 4; // version + flags
	const entryCount = r.u32();
	const sync = new Set< number >();
	for ( let i = 0; i < entryCount; i++ ) {
		sync.add( r.u32() - 1 ); // stored 1-based.
	}
	return sync;
}

/**
 * Map every sample to its absolute byte offset in the file by combining the
 * sample-to-chunk table, chunk offsets, and sample sizes.
 *
 * @param stsc         Parsed stsc entries.
 * @param chunkOffsets Parsed chunk offsets.
 * @param sizes        Per-sample byte sizes.
 */
function buildSampleOffsets(
	stsc: StscEntry[],
	chunkOffsets: number[],
	sizes: number[]
): number[] {
	const offsets: number[] = [];
	let sampleIndex = 0;

	for ( let chunk = 0; chunk < chunkOffsets.length; chunk++ ) {
		/*
		 * samples_per_chunk is taken from the last stsc run whose first_chunk
		 * (1-based) is <= this chunk.
		 */
		let samplesPerChunk = stsc.length ? stsc[ 0 ].samplesPerChunk : 0;
		for ( const entry of stsc ) {
			if ( entry.firstChunk <= chunk + 1 ) {
				samplesPerChunk = entry.samplesPerChunk;
			} else {
				break;
			}
		}

		let offset = chunkOffsets[ chunk ];
		for ( let i = 0; i < samplesPerChunk; i++ ) {
			if ( sampleIndex >= sizes.length ) {
				return offsets;
			}
			offsets.push( offset );
			offset += sizes[ sampleIndex ];
			sampleIndex++;
		}
	}

	return offsets;
}

/**
 * Find the primary visual track's sample table (stbl) and media timescale.
 *
 * Prefers a 'pict' handler (HEIF image sequence) and falls back to 'vide'.
 *
 * @param r       Binary reader.
 * @param moovBox BoxInfo for the moov box.
 */
function findSequenceStbl(
	r: Reader,
	moovBox: BoxInfo
): { stbl: BoxInfo; timescale: number; rotation: number } | undefined {
	const moovEnd = moovBox.offset + moovBox.size;
	const traks = findBoxes(
		r,
		moovBox.offset + moovBox.headerSize,
		moovEnd
	).filter( ( b ) => b.type === 'trak' );

	for ( const trak of traks ) {
		const trakEnd = trak.offset + trak.size;
		const mdia = findBox(
			r,
			trak.offset + trak.headerSize,
			trakEnd,
			'mdia'
		);
		if ( ! mdia ) {
			continue;
		}
		const mdiaEnd = mdia.offset + mdia.size;
		const hdlr = findBox(
			r,
			mdia.offset + mdia.headerSize,
			mdiaEnd,
			'hdlr'
		);
		const handler = hdlr ? parseHdlrType( r, hdlr ) : '';
		if ( handler !== 'pict' && handler !== 'vide' ) {
			continue;
		}

		const mdhd = findBox(
			r,
			mdia.offset + mdia.headerSize,
			mdiaEnd,
			'mdhd'
		);
		const timescale = mdhd ? parseMdhdTimescale( r, mdhd ) : 0;

		const tkhd = findBox(
			r,
			trak.offset + trak.headerSize,
			trakEnd,
			'tkhd'
		);
		const rotation = tkhd ? parseTkhdRotation( r, tkhd ) : 0;

		const minf = findBox(
			r,
			mdia.offset + mdia.headerSize,
			mdiaEnd,
			'minf'
		);
		if ( ! minf ) {
			continue;
		}
		const stbl = findBox(
			r,
			minf.offset + minf.headerSize,
			minf.offset + minf.size,
			'stbl'
		);
		if ( stbl ) {
			return { stbl, timescale, rotation };
		}
	}

	return undefined;
}

/**
 * Locate the hvcC configuration box and coded dimensions inside an HEVC
 * visual sample entry (hvc1/hev1) within the stsd box.
 *
 * @param r       Binary reader.
 * @param stsdBox BoxInfo for the stsd box.
 */
function findHvcCInStsd(
	r: Reader,
	stsdBox: BoxInfo
): { hvcCBox: BoxInfo; codedWidth: number; codedHeight: number } {
	// FullBox (4) + entry_count (4), then the first sample entry box.
	const entryBox = readBoxAt( r, stsdBox.offset + stsdBox.headerSize + 8 );
	if (
		! entryBox ||
		( entryBox.type !== 'hvc1' && entryBox.type !== 'hev1' )
	) {
		throw new Error( 'Image sequence is not HEVC-encoded' );
	}

	/*
	 * VisualSampleEntry: 78 bytes precede the child boxes; width/height live
	 * at byte offsets 24/26 of the entry payload.
	 */
	const payloadStart = entryBox.offset + 8;
	const codedWidth = r.view.getUint16( payloadStart + 24 );
	const codedHeight = r.view.getUint16( payloadStart + 26 );

	const hvcCBox = findBox(
		r,
		payloadStart + 78,
		entryBox.offset + entryBox.size,
		'hvcC'
	);
	if ( ! hvcCBox ) {
		throw new Error( 'No HEVC configuration (hvcC) in image sequence' );
	}

	return { hvcCBox, codedWidth, codedHeight };
}

/**
 * Read a single box at an absolute offset.
 *
 * @param r      Binary reader.
 * @param offset Absolute byte offset of the box.
 */
function readBoxAt( r: Reader, offset: number ): BoxInfo | null {
	r.pos = offset;
	return readBox( r );
}

/**
 * Parse a HEIC/HEIF image sequence (msf1 brand — Apple Live Photo HEVC
 * sequences, Android bursts) and extract the temporal HEVC frames.
 *
 * Unlike still HEIC files (which store a single image in the `meta` box), an
 * image sequence stores its frames as samples of a video-like track in the
 * `moov`/`mdat` boxes. This demuxes that track into individual HEVC access
 * units that can be decoded with the WebCodecs VideoDecoder and re-encoded to
 * a web-safe video.
 *
 * @param buffer Raw HEIC/HEIF sequence file contents.
 * @return Parsed sequence data including codec config and per-frame samples.
 * @throws If the file is not a valid HEVC image sequence.
 */
export function parseHeicSequence( buffer: ArrayBuffer ): HeicSequenceData {
	const r = new Reader( buffer );
	const fileEnd = buffer.byteLength;

	const moovBox = findBox( r, 0, fileEnd, 'moov' );
	if ( ! moovBox ) {
		throw new Error( 'No moov box found in image sequence' );
	}

	const track = findSequenceStbl( r, moovBox );
	if ( ! track ) {
		throw new Error( 'No image/video track found in sequence' );
	}
	const { stbl, timescale, rotation } = track;
	if ( ! timescale ) {
		throw new Error( 'Missing media timescale in image sequence' );
	}

	const stblStart = stbl.offset + stbl.headerSize;
	const stblEnd = stbl.offset + stbl.size;

	const stsdBox = findBox( r, stblStart, stblEnd, 'stsd' );
	const stszBox = findBox( r, stblStart, stblEnd, 'stsz' );
	const stscBox = findBox( r, stblStart, stblEnd, 'stsc' );
	const sttsBox = findBox( r, stblStart, stblEnd, 'stts' );
	let stcoBox = findBox( r, stblStart, stblEnd, 'stco' );
	let co64 = false;
	if ( ! stcoBox ) {
		stcoBox = findBox( r, stblStart, stblEnd, 'co64' );
		co64 = true;
	}
	const stssBox = findBox( r, stblStart, stblEnd, 'stss' );

	if ( ! stsdBox || ! stszBox || ! stscBox || ! sttsBox || ! stcoBox ) {
		throw new Error( 'Image sequence is missing required sample tables' );
	}

	const { hvcCBox, codedWidth, codedHeight } = findHvcCInStsd( r, stsdBox );
	const hvcCDataStart = hvcCBox.offset + hvcCBox.headerSize;
	const hvcCDataSize = hvcCBox.size - hvcCBox.headerSize;
	const description = new Uint8Array(
		buffer.slice( hvcCDataStart, hvcCDataStart + hvcCDataSize )
	);
	const codecString = buildCodecString( r, hvcCDataStart );

	const sizes = parseStsz( r, stszBox );
	const deltas = parseStts( r, sttsBox );
	const stsc = parseStsc( r, stscBox );
	const chunkOffsets = parseStco( r, stcoBox, co64 );
	const syncSet = stssBox ? parseStss( r, stssBox ) : undefined;
	const sampleOffsets = buildSampleOffsets( stsc, chunkOffsets, sizes );

	const sampleCount = Math.min( sizes.length, sampleOffsets.length );
	if ( sampleCount === 0 ) {
		throw new Error( 'Image sequence contains no frames' );
	}

	const samples: HeicSequenceSample[] = [];
	let timestampTicks = 0;
	for ( let i = 0; i < sampleCount; i++ ) {
		const start = sampleOffsets[ i ];
		const size = sizes[ i ];
		const deltaTicks = deltas[ i ] ?? deltas[ deltas.length - 1 ] ?? 0;
		samples.push( {
			data: new Uint8Array( buffer.slice( start, start + size ) ),
			// With no stss every sample is a sync sample (all-intra sequence).
			isSync: syncSet ? syncSet.has( i ) : true,
			timestampUs: Math.round(
				( timestampTicks / timescale ) * 1_000_000
			),
			durationUs: Math.round( ( deltaTicks / timescale ) * 1_000_000 ),
		} );
		timestampTicks += deltaTicks;
	}

	return {
		codecString,
		description,
		codedWidth,
		codedHeight,
		rotation,
		samples,
	};
}

/* eslint-enable no-bitwise */
