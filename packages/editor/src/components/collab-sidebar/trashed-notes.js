/**
 * Notes trashed during this editing session.
 *
 * Deleting a note trashes its comment and strips the note id from its block's
 * metadata as an ordinary undo level. Undo puts the metadata back, but it
 * can't untrash the comment: entity records aren't part of the block editor's
 * history. This registry is what lets `useNoteTrashSync` pair the two halves
 * back up, and take them apart again on redo.
 *
 * Comment ids are unique site-wide, so a module-level registry is safe to
 * share across editor instances.
 */

const entries = new Map();
const listeners = new Set();
let snapshot = [];

function emit() {
	snapshot = Array.from( entries.values() );
	for ( const listener of listeners ) {
		listener();
	}
}

/**
 * Subscribe to registry changes.
 *
 * @param {Function} listener Called whenever the registry changes.
 * @return {Function} Unsubscribe.
 */
export function subscribeTrashedNotes( listener ) {
	listeners.add( listener );
	return () => {
		listeners.delete( listener );
	};
}

/**
 * @return {Array} Tracked notes, as a snapshot stable between changes.
 */
export function getTrashedNotes() {
	return snapshot;
}

/**
 * Start tracking a note that was just trashed, so undo can bring it back.
 *
 * @param {number} noteId   Trashed note id.
 * @param {string} clientId Block the note was attached to.
 */
export function trackTrashedNote( noteId, clientId ) {
	entries.set( noteId, { noteId, clientId, isTrashed: true } );
	emit();
}

/**
 * Record which side of the trash a tracked note ended up on.
 *
 * @param {number}  noteId    Tracked note id.
 * @param {boolean} isTrashed Whether the note is now trashed.
 */
export function setTrashedNoteState( noteId, isTrashed ) {
	const entry = entries.get( noteId );
	if ( ! entry || entry.isTrashed === isTrashed ) {
		return;
	}
	entries.set( noteId, { ...entry, isTrashed } );
	emit();
}
