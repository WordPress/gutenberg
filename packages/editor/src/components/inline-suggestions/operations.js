import {
	RichTextData,
	create,
	insert,
	remove,
	removeFormat,
	applyFormat,
} from '@wordpress/rich-text';
import {
	SUGGESTION_CLASS,
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_ID_ATTRIBUTE,
	SUGGESTION_TYPE_ATTRIBUTE,
	SUGGESTION_AUTHOR_ATTRIBUTE,
	SUGGESTION_TYPE_ADDITION,
	findSuggestionRange,
} from './format';

/**
 * Build the attribute map for a `core/suggestion` marker. Pins the marker
 * contract in one place: the id links to the persisted suggestion (its comment
 * id), the type is `del` or `add`, and the author tags the marker so per-author
 * attribution survives reload and reviewer view. The author attribute is
 * omitted when no author id is known.
 *
 * @param {Object}               options
 * @param {number|string}        options.id         Suggestion (comment) id.
 * @param {'del'|'add'|'format'} options.type       Marker kind.
 * @param {number|string}        [options.authorId] Author user id.
 * @return {Object} Marker attributes for `wrapInlineMarker`.
 */
export function buildSuggestionMarkerAttributes( { id, type, authorId } ) {
	return {
		[ SUGGESTION_ID_ATTRIBUTE ]: String( id ),
		[ SUGGESTION_TYPE_ATTRIBUTE ]: type,
		...( authorId !== undefined && authorId !== null
			? { [ SUGGESTION_AUTHOR_ATTRIBUTE ]: String( authorId ) }
			: {} ),
	};
}

/**
 * Whether any character in `[start, end)` of a per-character format-stack array
 * already carries a `core/suggestion` marker.
 *
 * Interception paths use this to leave edits that touch an existing suggestion
 * to the default path: `applyFormat` over a non-collapsed range REMOVES other
 * formats of the same type inside it, so wrapping a range that overlaps another
 * suggestion's marker would silently re-attribute part of that marker to the
 * new id — and the damaged marker's accept/reject would then act on a partial
 * range.
 *
 * @param {Array}  formats Per-character format stacks (from `create()`).
 * @param {number} start   Range start (inclusive).
 * @param {number} end     Range end (exclusive).
 * @return {boolean} True when a suggestion format covers any character in range.
 */
export function formatsRangeHasSuggestion( formats, start, end ) {
	if ( ! Array.isArray( formats ) ) {
		return false;
	}
	const from = Math.max( 0, start );
	const to = Math.min( end, formats.length );
	for ( let i = from; i < to; i++ ) {
		const stack = formats[ i ];
		if (
			Array.isArray( stack ) &&
			stack.some( ( f ) => f.type === SUGGESTION_FORMAT_NAME )
		) {
			return true;
		}
	}
	return false;
}

/**
 * The `core/suggestion` format covering a character in a per-character format
 * stack array, or undefined.
 *
 * @param {Array}  formats Per-character format stacks (from `create()`).
 * @param {number} index   Character index.
 * @return {Object|undefined} The suggestion format at that character.
 */
function suggestionFormatAt( formats, index ) {
	const stack = formats[ index ];
	return Array.isArray( stack )
		? stack.find( ( f ) => f.type === SUGGESTION_FORMAT_NAME )
		: undefined;
}

/**
 * The pending `add` marker that text entered at `offset` should extend, rather
 * than opening a second suggestion nested inside the first.
 *
 * A caret sitting inside — or at the trailing edge of — the suggester's own
 * pending addition is a caret inside text that is already proposed. More typed
 * there is more of the same proposal, so it belongs to the same marker and the
 * same note. Inserting a *new* marker at that offset instead splits the
 * enclosing one into two disjoint `<mark>` elements sharing one id, leaves two
 * notes claiming the same characters, and makes accept/reject incoherent —
 * accepting the inner note while rejecting the outer keeps the new text and
 * drops the text it was typed into (#73411, finding F-06).
 *
 * The marker to the LEFT of the caret is the one that grows, which covers both
 * a caret strictly inside the run and one at its trailing edge. A caret at the
 * marker's *leading* edge is deliberately not matched: the character before it
 * is unmarked, so the new text is as plausibly a fresh addition, and starting a
 * separate marker there fragments nothing.
 *
 * Conservative elsewhere too. The marker has to be an `add` marker (typing
 * inside someone's proposed deletion is a different, unsettled gesture),
 * authored by the person making this edit, and unfragmented — a marker whose id
 * also appears elsewhere in the value cannot be re-stamped as one range. An
 * editor whose own id is unknown counts as unauthored, matching only a marker
 * that carries no author either.
 *
 * @param {Array}   formats       Per-character format stacks (from `create()`).
 * @param {number}  offset        Caret offset.
 * @param {?string} [authorToken] Id of the author making the edit, as a
 *                                string; `null`/omitted matches only a marker
 *                                with no author.
 * @return {?{id: string, start: number, end: number}} The marker's range, or null.
 */
