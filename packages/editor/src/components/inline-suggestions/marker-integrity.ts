/**
 * Keeps synced content from re-attributing a suggestion marker.
 *
 * Real-time collaboration merges rich text as HTML strings. Two peers marking
 * overlapping text with the same kind (both deleting "cd") come out of the
 * merge as nested or crossing same-class `<mark>`s, which rich text parses
 * into two markers of one kind on a character: a legitimate stack, the same
 * state either peer could have written locally. The guard only puts it in
 * canonical order, dropping a marker repeated on a character, so every peer
 * computes the same bytes from the same merged state and a corrective write
 * converges instead of ping-ponging.
 *
 * A last-writer-wins attribute merge can also swap a marker's id outright:
 * a pending marker whose id a merge replaced gets its characters back. An id
 * that no note carries (a merge garbled it, `"201"` from `"20"` and `"21"`)
 * is dropped.
 */
import { toHTMLString } from '@wordpress/rich-text';
import {
	SUGGESTION_AUTHOR_ATTRIBUTE,
	canonicalizeSuggestionStack,
	compareSuggestionIds,
	isSuggestionFormat,
	suggestionMarkerId,
	suggestionMarkerListsAt,
} from './format';
import type { SuggestionMarkerKind } from './format';

const KINDS: SuggestionMarkerKind[] = [ 'add', 'format', 'del' ];

/** The parts of a rich-text record the guard reads. */
type MarkerRecord = { text: string; formats: any[] };

/** How the guard learns about the notes markers point at. */
type GuardOptions = {
	/** Whether a note id is still pending. */
	isPending: ( id: string ) => boolean;
	/**
	 * Whether a note id is known not to be a suggestion on this post. Answer
	 * false while unsure: a peer's marker can arrive before its note.
	 */
	isForeign?: ( id: string ) => boolean;
	/**
	 * The local user's id. When given, only the peer elected for a
	 * correction writes it (see `guardSyncedValue`).
	 */
	userId?: string;
};

/**
 * Whether an id is one a note can have: a comment id.
 *
 * @param id Marker id.
 * @return True for a positive integer.
 */
export function isWellFormedSuggestionId( id: string ): boolean {
	return /^[1-9]\d*$/.test( id );
}

/**
 * Remove the markers whose id fails `keep`.
 *
 * @param record Rich-text record.
 * @param keep   Whether a marker id stays.
 * @return The record; the same record when every marker stays.
 */
function dropSuggestionMarkers< T extends { formats: any[] } >(
	record: T,
	keep: ( id: string ) => boolean
): T {
	let formats: any[] | null = null;
	record.formats.forEach( ( stack, index ) => {
		if ( ! Array.isArray( stack ) ) {
			return;
		}
		const kept = stack.filter(
			( format ) =>
				! isSuggestionFormat( format ) ||
				keep( suggestionMarkerId( format ) )
		);
		if ( kept.length === stack.length ) {
			return;
		}
		formats ??= record.formats.slice();
		if ( kept.length ) {
			formats[ index ] = kept;
		} else {
			// A hole, as rich text leaves one.
			delete formats[ index ];
		}
	} );
	return formats ? { ...record, formats } : record;
}

/**
 * Remove the empty markers a merge leaves: one peer's decision deleted the
 * text another peer's marker wrapped, keeping the tags. Rich text reads an
 * empty element as an object in the text; it marks nothing, so it goes.
 *
 * @param record Rich-text record.
 * @return The record; the same record when it has none.
 */
