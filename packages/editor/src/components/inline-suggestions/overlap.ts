/**
 * Which gestures may land on text that already carries a suggestion marker.
 *
 * Markers stack: each kind is its own rich-text format, and a character may
 * carry several markers of one kind, one per suggestion. So almost any
 * gesture by another author is expressible, as Google Docs allows it:
 *
 * - text typed inside someone's addition nests in it, and text typed inside
 *   someone's deletion sits between its two halves;
 * - a deletion inside or across someone's addition nests in it, and one over
 *   someone's deletion adds a second deletion of the same words;
 * - a deletion over someone's formatting change, and the reverse.
 *
 * Formatting is the exception still refused here: a formatting change on
 * someone's formatting change, or one crossing the edge of someone's
 * addition, would record as its original run text or formatting that is
 * itself only proposed. Refusals name the marker in the way so the message
 * can say whose suggestion it is.
 *
 * Gestures over the editing author's own add and del markers are handled
 * before this is asked (growing, revising or deleting across their own
 * markers); one that still reaches it is declined.
 */
import {
	SUGGESTION_AUTHOR_ATTRIBUTE,
	SUGGESTION_ID_ATTRIBUTE,
	suggestionKindOf,
	suggestionMarkerId,
	suggestionMarkerListsAt,
	suggestionMarkersIn,
} from './format';
import type { SuggestionMarkerKind } from './format';

export type OverlapGesture = 'insert' | 'delete' | 'format' | 'type-over';

export type OverlapReason =
	'format-on-format' | 'format-straddles-add' | 'own-marker';

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

/**
 * Classify a gesture against the markers it would land on.
 *
 * - `insert` is a collapsed caret at `start`; it is always allowed.
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

	/*
	 * Text entered at a caret nests in any addition around it and sits
	 * between the halves of any deletion around it.
	 */
	if ( gesture === 'insert' ) {
		return ALLOW;
	}

	const from = Math.max( 0, start );
	const to = Math.min( end, formats.length );

	if ( gesture === 'format' ) {
		/*
		 * Formatting inside someone's addition is a child of it only when the
		 * whole range sits in the same additions. Crossing an edge would
		 * record, as the original run to restore on reject, text that is
		 * itself only proposed.
		 */
		let enclosing: string | null = null;
		for ( let i = from; i < to; i++ ) {
			const markers = suggestionMarkerListsAt( formats[ i ] );
			if ( markers.format.length ) {
				const own = markers.format.find( ( marker ) =>
					isOwn( marker, authorToken )
				);
				return own
					? refuse( 'own-marker', own )
					: refuse( 'format-on-format', markers.format[ 0 ] );
			}
			const ownAddition = markers.add.find( ( marker ) =>
				isOwn( marker, authorToken )
			);
			if ( ownAddition ) {
				return refuse( 'own-marker', ownAddition );
			}
			const additions = markers.add.map( suggestionMarkerId ).join( ' ' );
			if ( i === from ) {
				enclosing = additions;
			} else if ( additions !== enclosing ) {
				const previous = suggestionMarkerListsAt(
					formats[ i - 1 ]
				).add;
				const has = ( list: any[], marker: any ) =>
					list.some(
						( other ) =>
							suggestionMarkerId( other ) ===
							suggestionMarkerId( marker )
					);
				const crossed =
					markers.add.find(
						( marker ) => ! has( previous, marker )
					) ??
					previous.find( ( marker ) => ! has( markers.add, marker ) );
				return refuse( 'format-straddles-add', crossed );
			}
		}
		return ALLOW;
	}

	/*
	 * Deleting or typing over someone's markers nests in their additions and
	 * adds a second deletion over theirs. Only the author's own markers are
	 * left to the own-marker paths.
	 */
	for ( let i = from; i < to; i++ ) {
		for ( const marker of suggestionMarkersIn( formats[ i ] ) ) {
			const kind = suggestionKindOf( marker );
			if (
				( kind === 'del' || kind === 'add' ) &&
				isOwn( marker, authorToken )
			) {
				return refuse( 'own-marker', marker );
			}
		}
	}
	return ALLOW;
}