export function formatsAdditionRunToExtend( formats, offset, authorToken ) {
	if (
		! Array.isArray( formats ) ||
		offset <= 0 ||
		offset > formats.length
	) {
		return null;
	}
	const attributes = suggestionFormatAt( formats, offset - 1 )?.attributes;
	if (
		attributes?.[ SUGGESTION_TYPE_ATTRIBUTE ] !== SUGGESTION_TYPE_ADDITION
	) {
		return null;
	}
	const rawId = attributes[ SUGGESTION_ID_ATTRIBUTE ];
	if ( rawId === undefined || rawId === null || rawId === '' ) {
		return null;
	}
	/*
	 * Extending re-attributes nothing: the marker and its note stay the
	 * original author's, so only that author may grow it. An unknown editor
	 * therefore matches an unauthored marker only — growing someone else's
	 * would re-stamp their span with no `data-author` and fold this text into
	 * their note.
	 */
	if (
		String( attributes[ SUGGESTION_AUTHOR_ATTRIBUTE ] ?? '' ) !==
		( authorToken ?? '' )
	) {
		return null;
	}
	const id = String( rawId );
	const idAt = ( index ) => {
		const value = suggestionFormatAt( formats, index )?.attributes?.[
			SUGGESTION_ID_ATTRIBUTE
		];
		return value === undefined || value === null ? null : String( value );
	};
	let start = offset - 1;
	while ( start > 0 && idAt( start - 1 ) === id ) {
		start--;
	}
	let end = offset;
	while ( end < formats.length && idAt( end ) === id ) {
		end++;
	}
	// A marker already split into fragments (an earlier nested insert, a
	// copy/paste) has no single range to grow.
	for ( let i = 0; i < formats.length; i++ ) {
		if ( ( i < start || i >= end ) && idAt( i ) === id ) {
			return null;
		}
	}
	return { id, start, end };
}

/**
 * Whether any character in `[start, end)` of a block attribute value already
 * carries a `core/suggestion` marker. Value-level convenience wrapper around
 * `formatsRangeHasSuggestion` tolerating plain strings and non-rich values.
 *
 * @param {*}      value Block attribute value (RichTextData, string, or other).
 * @param {number} start Range start (inclusive).
 * @param {number} end   Range end (exclusive).
 * @return {boolean} True when a suggestion format covers any character in range.
 */
export function valueRangeHasSuggestion( value, start, end ) {
	let html = null;
	if ( value && typeof value.toHTMLString === 'function' ) {
		html = value.toHTMLString();
	} else if ( typeof value === 'string' ) {
		html = value;
	}
	if ( html === null || false === html.includes( SUGGESTION_CLASS ) ) {
		// Quick reject: no marker markup, nothing to overlap.
		return false;
	}
	const record = create( { html } );
	return formatsRangeHasSuggestion( record.formats, start, end );
}

/**
 * The pending `add` marker in a block attribute value that text entered at
 * `offset` should extend. Value-level convenience wrapper around
 * `formatsAdditionRunToExtend` tolerating plain strings and non-rich values.
 *
 * @param {*}       value         Block attribute value (RichTextData, string, or other).
 * @param {number}  offset        Caret offset.
 * @param {?string} [authorToken] Id of the author making the edit, as a string.
 * @return {?{id: string, start: number, end: number}} The marker's range, or null.
 */
export function valueAdditionRunToExtend( value, offset, authorToken ) {
	let html = null;
	if ( value && typeof value.toHTMLString === 'function' ) {
		html = value.toHTMLString();
	} else if ( typeof value === 'string' ) {
		html = value;
	}
	if ( html === null || false === html.includes( SUGGESTION_CLASS ) ) {
		// Quick reject: no marker markup, nothing to extend.
		return null;
	}
	return formatsAdditionRunToExtend(
		create( { html } ).formats,
		offset,
		authorToken
	);
}

/**
 * Remove a suggestion marker's text *and* its marker, by id. The proposed-for-
 * removal text disappears (accepting a deletion) or the proposed-new text is
 * discarded (rejecting an addition) — the two ends of a suggestion that resolve
 * to "the marked run goes away". The range is resolved from the in-content
 * marker on read (never a stored offset), so it stays correct after unrelated
 * edits elsewhere in the value.
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id.
 * @return {*} New RichTextData with the marked run removed, or the original value.
 */
