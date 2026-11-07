/**
 * Type declarations for unbrotli.js, a vendored Brotli decoder.
 */

/**
 * Decompresses a Brotli-compressed buffer.
 *
 * @param buffer      The compressed data.
 * @param output_size The decompressed size. Read from the stream when omitted.
 * @return The decompressed data.
 */
declare function BrotliDecompressBuffer(
	buffer: Uint8Array,
	output_size?: number
): Uint8Array;

export default BrotliDecompressBuffer;
