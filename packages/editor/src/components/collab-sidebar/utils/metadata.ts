import type { NoteId } from './types';

export type NoteMetadata = Record< string, unknown > & { noteId?: unknown };

/**
 * Normalizes noteId metadata to always return an array of unique numeric ids,
 * preserving insertion order. Handles both scalar (legacy, possibly
 * string-typed) and array (new) values.
 *
 * @param metadata Block metadata object
 * @return Array of note IDs (may be empty)
 */
export function getNoteIdsFromMetadata(
	metadata: NoteMetadata | null | undefined
): number[] {
	const noteId = metadata?.noteId;
	const raw: unknown[] = Array.isArray( noteId ) ? noteId : [ noteId ];
	const ids = new Set< number >();
	for ( const value of raw ) {
		const id = Number( value );
		if ( Number.isFinite( id ) && id > 0 ) {
			ids.add( id );
		}
	}
	return [ ...ids ];
}

/**
 * Adds a note ID to the metadata.
 * Converts scalar to array if needed, otherwise appends.
 *
 * @param metadata Existing block metadata
 * @param noteId   Note ID to add
 * @return Updated metadata object
 */
export function addNoteIdToMetadata(
	metadata: NoteMetadata | null | undefined,
	noteId: NoteId
): NoteMetadata {
	const ids = new Set( getNoteIdsFromMetadata( metadata ) );
	const id = Number( noteId );
	if ( metadata && ids.has( id ) ) {
		return metadata;
	}
	ids.add( id );
	return { ...metadata, noteId: [ ...ids ] };
}

/**
 * Removes a note ID from the metadata.
 *
 * @param metadata Existing block metadata
 * @param noteId   Note ID to remove
 * @return Updated metadata object
 */
export function removeNoteIdFromMetadata(
	metadata: NoteMetadata | null | undefined,
	noteId: NoteId
): NoteMetadata {
	const ids = new Set( getNoteIdsFromMetadata( metadata ) );
	ids.delete( Number( noteId ) );
	return {
		...metadata,
		noteId: ids.size > 0 ? [ ...ids ] : undefined,
	};
}