function dropEmptySuggestionMarkers< T extends { formats: any[] } >(
	record: T
): T {
	const { replacements, text } = record as any;
	if (
		! Array.isArray( replacements ) ||
		! replacements.some( isSuggestionFormat )
	) {
		return record;
	}
	const keep = ( index: number ) =>
		! isSuggestionFormat( replacements[ index ] );
	const next: any = {
		...record,
		text: '',
		formats: [],
		replacements: [],
	};
	for ( let index = 0; index < text.length; index++ ) {
		if ( keep( index ) ) {
			const at = next.text.length;
			next.text += text[ index ];
			if ( index in record.formats ) {
				next.formats[ at ] = record.formats[ index ];
			}
			if ( index in replacements ) {
				next.replacements[ at ] = replacements[ index ];
			}
		}
	}
	next.formats.length = next.text.length;
	next.replacements.length = next.text.length;
	if ( 'start' in next ) {
		next.start = undefined;
		next.end = undefined;
	}
	return next;
}

/**
 * Every marker id in a record.
 *
 * @param record Rich-text record.
 * @return Ids.
 */
function suggestionIdsIn( record: MarkerRecord ): Set< string > {
	const ids = new Set< string >();
	for ( const stack of record.formats ) {
		if ( Array.isArray( stack ) ) {
			for ( const format of stack ) {
				if ( isSuggestionFormat( format ) ) {
					ids.add( suggestionMarkerId( format ) );
				}
			}
		}
	}
	return ids;
}

/**
 * Put every character's markers in canonical order, keeping one marker per
 * suggestion and kind.
 *
 * @param record Rich-text record.
 * @return The normalized record; the same record when nothing changed.
 */
export function normalizeSuggestionMarkers< T extends { formats: any[] } >(
	record: T
): T {
	return canonicalizeSuggestionStack( record );
}

/**
 * Whether two markers are equal but distinct objects, which rich text writes
 * as two elements.
 *
 * @param a Format.
 * @param b Format.
 * @return True for equal markers that are not one object.
 */
function isSplitMarker( a: any, b: any ): boolean {
	if ( a === b || ! isSuggestionFormat( a ) || a?.type !== b?.type ) {
		return false;
	}
	const keys = Object.keys( a.attributes ?? {} );
	return (
		keys.length === Object.keys( b.attributes ?? {} ).length &&
		keys.every( ( key ) => a.attributes[ key ] === b.attributes?.[ key ] )
	);
}

/**
 * Whether every character's markers are already in canonical order, with no
 * marker repeated, and no run of one marker written as two elements where it
 * could be one. Cheap enough to run on every synced value.
 *
 * @param formats Per-character format stacks.
 * @return True when nothing needs normalizing.
 */
export function isCanonicalSuggestionStack( formats: any[] ): boolean {
	return formats.every( ( stack, index ) => {
		if ( ! Array.isArray( stack ) ) {
			return true;
		}
		// Rich text continues an element only while every format outside it
		// is the same object as on the character before.
		const previous = formats[ index - 1 ];
		if ( Array.isArray( previous ) ) {
			let depth = 0;
			while (
				depth < stack.length &&
				stack[ depth ] === previous[ depth ]
			) {
				depth++;
			}
			if ( isSplitMarker( stack[ depth ], previous[ depth ] ) ) {
				return false;
			}
		}
		if ( stack.length < 2 ) {
			return true;
		}
		const markers = stack.filter( isSuggestionFormat );
		return (
			markers.length < 2 ||
			normalizeSuggestionMarkers( { formats: [ stack ] } )
				.formats[ 0 ] === stack
		);
	} );
}

/**
 * Guard a value arriving from a peer (or any writer other than the local
 * suggestion writers) against marker re-attribution.
 *
 * Characters outside the changed span map back to the previous value. Where
 * one of them lost a pending marker of some kind and gained a marker of that
 * kind the previous value did not have there, the incoming marker is the
 * swapped one and the pending marker is put back. Then the stacks are put in
 * canonical order as in `normalizeSuggestionMarkers`, without markers whose
 * id is malformed or foreign.
 *
 * @param prev              Record before the change.
 * @param next              Record after the change.
 * @param options           How to look notes up.
 * @param options.isPending Whether a note id is still pending.
 * @param options.isForeign Whether a note id is known not to be a suggestion on this post.
 * @return The guarded record; `next` itself when nothing needed fixing.
 */
