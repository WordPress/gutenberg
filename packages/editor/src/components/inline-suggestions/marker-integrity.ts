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
 * a pending marker whose id a merge replaced gets its characters back.
 */
import {
	canonicalizeSuggestionStack,
	isSuggestionFormat,
	suggestionMarkerId,
	suggestionMarkerListsAt,
} from './format';
import type { SuggestionMarkerKind } from './format';

const KINDS: SuggestionMarkerKind[] = [ 'add', 'format', 'del' ];

/** The parts of a rich-text record the guard reads. */
type MarkerRecord = { text: string; formats: any[] };

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
 * Whether every character's markers are already in canonical order, with no
 * marker repeated. Cheap enough to run on every synced value.
 *
 * @param formats Per-character format stacks.
 * @return True when nothing needs normalizing.
 */
export function isCanonicalSuggestionStack( formats: any[] ): boolean {
	return formats.every( ( stack ) => {
		if ( ! Array.isArray( stack ) || stack.length < 2 ) {
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
 * canonical order as in `normalizeSuggestionMarkers`.
 *
 * @param prev              Record before the change.
 * @param next              Record after the change.
 * @param options           Options.
 * @param options.isPending Whether a note id is still pending.
 * @return The guarded record; `next` itself when nothing needed fixing.
 */
export function guardMarkerIntegrity< T extends MarkerRecord >(
	prev: MarkerRecord,
	next: T,
	{ isPending }: { isPending: ( id: string ) => boolean }
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
	return normalizeSuggestionMarkers( formats ? { ...next, formats } : next );
}
