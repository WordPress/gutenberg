/**
 * External dependencies
 */
import * as Y from 'yjs';
import * as buffer from 'lib0/buffer';

/**
 * Internal dependencies
 */
import type { CRDTDoc } from './types';

/**
 * Encodes a document's state as a portable Yjs snapshot.
 *
 * A `Y.Snapshot` is a state vector plus a delete set. Together those fully
 * determine a Yjs document's content, so the result is a complete description
 * of what this document held at the time of the call, without any of the
 * content itself. It is used to record what an autosave captured so that
 * another session can later verify its own document contains at least as much.
 *
 * @param {CRDTDoc} ydoc CRDT document.
 * @return {string} Base64-encoded snapshot.
 */
export function encodeDocSnapshot( ydoc: CRDTDoc ): string {
	return buffer.toBase64( Y.encodeSnapshotV2( Y.snapshot( ydoc ) ) );
}

/**
 * Determines whether `ydoc` contains everything a snapshot describes.
 * Unlike a bare state vector, this proves deletions are present too.
 *
 * Garbage collection does not affect the result: GC replaces runs of deleted
 * items with `GC` structs that are still marked deleted, so they remain in the
 * delete set.
 *
 * @param {CRDTDoc} ydoc            CRDT document.
 * @param {string}  encodedSnapshot Base64-encoded snapshot from `encodeDocSnapshot`.
 * @return {boolean} Whether the document contains everything the snapshot describes.
 */
export function docContainsSnapshot(
	ydoc: CRDTDoc,
	encodedSnapshot: string
): boolean {
	let snapshot;

	try {
		snapshot = Y.decodeSnapshotV2( buffer.fromBase64( encodedSnapshot ) );
	} catch {
		return false;
	}

	const localSnapshot = Y.snapshot( ydoc );

	// Check for missing insertions
	for ( const [ client, clock ] of snapshot.sv ) {
		if ( ( localSnapshot.sv.get( client ) ?? 0 ) < clock ) {
			return false;
		}
	}

	// The merge below deliberately uses a fresh delete set instead of using
	// `localSnapshot`. `Y.mergeDeleteSets` mutates delete sets in place.
	// This edits the baseline (localSnapshot) to agree and mutates its deletion
	// contents. Instead, use a fresh snapshot to avoid affecting the original.
	const copiedDeleteSet = Y.snapshot( ydoc ).ds;

	// Check for missing deletions. Merging in a delete set that is already
	// contained changes nothing, so equality with the local delete set proves
	// containment.
	const mergedDeleteSet = Y.mergeDeleteSets( [
		copiedDeleteSet,
		snapshot.ds,
	] );

	return Y.equalDeleteSets( localSnapshot.ds, mergedDeleteSet );
}
