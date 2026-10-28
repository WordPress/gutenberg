import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import Vips from 'wasm-vips';

/*
 * Integration test: checks that AVIF sub-sizes keep the source's color
 * signaling, using the real `wasm-vips` build like `highbitdepth-avif.ts`.
 *
 * These tests document known upstream bugs and are expected to fail until
 * a `wasm-vips` release built on libvips 8.19 is adopted:
 * - The `colr` (nclx/CICP) box is not written, so decoders fall back to
 *   sRGB/BT.709 and wide gamut and HDR images render desaturated.
 * - The `clli` (content light level) box is dropped from HDR images.
 *
 * See https://core.trac.wordpress.org/ticket/60889
 * and https://github.com/WordPress/gutenberg/issues/79559.
 */

/**
 * Returns a fixture URL relative to this ESM test module.
 *
 * @param file Fixture filename.
 *
 * @return Fixture URL.
 */
const getFixtureUrl = ( file: string ) =>
	new URL( `./fixtures/${ file }`, import.meta.url );

interface Box {
	type: string;
	/** Box payload, excluding the size and type header. */
	data: DataView;
}

/**
 * Splits an ISOBMFF byte range into its child boxes.
 *
 * @param view Bytes containing a sequence of boxes.
 *
 * @return Child boxes.
 */
function readBoxes( view: DataView ): Box[] {
	const boxes: Box[] = [];
	let pos = 0;

	while ( pos + 8 <= view.byteLength ) {
		let size = view.getUint32( pos );
		const type = String.fromCharCode(
			...new Uint8Array( view.buffer, view.byteOffset + pos + 4, 4 )
		);
		let headerSize = 8;

		if ( size === 1 ) {
			size = Number( view.getBigUint64( pos + 8 ) );
			headerSize = 16;
		} else if ( size === 0 ) {
			size = view.byteLength - pos;
		}

		boxes.push( {
			type,
			data: new DataView(
				view.buffer,
				view.byteOffset + pos + headerSize,
				size - headerSize
			),
		} );
		pos += size;
	}

	return boxes;
}

/**
 * Returns the item properties (`meta/iprp/ipco` children) of an AVIF file.
 *
 * @param buffer AVIF file contents.
 *
 * @return Item property boxes.
 */
function getItemProperties( buffer: Uint8Array ): Box[] {
	const find = ( boxes: Box[], type: string ) => {
		const box = boxes.find( ( b ) => b.type === type );
		if ( ! box ) {
			throw new Error( `Missing ${ type } box` );
		}
		return box.data;
	};

	const meta = find(
		readBoxes(
			new DataView( buffer.buffer, buffer.byteOffset, buffer.byteLength )
		),
		'meta'
	);
	// `meta` is a full box: skip its version and flags.
	const iprp = find(
		readBoxes(
			new DataView(
				meta.buffer,
				meta.byteOffset + 4,
				meta.byteLength - 4
			)
		),
		'iprp'
	);

	return readBoxes( find( readBoxes( iprp ), 'ipco' ) );
}

/**
 * Reads the CICP values from the nclx `colr` property.
 *
 * @param properties Item property boxes.
 *
 * @return CICP values, or undefined when there is no nclx `colr` box.
 */
function getCicp( properties: Box[] ) {
	const colr = properties.find(
		( { type, data } ) =>
			type === 'colr' &&
			String.fromCharCode(
				...new Uint8Array( data.buffer, data.byteOffset, 4 )
			) === 'nclx'
	)?.data;

	if ( ! colr ) {
		return undefined;
	}

	return {
		colorPrimaries: colr.getUint16( 4 ),
		transferCharacteristics: colr.getUint16( 6 ),
		matrixCoefficients: colr.getUint16( 8 ),
		// eslint-disable-next-line no-bitwise
		fullRange: Boolean( colr.getUint8( 10 ) >> 7 ),
	};
}

/**
 * Reads the `clli` content light level property.
 *
 * @param properties Item property boxes.
 *
 * @return Content light level, or undefined when there is no `clli` box.
 */
function getContentLightLevel( properties: Box[] ) {
	const clli = properties.find( ( { type } ) => type === 'clli' )?.data;

	if ( ! clli ) {
		return undefined;
	}

	return {
		maxContentLightLevel: clli.getUint16( 0 ),
		maxPictureAverageLightLevel: clli.getUint16( 2 ),
	};
}

/**
 * Reads the bits per channel from the first `pixi` property.
 *
 * @param properties Item property boxes.
 *
 * @return Bit depth of each channel.
 */
function getPixelInformation( properties: Box[] ) {
	const pixi = properties.find( ( { type } ) => type === 'pixi' )?.data;

	if ( ! pixi ) {
		return undefined;
	}

	// `pixi` is a full box: skip its version and flags.
	const channels = pixi.getUint8( 4 );
	return Array.from( { length: channels }, ( _, i ) =>
		pixi.getUint8( 5 + i )
	);
}

describe( 'AVIF sub-size color metadata', () => {
	let vips: Awaited< ReturnType< typeof Vips > >;

	beforeAll( async () => {
		vips = await Vips( { dynamicLibraries: [ 'vips-heif.wasm' ] } );
	} );

	afterAll( () => {
		vips?.shutdown?.();
	} );

	/**
	 * Resizes an AVIF fixture and re-encodes it the way `resizeImage` does
	 * for a 10-bit source.
	 *
	 * @param file Fixture filename.
	 *
	 * @return Source and sub-size item properties.
	 */
	function createSubSize( file: string ) {
		const buffer = readFileSync( getFixtureUrl( file ) );
		const resized = vips.Image.newFromBuffer( buffer ).resize( 0.5 );
		const out = resized.writeToBuffer( '.avif', {
			keep: 'icc|gainmap',
			Q: 82,
			effort: 2,
			bitdepth: 10,
		} );
		resized.delete();

		return {
			source: getItemProperties( buffer ),
			subSize: getItemProperties( out ),
		};
	}

	describe.each( [
		// Display P3 primaries, sRGB transfer, BT.601 matrix.
		[ 'Display P3 SDR', 'display-p3-10bit.avif', [ 12, 13, 6 ] ],
		// BT.2020 primaries, PQ transfer, BT.2020 matrix.
		[ 'BT.2100 PQ HDR', 'hdr-pq-10bit.avif', [ 9, 16, 9 ] ],
	] )( '%s', ( _label, file, [ primaries, transfer, matrix ] ) => {
		it( 'keeps the source CICP color signaling', () => {
			const { source, subSize } = createSubSize( file );
			const expected = {
				colorPrimaries: primaries,
				transferCharacteristics: transfer,
				matrixCoefficients: matrix,
				fullRange: true,
			};

			expect( getCicp( source ) ).toEqual( expected );
			expect( getCicp( subSize ) ).toEqual( expected );
		} );

		it( 'keeps three 10-bit channels in the pixel information', () => {
			const { subSize } = createSubSize( file );

			expect( getPixelInformation( subSize ) ).toEqual( [ 10, 10, 10 ] );
		} );
	} );

	it( 'keeps the HDR content light level', () => {
		const { source, subSize } = createSubSize( 'hdr-pq-10bit.avif' );

		expect( getContentLightLevel( source ) ).toEqual( {
			maxContentLightLevel: 1000,
			maxPictureAverageLightLevel: 400,
		} );
		expect( getContentLightLevel( subSize ) ).toEqual(
			getContentLightLevel( source )
		);
	} );
} );
