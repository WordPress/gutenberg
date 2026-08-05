/**
 * Minimal synchronous SHA-256 (FIPS 180-4), dependency-free.
 *
 * The genesis syncId function needs a SYNCHRONOUS hash that produces
 * identical bytes in browsers, jest, and Node tooling. Web Crypto's
 * `crypto.subtle.digest` is async (and unavailable in insecure contexts),
 * and `node:crypto` does not exist in browsers — so the engine carries its
 * own implementation. Correctness is pinned by the frozen cross-language
 * vectors in `test-vectors/sync-id.json`, which this implementation must
 * reproduce exactly (as must the PHP twin via PHP's hash()).
 */

/* eslint-disable no-bitwise -- Bitwise math is the algorithm. */

const K = [
	0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
	0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
	0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
	0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
	0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
	0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
	0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
	0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
	0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

const rotr = ( x, n ) => ( x >>> n ) | ( x << ( 32 - n ) );

/**
 * Computes the SHA-256 digest of a UTF-8 string.
 *
 * @param {string} input Input string (UTF-8 encoded before hashing).
 * @return {Uint8Array} 32-byte digest.
 */
export function sha256Utf8( input ) {
	const bytes = new TextEncoder().encode( input );

	// Padding: message + 0x80 + zeros + 64-bit big-endian bit length.
	const bitLength = bytes.length * 8;
	const paddedLength = ( ( ( bytes.length + 8 ) >> 6 ) + 1 ) << 6;
	const padded = new Uint8Array( paddedLength );
	padded.set( bytes );
	padded[ bytes.length ] = 0x80;
	const view = new DataView( padded.buffer );
	view.setUint32( paddedLength - 8, Math.floor( bitLength / 0x100000000 ) );
	view.setUint32( paddedLength - 4, bitLength >>> 0 );

	const state = [
		0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
		0x1f83d9ab, 0x5be0cd19,
	];
	const w = new Array( 64 );

	for ( let offset = 0; offset < paddedLength; offset += 64 ) {
		for ( let i = 0; i < 16; i++ ) {
			w[ i ] = view.getUint32( offset + i * 4 );
		}
		for ( let i = 16; i < 64; i++ ) {
			const s0 =
				rotr( w[ i - 15 ], 7 ) ^
				rotr( w[ i - 15 ], 18 ) ^
				( w[ i - 15 ] >>> 3 );
			const s1 =
				rotr( w[ i - 2 ], 17 ) ^
				rotr( w[ i - 2 ], 19 ) ^
				( w[ i - 2 ] >>> 10 );
			w[ i ] = ( w[ i - 16 ] + s0 + w[ i - 7 ] + s1 ) >>> 0;
		}

		let [ a, b, c, d, e, f, g, h ] = state;
		for ( let i = 0; i < 64; i++ ) {
			const s1 = rotr( e, 6 ) ^ rotr( e, 11 ) ^ rotr( e, 25 );
			const ch = ( e & f ) ^ ( ~e & g );
			const t1 = ( h + s1 + ch + K[ i ] + w[ i ] ) >>> 0;
			const s0 = rotr( a, 2 ) ^ rotr( a, 13 ) ^ rotr( a, 22 );
			const maj = ( a & b ) ^ ( a & c ) ^ ( b & c );
			const t2 = ( s0 + maj ) >>> 0;
			h = g;
			g = f;
			f = e;
			e = ( d + t1 ) >>> 0;
			d = c;
			c = b;
			b = a;
			a = ( t1 + t2 ) >>> 0;
		}

		state[ 0 ] = ( state[ 0 ] + a ) >>> 0;
		state[ 1 ] = ( state[ 1 ] + b ) >>> 0;
		state[ 2 ] = ( state[ 2 ] + c ) >>> 0;
		state[ 3 ] = ( state[ 3 ] + d ) >>> 0;
		state[ 4 ] = ( state[ 4 ] + e ) >>> 0;
		state[ 5 ] = ( state[ 5 ] + f ) >>> 0;
		state[ 6 ] = ( state[ 6 ] + g ) >>> 0;
		state[ 7 ] = ( state[ 7 ] + h ) >>> 0;
	}

	const digest = new Uint8Array( 32 );
	const digestView = new DataView( digest.buffer );
	for ( let i = 0; i < 8; i++ ) {
		digestView.setUint32( i * 4, state[ i ] );
	}

	return digest;
}

/* eslint-enable no-bitwise */

/**
 * Encodes bytes as unpadded base64url.
 *
 * @param {Uint8Array} bytes Bytes to encode.
 * @return {string} base64url string.
 */
export function base64UrlEncode( bytes ) {
	let binary = '';
	for ( const byte of bytes ) {
		binary += String.fromCharCode( byte );
	}
	return btoa( binary )
		.replace( /\+/g, '-' )
		.replace( /\//g, '_' )
		.replace( /=+$/, '' );
}