export function guardMarkerIntegrity< T extends MarkerRecord >(
	prev: MarkerRecord,
	next: T,
	{ isPending, isForeign = () => false }: GuardOptions
): T {
	const prevLength = prev.text.length;
	const nextLength = next.text.length;
	let prefix = 0;
	while (
		prefix < prevLength &&
		prefix < nextLength &&
		prev.text[ prefix ] === next.text[ prefix ]
	) {
		prefix++;
	}
	let suffix = 0;
	while (
		suffix < prevLength - prefix &&
		suffix < nextLength - prefix &&
		prev.text[ prevLength - 1 - suffix ] ===
			next.text[ nextLength - 1 - suffix ]
	) {
		suffix++;
	}
	const prevIndexOf = ( index: number ) => {
		if ( index < prefix ) {
			return index;
		}
		if ( index >= nextLength - suffix ) {
			return index - nextLength + prevLength;
		}
		return -1;
	};

	let formats: any[] | null = null;
	for ( let index = 0; index < nextLength; index++ ) {
		const prevIndex = prevIndexOf( index );
		if ( prevIndex === -1 ) {
			continue;
		}
		const before = suggestionMarkerListsAt( prev.formats[ prevIndex ] );
		const stack = next.formats[ index ];
		const after = suggestionMarkerListsAt( stack );
		let restored = stack;
		for ( const kind of KINDS ) {
			const beforeIds = before[ kind ].map( suggestionMarkerId );
			const afterIds = after[ kind ].map( suggestionMarkerId );
			const lost = before[ kind ].filter(
				( marker ) =>
					! afterIds.includes( suggestionMarkerId( marker ) ) &&
					isPending( suggestionMarkerId( marker ) )
			);
			const gained = after[ kind ].filter(
				( marker ) =>
					! beforeIds.includes( suggestionMarkerId( marker ) )
			);
			// Pair them oldest first: a merge swaps ids one for one.
			gained.slice( 0, lost.length ).forEach( ( swapped, i ) => {
				restored = restored.map( ( format: any ) =>
					format === swapped ? lost[ i ] : format
				);
			} );
		}
		if ( restored !== stack ) {
			formats ??= next.formats.slice();
			formats[ index ] = restored;
		}
	}
	return normalizeSuggestionMarkers(
		dropSuggestionMarkers(
			dropEmptySuggestionMarkers( formats ? { ...next, formats } : next ),
			( id ) => isWellFormedSuggestionId( id ) && ! isForeign( id )
		)
	);
}

/**
 * The author of the newest marker a correction touches: the one peer that
 * writes it. Peers that each wrote the same correction would not converge: a
 * text CRDT keeps both copies of concurrent identical insertions, so markup
 * the correction moves would be duplicated once per peer.
 *
 * @param value   Value before the correction.
 * @param guarded Value after it.
 * @return The elected author's id, or null when no touched marker has one.
 */
function correctionWriter( value: MarkerRecord, guarded: MarkerRecord ) {
	let writer: { id: string; author: string } | null = null;
	const consider = ( marker: any ) => {
		const id = suggestionMarkerId( marker );
		const author = String(
			marker.attributes?.[ SUGGESTION_AUTHOR_ATTRIBUTE ] ?? ''
		);
		if (
			isWellFormedSuggestionId( id ) &&
			isWellFormedSuggestionId( author ) &&
			( ! writer || compareSuggestionIds( id, writer.id ) > 0 )
		) {
			writer = { id, author };
		}
	};
	// Empty markers the correction removes shift the characters after them.
	const replacements: any[] = ( value as any ).replacements ?? [];
	let at = 0;
	for ( let index = 0; index < value.text.length; index++ ) {
		if ( isSuggestionFormat( replacements[ index ] ) ) {
			consider( replacements[ index ] );
			continue;
		}
		const markers = ( value.formats[ index ] ?? [] ).filter(
			isSuggestionFormat
		);
		const kept = ( guarded.formats[ at++ ] ?? [] ).filter(
			isSuggestionFormat
		);
		if (
			markers.length !== kept.length ||
			markers.some( ( marker: any, i: number ) => marker !== kept[ i ] )
		) {
			[ ...markers, ...kept ].forEach( consider );
		}
	}
	return ( writer as { author: string } | null )?.author ?? null;
}

