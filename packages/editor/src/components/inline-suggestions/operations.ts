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
 * @param options
 * @param options.id       Suggestion (comment) id.
 * @param options.type     Marker kind.
 * @param options.authorId Author user id.
 * @return Marker attributes for `wrapInlineMarker`.
 */
export function buildSuggestionMarkerAttributes( {
	id,
	type,
	authorId,
}: {
	id: number | string;
	type: 'del' | 'add' | 'format';
	authorId?: number | string | null;
} ): Record< string, string > {
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
 * @param formats Per-character format stacks (from `create()`).
 * @param start   Range start (inclusive).
 * @param end     Range end (exclusive).
 * @return True when a suggestion format covers any character in range.
 */
export function formatsRangeHasSuggestion(
	formats: any,
	start: number,
	end: number
): boolean {
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
 * @param formats Per-character format stacks (from `create()`).
 * @param index   Character index.
 * @return The suggestion format at that character.
 */
function suggestionFormatAt( formats: any, index: number ) {
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
 * @param formats       Per-character format stacks (from `create()`).
 * @param offset        Caret offset.
 * @param [authorToken] Id of the author making the edit, as a
 *                      string; `null`/omitted matches only a marker
 *                      with no author.
 * @return The marker's range, or null.
 */
export function formatsAdditionRunToExtend(
	formats: any,
	offset: number,
	authorToken?: string | null
): { id: string; start: number; end: number } | null {
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
	const idAt = ( index: number ) => {
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
	// Growing re-applies the marker over the run, which strips any other
	// suggestion format nested inside it (a collaborator's marker over part
	// of this addition) and orphans that note. Such a run is not extendable.
	for ( let i = start; i < end; i++ ) {
		const markers = formats[ i ]?.filter(
			( f: any ) => f?.type === SUGGESTION_FORMAT_NAME
		);
		if ( markers && markers.length > 1 ) {
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
 * @param value Block attribute value (RichTextData, string, or other).
 * @param start Range start (inclusive).
 * @param end   Range end (exclusive).
 * @return True when a suggestion format covers any character in range.
 */
export function valueRangeHasSuggestion(
	value: any,
	start: number,
	end: number
): boolean {
	let html: string | null = null;
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
 * @param value         Block attribute value (RichTextData, string, or other).
 * @param offset        Caret offset.
 * @param [authorToken] Id of the author making the edit, as a string.
 * @return The marker's range, or null.
 */
export function valueAdditionRunToExtend(
	value: any,
	offset: number,
	authorToken?: string | null
): { id: string; start: number; end: number } | null {
	let html: string | null = null;
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
 * @param value        Block attribute value (RichTextData or other).
 * @param suggestionId Suggestion (marker) id.
 * @return New RichTextData with the marked run removed, or the original value.
 */
function removeMarkedRange( value: any, suggestionId: number | string ) {
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
	const carriesId = ( index: number ) =>
		record.formats[ index ]?.some(
			( f: any ) =>
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
	return new RichTextData( result as any );
}

/**
 * Drop only a suggestion marker, keeping the text it wrapped, by id. The
 * existing text stays (rejecting a deletion) or the proposed-new text becomes
 * permanent (accepting an addition) — the two ends of a suggestion that resolve
 * to "the marked run stays, the marker goes".
 *
 * @param value        Block attribute value (RichTextData or other).
 * @param suggestionId Suggestion (marker) id.
 * @return New RichTextData with the marker unwrapped, or the original value.
 */
function unwrapMarker( value: any, suggestionId: number | string ) {
	if ( ! ( value instanceof RichTextData ) ) {
		return value;
	}
	const range = findSuggestionRange( value, suggestionId );
	if ( ! range ) {
		return value;
	}
	const record = create( { html: value.toHTMLString() } );
	return new RichTextData(
		removeFormat(
			record,
			SUGGESTION_FORMAT_NAME,
			range.start,
			range.end
		) as any
	);
}

/**
 * Accept a suggested deletion: drop both the marked text and its marker so the
 * proposed removal becomes permanent.
 *
 * @param value        Block attribute value (RichTextData or other).
 * @param suggestionId Suggestion (marker) id to accept.
 * @return New RichTextData with the marked text removed, or the original value.
 */
export function acceptInlineDeletion(
	value: any,
	suggestionId: number | string
) {
	return removeMarkedRange( value, suggestionId );
}

/**
 * Reject a suggested deletion: keep the text and drop only the marker, so the
 * existing content is preserved and the suggestion goes away.
 *
 * @param value        Block attribute value (RichTextData or other).
 * @param suggestionId Suggestion (marker) id to reject.
 * @return New RichTextData with the marker unwrapped, or the original value.
 */
export function rejectInlineDeletion(
	value: any,
	suggestionId: number | string
) {
	return unwrapMarker( value, suggestionId );
}

/**
 * Accept a suggested addition: keep the proposed text and drop only the marker,
 * so the new content becomes permanent. (Mirror of rejecting a deletion.)
 *
 * @param value        Block attribute value (RichTextData or other).
 * @param suggestionId Suggestion (marker) id to accept.
 * @return New RichTextData with the marker unwrapped, or the original value.
 */
export function acceptInlineAddition(
	value: any,
	suggestionId: number | string
) {
	return unwrapMarker( value, suggestionId );
}

/**
 * Reject a suggested addition: drop both the proposed text and its marker, so
 * the content returns to its pre-suggestion state. (Mirror of accepting a
 * deletion.)
 *
 * @param value        Block attribute value (RichTextData or other).
 * @param suggestionId Suggestion (marker) id to reject.
 * @return New RichTextData with the marked text removed, or the original value.
 */
export function rejectInlineAddition(
	value: any,
	suggestionId: number | string
) {
	return removeMarkedRange( value, suggestionId );
}

/**
 * Accept a suggested formatting change: drop only the marker, so the proposed
 * formatting (already carried on the marked run) becomes permanent. (Same shape
 * as accepting an addition — the marked run stays, the marker goes.)
 *
 * @param value        Block attribute value (RichTextData or other).
 * @param suggestionId Suggestion (marker) id to accept.
 * @return New RichTextData with the marker unwrapped, or the original value.
 */
export function acceptInlineFormat(
	value: any,
	suggestionId: number | string
) {
	return unwrapMarker( value, suggestionId );
}

/**
 * Extract the HTML of a block attribute value, tolerating plain strings.
 *
 * @param value Block attribute value.
 * @return HTML, or null when the value carries none.
 */
function toHTML( value: any ): string | null {
	if ( value instanceof RichTextData ) {
		return value.toHTMLString();
	}
	return typeof value === 'string' ? value : null;
}

/**
 * Reject a suggested formatting change: replace the marked run with the original
 * run captured when the suggestion was made, so the proposed formatting (and the
 * marker) are both discarded and the run returns to how it was styled before.
 * The original is supplied by the caller (persisted on the note as
 * `plan.beforeHTML`) because the marked run in content holds the *proposed*
 * formatting, not the original.
 *
 * Accepts a plain-string value as well as `RichTextData`: the format keyboard's
 * retract path passes the raw `content` attribute, which a block may hold as a
 * string.
 *
 * @param value        Block attribute value (RichTextData, string, or other).
 * @param suggestionId Suggestion (marker) id to reject.
 * @param beforeHTML   HTML of the original run to restore.
 * @return New RichTextData with the original run restored, or the original value.
 */
export function rejectInlineFormat(
	value: any,
	suggestionId: number | string,
	beforeHTML: string
) {
	const html = toHTML( value );
	if ( html === null ) {
		return value;
	}
	const range = findSuggestionRange( value, suggestionId );
	if ( ! range ) {
		return value;
	}
	const record = create( { html } );
	const original = create( { html: beforeHTML ?? '' } );
	// `insert` replaces the [start, end) range with the original run, which
	// carries neither the proposed formatting nor the marker.
	return new RichTextData(
		insert( record, original, range.start, range.end ) as any
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
 * Pass `html` instead of `text` when the proposed run carries its own inline
 * formatting (a pasted `<strong>`/`<a href>`): the run keeps those formats and
 * the marker wraps them.
 *
 * @param value              Block attribute value (RichTextData or other).
 * @param options            Options.
 * @param options.text       Proposed plain text to insert.
 * @param options.html       Proposed rich HTML to insert; takes precedence over `text`.
 * @param options.attributes Marker attributes (see `buildSuggestionMarkerAttributes`).
 * @param options.start      Range start; defaults to end of value.
 * @param options.end        Range end; defaults to `start` (collapsed).
 * @return New RichTextData with the marked addition inserted, or the original value.
 */
export function insertInlineAddition(
	value: any,
	{
		text,
		html,
		attributes,
		start,
		end,
	}: {
		text?: string;
		html?: string;
		attributes: Record< string, any >;
		start?: number;
		end?: number;
	}
) {
	if ( ! ( value instanceof RichTextData ) ) {
		return value;
	}
	const run = html ? create( { html } ) : create( { text: text ?? '' } );
	if ( ! run.text ) {
		return value;
	}
	const record = create( { html: value.toHTMLString() } );
	const startIndex = start ?? record.text.length;
	const endIndex = end ?? startIndex;
	/*
	 * Stamp the marker onto the run before inserting it, as the outermost
	 * format on every character. `applyFormat` places a format at the
	 * shallowest depth the whole range shares, which nests the marker INSIDE
	 * the run's own formats when every character carries one — a fully bold
	 * paste would serialize as `<strong><mark>…</mark></strong>`, and a
	 * partially formatted one can fragment into several `<mark>` tags. The
	 * marker has to stay one span wrapping the run so accept/reject resolve
	 * it as a unit.
	 */
	const marker = { type: SUGGESTION_FORMAT_NAME, attributes };
	const formats = new Array( run.text.length );
	for ( let index = 0; index < formats.length; index++ ) {
		const stack = run.formats[ index ];
		formats[ index ] = stack ? [ marker, ...stack ] : [ marker ];
	}
	return new RichTextData(
		insert(
			record,
			{ ...run, formats } as any,
			startIndex,
			endIndex
		) as any
	);
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
 * `html` carries the run's own inline formats, for a rich-text paste that lands
 * inside the marker. As in `insertInlineAddition`, the marker is stamped as the
 * outermost format on the pasted characters so the grown proposal stays one
 * `<mark>` rather than fragmenting around the nested formats.
 *
 * @param value               Block attribute value (RichTextData or other).
 * @param options             Options.
 * @param options.text        Proposed text to append to the marker.
 * @param options.html        HTML of the proposed run when it carries inline formatting.
 * @param options.attributes  Marker attributes (see `buildSuggestionMarkerAttributes`).
 * @param options.markerStart Current marker start offset.
 * @param options.markerEnd   Current marker end offset.
 * @param options.at          Insertion point within the marker; defaults to `markerEnd`.
 * @return New RichTextData with the marker grown, or the original value.
 */
export function growInlineAddition(
	value: any,
	{
		text,
		html,
		attributes,
		markerStart,
		markerEnd,
		at,
	}: {
		text?: string;
		html?: string;
		attributes: Record< string, any >;
		markerStart: number;
		markerEnd: number;
		at?: number;
	}
) {
	if ( ! ( value instanceof RichTextData ) ) {
		return value;
	}
	const run = html ? create( { html } ) : create( { text: text ?? '' } );
	if ( ! run.text ) {
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
	const marker = { type: SUGGESTION_FORMAT_NAME, attributes };
	const formats = new Array( run.text.length );
	for ( let index = 0; index < formats.length; index++ ) {
		const stack = run.formats[ index ];
		formats[ index ] = stack ? [ marker, ...stack ] : [ marker ];
	}
	const inserted = insert(
		record,
		{ ...run, formats } as any,
		insertAt,
		insertAt
	);
	const formatted = applyFormat(
		inserted,
		marker as any,
		markerStart,
		markerEnd + run.text.length
	);
	return new RichTextData( formatted as any );
}
