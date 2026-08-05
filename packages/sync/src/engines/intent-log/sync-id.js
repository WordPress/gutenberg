/**
 * Block identity (syncId) — two-regime minting.
 *
 * Genesis: deterministic, computed ONLY from an immutable saved revision.
 * Creation: random, minted at the moment a block is born.
 *
 * See SPEC.md. `test-vectors/sync-id.json` is the frozen cross-language
 * contract for the genesis function.
 */

/**
 * Internal dependencies
 */
import { base64UrlEncode, sha256Utf8 } from './sha256.js';

const GENESIS_ID_BYTES = 16;

function assertNonNegativeInt( value, label ) {
	if ( ! Number.isInteger( value ) || value < 0 ) {
		throw new TypeError( `${ label } must be a non-negative integer` );
	}
}

/**
 * Canonical input string for the genesis hash. This exact string, UTF-8
 * encoded, is what both the JS and PHP implementations must hash.
 *
 * @param {Object}   revision            Immutable revision descriptor.
 * @param {number}   revision.postId     Post ID.
 * @param {number}   revision.revisionId Revision ID the content was read from.
 * @param {number[]} path                Block path within the revision (child
 *                                       indices from the root).
 * @return {string} Canonical input.
 */
export function canonicalGenesisInput( revision, path ) {
	assertNonNegativeInt( revision?.postId, 'postId' );
	assertNonNegativeInt( revision?.revisionId, 'revisionId' );
	if ( ! Array.isArray( path ) ) {
		throw new TypeError( 'path must be an array of child indices' );
	}
	for ( const index of path ) {
		assertNonNegativeInt( index, 'path index' );
	}
	return `${ revision.postId }:${ revision.revisionId }:${ path.join(
		'.'
	) }`;
}

/**
 * Deterministic genesis syncId for a block that exists in a saved revision.
 *
 * Pure function of the revision descriptor and block path — it structurally
 * cannot observe live editor state. Any number of independent minters agree.
 *
 * @param {Object}   revision Immutable revision descriptor.
 * @param {number[]} path     Block path within the revision.
 * @return {string} 22-character base64url syncId.
 */
export function genesisSyncId( revision, path ) {
	const digest = sha256Utf8( canonicalGenesisInput( revision, path ) );
	return base64UrlEncode( digest.subarray( 0, GENESIS_ID_BYTES ) );
}

/**
 * Random syncId for a block born during a session (insert, paste-as-new,
 * split-second-half). Each creation event gets a unique identity; this is
 * what preserves both users' paragraphs when they concurrently insert at the
 * same position.
 *
 * @param {() => number} [random] Optional seeded RNG returning [0, 1), for
 *                                deterministic simulation. Defaults to
 *                                crypto randomness.
 * @return {string} Opaque syncId.
 */
export function mintSyncId( random ) {
	if ( ! random ) {
		// Browser and Node (>=19) global; secure contexts only, like the
		// rest of the collaboration stack.
		return globalThis.crypto.randomUUID();
	}
	let id = '';
	for ( let i = 0; i < 32; i++ ) {
		id += Math.floor( random() * 16 ).toString( 16 );
	}
	return id;
}