function removeMarkedRange( value, suggestionId ) {
	if ( ! ( value instanceof RichTextData ) ) {
		return value;
	}
	const range = findSuggestionRange( value, suggestionId );
	if ( ! range ) {
		return value;
	}
	const record = create( { html: value.toHTMLString() } );
	/*
	 * The resolved range spans first-to-last character carrying the id, so a
	 * fragmented marker can interleave ANOTHER suggestion's marker inside the
	 * span (e.g. a copy/paste split the run and a second suggestion landed in
	 * the gap). Removing the span wholesale would delete the inner marker's
	 * text along with it, so remove only the characters that actually carry
	 * THIS id — back-to-front, so earlier offsets stay valid as text shrinks.
	 */
	const target = String( suggestionId );
	const carriesId = ( index ) =>
		record.formats[ index ]?.some(
			( f ) =>
				f.type === SUGGESTION_FORMAT_NAME &&
				f.attributes?.[ SUGGESTION_ID_ATTRIBUTE ] === target
		);
	let result = record;
	let runEnd = null;
	for ( let i = range.end - 1; i >= range.start - 1; i-- ) {
		const hit = i >= range.start && carriesId( i );
		if ( hit && runEnd === null ) {
			runEnd = i + 1;
		} else if ( ! hit && runEnd !== null ) {
			result = remove( result, i + 1, runEnd );
			runEnd = null;
		}
	}
	return new RichTextData( result );
}

/**
 * Drop only a suggestion marker, keeping the text it wrapped, by id. The
 * existing text stays (rejecting a deletion) or the proposed-new text becomes
 * permanent (accepting an addition) — the two ends of a suggestion that resolve
 * to "the marked run stays, the marker goes".
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id.
 * @return {*} New RichTextData with the marker unwrapped, or the original value.
 */
function unwrapMarker( value, suggestionId ) {
	if ( ! ( value instanceof RichTextData ) ) {
		return value;
	}
	const range = findSuggestionRange( value, suggestionId );
	if ( ! range ) {
		return value;
	}
	const record = create( { html: value.toHTMLString() } );
	return new RichTextData(
		removeFormat( record, SUGGESTION_FORMAT_NAME, range.start, range.end )
	);
}

/**
 * Accept a suggested deletion: drop both the marked text and its marker so the
 * proposed removal becomes permanent.
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id to accept.
 * @return {*} New RichTextData with the marked text removed, or the original value.
 */
export function acceptInlineDeletion( value, suggestionId ) {
	return removeMarkedRange( value, suggestionId );
}

/**
 * Reject a suggested deletion: keep the text and drop only the marker, so the
 * existing content is preserved and the suggestion goes away.
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id to reject.
 * @return {*} New RichTextData with the marker unwrapped, or the original value.
 */
export function rejectInlineDeletion( value, suggestionId ) {
	return unwrapMarker( value, suggestionId );
}

/**
 * Accept a suggested addition: keep the proposed text and drop only the marker,
 * so the new content becomes permanent. (Mirror of rejecting a deletion.)
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id to accept.
 * @return {*} New RichTextData with the marker unwrapped, or the original value.
 */
export function acceptInlineAddition( value, suggestionId ) {
	return unwrapMarker( value, suggestionId );
}

/**
 * Reject a suggested addition: drop both the proposed text and its marker, so
 * the content returns to its pre-suggestion state. (Mirror of accepting a
 * deletion.)
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id to reject.
 * @return {*} New RichTextData with the marked text removed, or the original value.
 */
export function rejectInlineAddition( value, suggestionId ) {
	return removeMarkedRange( value, suggestionId );
}

/**
 * Accept a suggested formatting change: drop only the marker, so the proposed
 * formatting (already carried on the marked run) becomes permanent. (Same shape
 * as accepting an addition — the marked run stays, the marker goes.)
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id to accept.
 * @return {*} New RichTextData with the marker unwrapped, or the original value.
 */
export function acceptInlineFormat( value, suggestionId ) {
	return unwrapMarker( value, suggestionId );
}