/**
 * Whether `a` is `b` with characters deleted.
 *
 * @param a Shorter string.
 * @param b Longer string.
 * @return True when every character of `a` appears in `b`, in order.
 */
function isSubsequence( a: string, b: string ): boolean {
	let i = 0;
	for ( let j = 0; i < a.length && j < b.length; j++ ) {
		if ( a[ i ] === b[ j ] ) {
			i++;
		}
	}
	return i === a.length;
}

/**
 * The correction to write for a value that just reached the editor, or null
 * when it needs none. Every peer computes the same correction from the merged
 * value, and only one of them, the author of the newest marker it touches,
 * writes it. A correction that serializes to the same bytes is not written,
 * so peers never trade no-op writes.
 *
 * An id swap only counts when the text is unchanged, the mark of an
 * attribute merge: a local edit that changes text never swaps one pending
 * marker for another. Only ids new to the value are checked for being
 * foreign, so typing costs no note lookups.
 *
 * @param before            The value seen last in this slot, if any.
 * @param value             The value now in it.
 * @param options           How to look notes up.
 * @param options.isPending Whether a note id is still pending.
 * @param options.isForeign Whether a note id is known not to be a suggestion on this post.
 * @param options.userId    The local user's id, to elect the writer.
 * @return The corrected record, or null.
 */
export function guardSyncedValue< T extends MarkerRecord >(
	before: MarkerRecord | undefined,
	value: T,
	{ isPending, isForeign = () => false, userId }: GuardOptions
): T | null {
	const ids = suggestionIdsIn( value );
	const hasEmpty = ( ( value as any ).replacements ?? [] ).some(
		isSuggestionFormat
	);
	if ( ! ids.size && ! hasEmpty ) {
		return null;
	}
	const known = before ? suggestionIdsIn( before ) : ids;
	const isForeignId = ( id: string ) => ! known.has( id ) && isForeign( id );
	const swapCandidate = !! before && before.text === value.text;
	const suspect = [ ...ids ].some(
		( id ) => ! isWellFormedSuggestionId( id ) || isForeignId( id )
	);
	if (
		! swapCandidate &&
		! suspect &&
		! hasEmpty &&
		isCanonicalSuggestionStack( value.formats )
	) {
		return null;
	}
	const guarded = guardMarkerIntegrity(
		swapCandidate ? before! : value,
		value,
		{ isPending, isForeign: isForeignId }
	);
	if ( guarded === value ) {
		return null;
	}
	const written = toHTMLString( { value: value as any } );
	const corrected = toHTMLString( { value: guarded as any } );
	if ( corrected === written ) {
		return null;
	}
	/*
	 * Concurrent identical deletions merge to one, so a correction every peer
	 * computes alike and that only deletes markup is safe for all of them to
	 * write. A restored id depends on what each peer saw before, and markup
	 * moved or inserted would be duplicated: the elected peer alone writes
	 * those.
	 */
	const sharedByEveryPeer = () =>
		toHTMLString( {
			value: guardMarkerIntegrity( value, value, {
				isPending,
				isForeign: isForeignId,
			} ) as any,
		} ) === corrected;
	if (
		userId !== undefined &&
		! ( isSubsequence( corrected, written ) && sharedByEveryPeer() ) &&
		correctionWriter( value, guarded ) !== userId
	) {
		return null;
	}
	return guarded;
}
