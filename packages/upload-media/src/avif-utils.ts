/* eslint-disable no-bitwise */
/**
 * Utilities for inspecting AVIF files without decoding them.
 *
 * The bundled `wasm-vips` builds libaom with `-DCONFIG_AV1_HIGHBITDEPTH=0`,
 * so it can neither decode nor encode AV1 bitstreams above 8-bit. We therefore
 * need to detect high-bit-depth AVIF (10/12-bit, typically HDR) up front so the
 * pipeline can route it away from vips.
 *
 * The bit depth is read directly from the ISO base media file format (ISOBMFF)
 * container boxes, so no image decoding is required:
 * - `pixi` (Pixel Information) — bits per channel, the most direct signal.
 * - `av1C` (AV1 Codec Configuration) — `high_bitdepth` / `twelve_bit` flags.
 *
 * See https://github.com/WordPress/gutenberg/issues/78889
 */

/**
 * Reads a 32-bit big-endian unsigned integer.
 *
 * @param view   Data view over the file bytes.
 * @param offset Byte offset to read from.
 * @return The unsigned 32-bit value.
 */
function readUint32( view: DataView, offset: number ): number {
	return view.getUint32( offset );
}

/**
 * Recursively walks ISOBMFF boxes looking for the highest bit depth declared
 * by a `pixi` or `av1C` box.
 *
 * Only known container boxes are descended into, so the walk stays cheap and
 * avoids misinterpreting media payloads as boxes.
 *
 * @param view  Data view over the file bytes.
 * @param start Start offset of the region to scan.
 * @param end   End offset (exclusive) of the region to scan.
 * @return The highest bit depth found, or 0 if none was determined.
 */
function findBitDepth( view: DataView, start: number, end: number ): number {
	// Boxes that contain child boxes relevant to locating `pixi` / `av1C`.
	const CONTAINERS = [ 'meta', 'iprp', 'ipco' ];

	let offset = start;
	let bitDepth = 0;

	while ( offset + 8 <= end ) {
		let size = readUint32( view, offset );
		const type = String.fromCharCode(
			view.getUint8( offset + 4 ),
			view.getUint8( offset + 5 ),
			view.getUint8( offset + 6 ),
			view.getUint8( offset + 7 )
		);

		let headerSize = 8;
		if ( size === 1 ) {
			// 64-bit size. We only care about boxes near the start of the
			// file, so reading the low 32 bits is sufficient in practice.
			size = readUint32( view, offset + 12 );
			headerSize = 16;
		} else if ( size === 0 ) {
			size = end - offset;
		}

		if ( size < headerSize || offset + size > end ) {
			break;
		}

		const payloadStart = offset + headerSize;

		if ( type === 'pixi' ) {
			// FullBox: 1-byte version + 3-byte flags, then num_channels,
			// then one byte of bits-per-channel per channel.
			const numChannels = view.getUint8( payloadStart + 4 );
			for ( let i = 0; i < numChannels; i++ ) {
				const depth = view.getUint8( payloadStart + 5 + i );
				bitDepth = Math.max( bitDepth, depth );
			}
		} else if ( type === 'av1C' ) {
			// byte 1: seq_profile (3 bits) + seq_level_idx (5 bits)
			// byte 2: seq_tier(1) high_bitdepth(1) twelve_bit(1) monochrome(1)
			//         chroma_subsampling_x(1) chroma_subsampling_y(1)
			//         chroma_sample_position(2)
			const seqProfile =
				( view.getUint8( payloadStart + 1 ) >> 5 ) & 0x07;
			const byte2 = view.getUint8( payloadStart + 2 );
			const highBitdepth = ( byte2 >> 6 ) & 0x01;
			const twelveBit = ( byte2 >> 5 ) & 0x01;
			let depth = 8;
			if ( highBitdepth ) {
				depth = seqProfile === 2 && twelveBit ? 12 : 10;
			}
			bitDepth = Math.max( bitDepth, depth );
		} else if ( CONTAINERS.includes( type ) ) {
			// `meta` is a FullBox: skip its 4-byte version/flags before
			// descending into its child boxes.
			const childStart =
				type === 'meta' ? payloadStart + 4 : payloadStart;
			bitDepth = Math.max(
				bitDepth,
				findBitDepth( view, childStart, offset + size )
			);
		}

		offset += size;
	}

	return bitDepth;
}

/**
 * Determines the bit depth of an AVIF file by parsing its container header.
 *
 * @param file The AVIF file.
 * @return The bit depth (e.g. 8, 10, 12), or 8 if it could not be determined.
 */
export async function getAvifBitDepth( file: File ): Promise< number > {
	try {
		// The relevant boxes live in the `meta` box near the start of the
		// file; reading a generous prefix avoids loading large files in full.
		const slice = file.slice( 0, Math.min( file.size, 256 * 1024 ) );
		const buffer = await slice.arrayBuffer();
		const view = new DataView( buffer );
		const depth = findBitDepth( view, 0, buffer.byteLength );
		return depth || 8;
	} catch {
		// If parsing fails for any reason, assume the common 8-bit case so we
		// never wrongly divert a file vips could have handled.
		return 8;
	}
}

/**
 * Checks whether a file is a high-bit-depth (> 8-bit) AVIF that the bundled
 * `wasm-vips` cannot decode or encode.
 *
 * @param file The file to check.
 * @return Whether the file is an AVIF with a bit depth greater than 8.
 */
export async function isHighBitDepthAvif( file: File ): Promise< boolean > {
	if ( file.type !== 'image/avif' ) {
		return false;
	}
	return ( await getAvifBitDepth( file ) ) > 8;
}
/* eslint-enable no-bitwise */