/**
 * Reject a suggested formatting change: replace the marked run with the original
 * run captured when the suggestion was made, so the proposed formatting (and the
 * marker) are both discarded and the run returns to how it was styled before.
 * The original is supplied by the caller (persisted on the note as
 * `plan.beforeHTML`) because the marked run in content holds the *proposed*
 * formatting, not the original.
 *
 * @param {*}             value        Block attribute value (RichTextData or other).
 * @param {number|string} suggestionId Suggestion (marker) id to reject.
 * @param {string}        beforeHTML   HTML of the original run to restore.
 * @return {*} New RichTextData with the original run restored, or the original value.
 */
export function rejectInlineFormat( value, suggestionId, beforeHTML ) {
	if ( ! ( value instanceof RichTextData ) ) {
		return value;
	}
	const range = findSuggestionRange( value, suggestionId );
	if ( ! range ) {
		return value;
	}
	const record = create( { html: value.toHTMLString() } );
	const original = create( { html: beforeHTML ?? '' } );
	// `insert` replaces the [start, end) range with the original run, which
	// carries neither the proposed formatting nor the marker.
	return new RichTextData(
		insert( record, original, range.start, range.end )
	);
}

/**
 * Insert proposed new text wrapped in an `add` suggestion marker, replacing the
 * given range (a collapsed range is a plain caret insertion; a non-collapsed
 * range is a type-over). The inserted run carries the marker attributes so it
 * reads as a pending addition and resolves later via `acceptInlineAddition` /
 * `rejectInlineAddition`.
 *
 * Pure and id-agnostic: the caller supplies the marker attributes (including the
 * comment id once the suggestion is persisted), so this can be unit-tested and
 * reused by whatever drives addition creation.
 *
 * @param {*}      value              Block attribute value (RichTextData or other).
 * @param {Object} options
 * @param {string} options.text       Proposed text to insert.
 * @param {Object} options.attributes Marker attributes (see `buildSuggestionMarkerAttributes`).
 * @param {number} [options.start]    Range start; defaults to end of value.
 * @param {number} [options.end]      Range end; defaults to `start` (collapsed).
 * @return {*} New RichTextData with the marked addition inserted, or the original value.
 */
export function insertInlineAddition(
	value,
	{ text, attributes, start, end }
) {
	if ( ! ( value instanceof RichTextData ) ) {
		return value;
	}
	if ( ! text ) {
		return value;
	}
	const record = create( { html: value.toHTMLString() } );
	const startIndex = start ?? record.text.length;
	const endIndex = end ?? startIndex;
	const inserted = insert( record, text, startIndex, endIndex );
	const formatted = applyFormat(
		inserted,
		{ type: SUGGESTION_FORMAT_NAME, attributes },
		startIndex,
		startIndex + text.length
	);
	return new RichTextData( formatted );
}

/**
 * Extend an existing `add` marker by inserting more proposed text into it and
 * re-stamping the marker format over the *entire* grown span. Re-stamping the
 * whole span (rather than only the new run) keeps one format instance across it,
 * so the marker serializes as a single `<mark>` as the user keeps typing rather
 * than fragmenting into one tag per keystroke.
 *
 * Used by the typing-creation trigger to grow a contiguous addition without a
 * round-trip per character: the caret-driven insertion point defaults to
 * `markerEnd`, and the new span becomes `[markerStart, markerEnd + text.length]`.
 *
 * `at` moves that insertion point anywhere within the marker, so resuming inside
 * a pending addition grows the one marker instead of nesting a second one in it.
 *
 * @param {*}      value               Block attribute value (RichTextData or other).
 * @param {Object} options
 * @param {string} options.text        Proposed text to append to the marker.
 * @param {Object} options.attributes  Marker attributes (see `buildSuggestionMarkerAttributes`).
 * @param {number} options.markerStart Current marker start offset.
 * @param {number} options.markerEnd   Current marker end offset.
 * @param {number} [options.at]        Insertion point within the marker; defaults to `markerEnd`.
 * @return {*} New RichTextData with the marker grown, or the original value.
 */
export function growInlineAddition(
	value,
	{ text, attributes, markerStart, markerEnd, at }
) {
	if ( ! ( value instanceof RichTextData ) ) {
		return value;
	}
	if ( ! text ) {
		return value;
	}
	const record = create( { html: value.toHTMLString() } );
	// An insertion point outside the marker would leave text unmarked between
	// the marker and the re-stamped span, or absorb text that was never part of
	// the proposal.
	const insertAt = Math.min(
		Math.max( at ?? markerEnd, markerStart ),
		markerEnd
	);
	const inserted = insert( record, text, insertAt, insertAt );
	const formatted = applyFormat(
		inserted,
		{ type: SUGGESTION_FORMAT_NAME, attributes },
		markerStart,
		markerEnd + text.length
	);
	return new RichTextData( formatted );
}
