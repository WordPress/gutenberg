/**
 * Keeps synced content from re-attributing a suggestion marker.
 *
 * Real-time collaboration merges rich text as HTML strings. Two peers marking
 * overlapping text with the same kind (both deleting "cd") come out of the
 * merge as nested or crossing same-class `<mark>`s, which rich text parses
 * into two formats of one type on a character; the next write of that type
 * flattens them and one author's marker silently takes the other's text. A
 * last-writer-wins attribute merge can also swap a marker's id outright.
 *
 * The guard resolves both with one deterministic rule, so every peer computes
 * the same result from the same merged state and a corrective write converges
 * instead of ping-ponging: where two markers of one kind share a character,
 * the older (lower) note id keeps it; a pending marker whose id a merge
 * replaced gets its characters back. Markers of different kinds may share
 * characters and are only put in canonical order.
 */
import {
	SUGGESTION_ID_ATTRIBUTE,
	canonicalizeSuggestionStack,
	isSuggestionFormat,
	suggestionKindOf,
	suggestionMarkersAt,
} from './format';
import type { SuggestionMarkerKind } from './format';

const KINDS: SuggestionMarkerKind[] = [ 'add', 'format', 'del' ];

/** The parts of a rich-text record the guard reads. */
type MarkerRecord = { text: string; formats: any[] };

const idOf = ( marker: any ) =>
	String( marker?.attributes?.[ SUGGESTION_ID_ATTRIBUTE ] ?? '' );

/**
 * Order two note ids, oldest first. Comment ids grow monotonically per site;
 * a non-numeric id sorts after numeric ones, by string.
 *
 * @param a First id.
 * @param b Second id.
 * @return Negative when `a` is older.
 */
function compareIds( a: string, b: string ): number {
	const numberA = Number( a );
	const numberB = Number( b );
	const isNumberA = a !== '' && Number.isFinite( numberA );
	const isNumberB = b !== '' && Number.isFinite( numberB );
	if ( isNumberA && isNumberB ) {
		return numberA - numberB;
	}
	if ( isNumberA !== isNumberB ) {
		return isNumberA ? -1 : 1;
	}
	return a < b ? -1 : Number( a > b );
}

/**
 * Leave at most one marker of each kind on every character, the oldest, and
 * put the stack in canonical order.
 *
 * @param record Rich-text record.
 * @return The normalized record; the same record when nothing changed.
 */
export function normalizeSuggestionMarkers< T extends { formats: any[] } >(
	record: T
): T {
	let formats: any[] | null = null;
	for ( let index = 0; index < record.formats.length; index++ ) {
		const stack = record.formats[ index ];
		if ( ! Array.isArray( stack ) ) {
			continue;
		}
		const keep = new Map< SuggestionMarkerKind, any >();
		let duplicated = false;
		for ( const format of stack ) {
			const kind = suggestionKindOf( format );
			if ( ! kind ) {
				continue;
			}
			const kept = keep.get( kind );
			if ( kept ) {
				duplicated = true;
				if ( compareIds( idOf( format ), idOf( kept ) ) < 0 ) {
					keep.set( kind, format );
				}
			} else {
				keep.set( kind, format );
			}
		}
		if ( ! duplicated ) {
			continue;
		}
		formats ??= record.formats.slice();
		formats[ index ] = stack.filter(
			( format ) =>
				! isSuggestionFormat( format ) ||
				keep.get( suggestionKindOf( format )! ) === format
		);
	}
	return canonicalizeSuggestionStack(
		formats ? { ...record, formats } : record
	);
}

/**
 * Guard a value arriving from a peer (or any writer other than the local
 * suggestion writers) against marker re-attribution.
 *
 * Characters outside the changed span map back to the previous value. Where
 * one of them carried a pending marker that the incoming value replaced with
 * a different marker of the same kind, the pending marker is put back. Then
 * same-kind overlap is resolved as in `normalizeSuggestionMarkers`.
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
		const before = suggestionMarkersAt( prev.formats[ prevIndex ] );
		const stack = next.formats[ index ];
		const after = suggestionMarkersAt( stack );
		let restored = stack;
		for ( const kind of KINDS ) {
			const was = before[ kind ];
			const is = after[ kind ];
			if ( ! was || ! is || idOf( was ) === idOf( is ) ) {
				continue;
			}
			if ( ! isPending( idOf( was ) ) ) {
				continue;
			}
			restored = restored.map( ( format: any ) =>
				format === is ? was : format
			);
		}
		if ( restored !== stack ) {
			formats ??= next.formats.slice();
			formats[ index ] = restored;
		}
	}
	return normalizeSuggestionMarkers( formats ? { ...next, formats } : next );
}
