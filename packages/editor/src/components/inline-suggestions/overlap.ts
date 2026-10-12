/**
 * Which gestures may land on text that already carries a suggestion marker.
 *
 * Each marker kind is its own rich-text format, so markers of different kinds
 * can share characters without re-attributing each other. That makes most
 * cross-kind overlaps by another author expressible:
 *
 * - a deletion or formatting change inside someone's addition (a child that
 *   resolves on its own, and goes away if the addition is rejected);
 * - a deletion spanning someone's addition and plain text;
 * - a deletion over someone's formatting change, and the reverse.
 *
 * Same-kind overlap still cannot be expressed (rich text keeps one marker of a
 * kind per character), and neither can a formatting change that crosses the
 * edge of someone's addition: its original run would capture proposed text.
 * Those are refused, naming the marker in the way so the refusal can say whose
 * suggestion it is.
 *
 * Gestures over the editing author's own add and del markers are handled
 * before this is asked (growing, revising or deleting across their own
 * markers); one that still reaches it is declined.
 */
import {
	SUGGESTION_AUTHOR_ATTRIBUTE,
	SUGGESTION_ID_ATTRIBUTE,
	suggestionKindOf,
	suggestionMarkersAt,
	suggestionMarkersIn,
} from './format';
import type { SuggestionMarkerKind } from './format';

export type OverlapGesture = 'insert' | 'delete' | 'format' | 'type-over';

export type OverlapReason =
	| 'add-in-add'
	| 'insert-in-del'
	| 'del-over-del'
	| 'format-on-format'
	| 'format-straddles-add'
	| 'own-marker';

export interface OverlapBlocking {
	/** Note id the blocking marker carries. */
	id: string;
	/** Kind of the blocking marker. */
	kind: SuggestionMarkerKind;
	/** Author id the blocking marker carries, or null when unauthored. */
	authorId: string | null;
}

export interface OverlapVerdict {
	verdict: 'allow' | 'refuse';
	reason?: OverlapReason;
	blocking?: OverlapBlocking;
}

const ALLOW: OverlapVerdict = { verdict: 'allow' };

function describeMarker( marker: any ): OverlapBlocking {
	const author = marker.attributes?.[ SUGGESTION_AUTHOR_ATTRIBUTE ];
	return {
		id: String( marker.attributes?.[ SUGGESTION_ID_ATTRIBUTE ] ),
		kind: suggestionKindOf( marker )!,
		authorId:
			author === undefined || author === null || author === ''
				? null
				: String( author ),
	};
}

function refuse( reason: OverlapReason, marker: any ): OverlapVerdict {
	return { verdict: 'refuse', reason, blocking: describeMarker( marker ) };
}

function isOwn( marker: any, authorToken: string | null ) {
	return (
		String( marker.attributes?.[ SUGGESTION_AUTHOR_ATTRIBUTE ] ?? '' ) ===
		( authorToken ?? '' )
	);
}

function idOf( marker: any ) {
	return String( marker?.attributes?.[ SUGGESTION_ID_ATTRIBUTE ] );
}

/**
 * Classify a gesture against the markers it would land on.
 *
 * - `insert` is a collapsed caret at `start`; it is inside a marker when the
 *   characters on both sides carry it.
 * - `delete`, `format` and `type-over` act on `[start, end)`.
 *
 * @param formats             Per-character format stacks.
 * @param options             Options.
 * @param options.gesture     What the user did.
 * @param options.start       Range start, or the caret.
 * @param options.end         Range end (exclusive).
 * @param options.authorToken Id of the author making the edit, as a string;
 *                            null matches only unauthored markers.
 * @return The verdict, with the blocking marker when refused.
 */
export function classifyOverlap(
	formats: any[] | undefined | null,
	{
		gesture,
		start,
		end,
		authorToken,
	}: {
		gesture: OverlapGesture;
		start: number;
		end: number;
		authorToken: string | null;
	}
): OverlapVerdict {
	if ( ! Array.isArray( formats ) ) {
		return ALLOW;
	}

	if ( gesture === 'insert' ) {
		if ( start <= 0 || start >= formats.length ) {
			return ALLOW;
		}
		const left = suggestionMarkersAt( formats[ start - 1 ] );
		const right = suggestionMarkersAt( formats[ start ] );
		const inside = ( kind: SuggestionMarkerKind ) =>
			left[ kind ] &&
			right[ kind ] &&
			idOf( left[ kind ] ) === idOf( right[ kind ] )
				? left[ kind ]
				: null;
		const addition = inside( 'add' );
		if ( addition && ! isOwn( addition, authorToken ) ) {
			return refuse( 'add-in-add', addition );
		}
		const deletion = inside( 'del' );
		if ( deletion && ! isOwn( deletion, authorToken ) ) {
			return refuse( 'insert-in-del', deletion );
		}
		return ALLOW;
	}

	const from = Math.max( 0, start );
	const to = Math.min( end, formats.length );

	if ( gesture === 'format' ) {
		/*
		 * Formatting inside someone's addition is a child of it only when the
		 * whole range sits in that one addition. Crossing its edge would
		 * record, as the original run to restore on reject, text that is
		 * itself only proposed.
		 */
		let enclosing: any = null;
		for ( let i = from; i < to; i++ ) {
			const markers = suggestionMarkersAt( formats[ i ] );
			if ( markers.format ) {
				return refuse(
					isOwn( markers.format, authorToken )
						? 'own-marker'
						: 'format-on-format',
					markers.format
				);
			}
			if ( markers.add && isOwn( markers.add, authorToken ) ) {
				return refuse( 'own-marker', markers.add );
			}
			const addition = markers.add ?? null;
			if ( i === from ) {
				enclosing = addition;
			} else if (
				( addition ? idOf( addition ) : null ) !==
				( enclosing ? idOf( enclosing ) : null )
			) {
				return refuse( 'format-straddles-add', addition ?? enclosing );
			}
		}
		return ALLOW;
	}

	for ( let i = from; i < to; i++ ) {
		for ( const marker of suggestionMarkersIn( formats[ i ] ) ) {
			const kind = suggestionKindOf( marker );
			const own = isOwn( marker, authorToken );
			if ( kind === 'del' ) {
				return refuse( own ? 'own-marker' : 'del-over-del', marker );
			}
			if ( kind === 'add' ) {
				if ( own ) {
					return refuse( 'own-marker', marker );
				}
				if ( gesture === 'type-over' ) {
					return refuse( 'add-in-add', marker );
				}
			}
		}
	}
	return ALLOW;
}
