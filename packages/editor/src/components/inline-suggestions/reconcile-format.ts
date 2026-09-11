/**
 * Phase 2 of the overlay-retirement work (#73411): inline formatting -> marks.
 *
 * A format-only edit (bold/italic/link toggled over a run, the text itself
 * unchanged) is modelled as a single `format` marker wrapping the run — the
 * Google Docs model: the text is shown once, in place, carrying the *proposed*
 * formatting, never duplicated. The original run is captured separately so a
 * reject can restore it (the caller persists it on the suggestion note).
 * Accepting unwraps the marker (proposed formatting stays); rejecting replaces
 * the run with the captured original.
 *
 * This module is the pure engine only: it detects the format delta and plans /
 * applies the marker against rich-text values. It does not touch the store or
 * create notes — the caller wires those, exactly as `reconcile-edit.js` is
 * wired for text edits. `analyzeTextEdit` sees no text change for a format-only
 * edit, so format detection needs this separate pass.
 */
import {
	RichTextData,
	create,
	slice,
	applyFormat,
	removeFormat,
} from '@wordpress/rich-text';
import {
	SUGGESTION_AUTHOR_ATTRIBUTE,
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_ID_ATTRIBUTE,
	SUGGESTION_TYPE_ATTRIBUTE,
	SUGGESTION_TYPE_FORMAT,
} from './format';
import { buildSuggestionMarkerAttributes } from './operations';

/**
 * Serialize a rich-text record range to an HTML string, for capturing the
 * original run so a reject can restore it.
 *
 * @param record Rich-text record.
 * @param start  Range start.
 * @param end    Range end.
 * @return HTML of the sliced run.
 */
function sliceToHTML( record: any, start: number, end: number ): string {
	return new RichTextData(
		slice( record, start, end ) as any
	).toHTMLString();
}

/**
 * Parse a block attribute value into a rich-text record, tolerating plain
 * strings and other non-rich values.
 *
 * @param value Block attribute value.
 * @return Rich-text record, or null when the value isn't rich text.
 */
function toRecord( value: any ) {
	if ( value instanceof RichTextData ) {
		return create( { html: value.toHTMLString() } );
	}
	if ( typeof value === 'string' ) {
		return create( { html: value } );
	}
	return null;
}

/**
 * Stable key for a rich-text format so two format instances compare equal when
 * they are the same type with the same attributes (a link and its href, a
 * text-color and its value). Attribute keys are sorted so key order doesn't
 * affect equality.
 *
 * @param format Rich-text format ({ type, attributes? }).
 * @return Comparison key.
 */
function formatKey( format: any ): string {
	const attributes = format.attributes ?? {};
	const parts = Object.keys( attributes )
		.sort()
		.map( ( name ) => `${ name }=${ attributes[ name ] }` );
	return `${ format.type }(${ parts.join( ',' ) })`;
}

/*
 * Per-stack-array memo for `stackKey`. Rich-text shares one formats-array
 * reference across every character of a contiguous formatted run, so caching
 * by reference collapses the per-character key computation to once per run.
 * A WeakMap so retired records don't pin their stacks in memory.
 */
const stackKeyCache = new WeakMap< any[], string >();

/**
 * Comparison key for a character's whole format stack, excluding the suggestion
 * marker itself (so a value that already carries markers isn't seen as
 * "different" only because of them, and re-running is stable). Sorted so stack
 * order doesn't matter. Memoized per stack-array reference.
 *
 * @param stack Per-character format stack (may be undefined).
 * @return Comparison key for the stack.
 */
function stackKey( stack: any ): string {
	if ( ! Array.isArray( stack ) ) {
		return '';
	}
	const cached = stackKeyCache.get( stack );
	if ( cached !== undefined ) {
		return cached;
	}
	const key = stack
		.filter( ( f ) => f.type !== SUGGESTION_FORMAT_NAME )
		.map( formatKey )
		.sort()
		.join( '|' );
	stackKeyCache.set( stack, key );
	return key;
}

/**
 * Detect a format-only edit and return the contiguous character range whose
 * formatting changed. Returns null when the text differs (that is a text edit,
 * handled by `reconcile-edit.js`, not here) or when no formatting changed.
 *
 * A single contiguous span from the first to the last differing character is
 * returned; toggling two disjoint runs in one edit over-selects the unchanged
 * middle, which marks a slightly wider run but never corrupts content. The
 * common case — toggling one selection — is exact.
 *
 * @param prevValue Value before the edit.
 * @param nextValue Value after the edit.
 * @return Changed range, or null.
 */
export function analyzeFormatEdit(
	prevValue: any,
	nextValue: any
): { start: number; end: number } | null {
	const prev = toRecord( prevValue );
	const next = toRecord( nextValue );
	if ( ! prev || ! next ) {
		return null;
	}
	// A different text length or content is a text edit, not a format edit.
	if ( prev.text !== next.text ) {
		return null;
	}
	const length = prev.text.length;
	let start = -1;
	let end = -1;
	for ( let i = 0; i < length; i++ ) {
		if (
			stackKey( prev.formats?.[ i ] ) !== stackKey( next.formats?.[ i ] )
		) {
			if ( start === -1 ) {
				start = i;
			}
			end = i + 1;
		}
	}
	if ( start === -1 ) {
		return null;
	}
	return { start, end };
}

/**
 * Whether any character in `[start, end)` already carries a suggestion marker in
 * either value. A format change overlapping an open suggestion is left alone
 * rather than nesting a marker inside another suggestion.
 *
 * @param prev  Previous record.
 * @param next  Next record.
 * @param start Range start.
 * @param end   Range end.
 * @return True when the range touches an existing marker.
 */
function overlapsExistingMarker(
	prev: any,
	next: any,
	start: number,
	end: number
): boolean {
	for ( let i = start; i < end; i++ ) {
		const inPrev = prev.formats?.[ i ]?.some(
			( f: any ) => f.type === SUGGESTION_FORMAT_NAME
		);
		const inNext = next.formats?.[ i ]?.some(
			( f: any ) => f.type === SUGGESTION_FORMAT_NAME
		);
		if ( inPrev || inNext ) {
			return true;
		}
	}
	return false;
}

export interface FormatPlan {
	kind: 'format' | 'none';
	/** The changed character range. */
	range?: { start: number; end: number };
	/** HTML of the original run (for reject). */
	beforeHTML?: string;
	/** HTML of the reformatted run. */
	afterHTML?: string;
	/** Id of the suggester's own pending marker this plan extends. */
	extendsId?: string;
	/** The extended marker's original attributes, re-applied verbatim. */
	markerAttributes?: Record< string, any >;
	/** Plain text of the run an extending plan covers. */
	runText?: string;
}

/**
 * The suggestion marker covering a character, if any.
 *
 * @param record Rich-text record.
 * @param index  Character index.
 * @return The `core/suggestion` format at that character, or undefined.
 */
function suggestionAt( record: any, index: number ) {
	return record.formats?.[ index ]?.find(
		( format: any ) => format.type === SUGGESTION_FORMAT_NAME
	);
}

/**
 * The suggestion id a character's marker carries, as a string, or undefined.
 *
 * @param record Rich-text record.
 * @param index  Character index.
 * @return Marker id.
 */
function suggestionIdAt( record: any, index: number ): string | undefined {
	const id = suggestionAt( record, index )?.attributes?.[
		SUGGESTION_ID_ATTRIBUTE
	];
	return id === undefined ? undefined : String( id );
}

/**
 * Every suggestion id a character carries, outermost first.
 *
 * A character can sit under more than one marker — typing inside a formatted
 * suggestion nests an `add` marker beneath it — and `suggestionAt` reports only
 * the outermost. Extending applies `core/suggestion` across the whole run, and
 * `applyFormat` drops same-type formats it finds inside a non-collapsed range,
 * so the extend path has to see the whole stack or it will silently strip a
 * nested marker and orphan its note.
 *
 * @param record Rich-text record.
 * @param index  Character index.
 * @return Marker ids at that character.
 */
function suggestionIdsAt( record: any, index: number ): string[] {
	const ids: string[] = [];
	for ( const format of record.formats?.[ index ] ?? [] ) {
		if ( format.type !== SUGGESTION_FORMAT_NAME ) {
			continue;
		}
		const id = format.attributes?.[ SUGGESTION_ID_ATTRIBUTE ];
		if ( id !== undefined ) {
			ids.push( String( id ) );
		}
	}
	return ids;
}

/**
 * The contiguous run of characters carrying the marker with the given id,
 * around `index`. Returns null when the same id also appears outside that run —
 * a fragmented marker can't be re-planned as one range.
 *
 * @param record Rich-text record.
 * @param index  A character index known to carry the marker.
 * @param id     Marker id.
 * @return The marker's range.
 */
function markerRun(
	record: any,
	index: number,
	id: string
): { start: number; end: number } | null {
	let start = index;
	while ( start > 0 && suggestionIdAt( record, start - 1 ) === id ) {
		start--;
	}
	let end = index + 1;
	while ( end < record.text.length && suggestionIdAt( record, end ) === id ) {
		end++;
	}
	for ( let i = 0; i < record.text.length; i++ ) {
		if ( ( i < start || i >= end ) && suggestionIdAt( record, i ) === id ) {
			return null;
		}
	}
	return { start, end };
}

/**
 * Find the suggester's own `format` marker that a second format toggle should
 * extend, rather than opening a second suggestion over the same words.
 *
 * A run that already carries a pending `format` suggestion is a run whose
 * formatting is already under review. Toggling a second format over it (bold
 * then italic) is a revision of that same proposal, so it belongs on the same
 * note and the same marker — the alternative is the whole-content overlay,
 * which stores a marker-free snapshot, hides the first marker, and records the
 * *proposed* bold as if it were the original text (#73411, finding F-12).
 *
 * Conservative on purpose. The marker has to be a `format` marker, authored by
 * the suggester making this edit, unfragmented, identical in both values, and
 * has to cover the whole changed range. Anything else — someone else's marker,
 * an `add`/`del` marker, a toggle spilling past the marker's edges — is left
 * for the caller to decline.
 *
 * @param prev        Record before the edit.
 * @param next        Record after the edit.
 * @param range       Changed range from `analyzeFormatEdit`.
 * @param range.start Range start offset.
 * @param range.end   Range end offset.
 * @param authorId    Id of the user making this edit.
 * @return The marker to extend, or null.
 */
function findExtendableFormatMarker(
	prev: any,
	next: any,
	range: { start: number; end: number },
	authorId?: number | string | null
): {
	id: string;
	attributes: Record< string, any >;
	range: { start: number; end: number };
} | null {
	const marker = suggestionAt( next, range.start );
	const attributes = marker?.attributes;
	const id = attributes?.[ SUGGESTION_ID_ATTRIBUTE ];
	if (
		! id ||
		attributes[ SUGGESTION_TYPE_ATTRIBUTE ] !== SUGGESTION_TYPE_FORMAT
	) {
		return null;
	}
	// Extending re-attributes nothing: the note stays the author's. Only that
	// author may revise it.
	if (
		authorId === null ||
		authorId === undefined ||
		String( attributes[ SUGGESTION_AUTHOR_ATTRIBUTE ] ) !==
			String( authorId )
	) {
		return null;
	}
	const key = String( id );
	/*
	 * Every character in the toggled range must carry this marker and no other,
	 * on both sides of the edit. A second marker nested under this one would be
	 * stripped by the `applyFormat` the extend plan leads to, leaving its note
	 * anchored to nothing; refuse rather than extend over it.
	 */
	const carriesOnly = ( record: any, i: number ) => {
		const ids = suggestionIdsAt( record, i );
		return ids.length === 1 && ids[ 0 ] === key;
	};
	for ( let i = range.start; i < range.end; i++ ) {
		if ( ! carriesOnly( prev, i ) || ! carriesOnly( next, i ) ) {
			return null;
		}
	}
	const prevRun = markerRun( prev, range.start, key );
	const nextRun = markerRun( next, range.start, key );
	if (
		! prevRun ||
		! nextRun ||
		prevRun.start !== nextRun.start ||
		prevRun.end !== nextRun.end
	) {
		return null;
	}
	/*
	 * The plan re-applies the marker across the whole run, not only the range
	 * the user toggled, so the exclusivity the loop above established has to
	 * hold over the run's full span.
	 */
	for ( let i = nextRun.start; i < nextRun.end; i++ ) {
		if ( ! carriesOnly( prev, i ) || ! carriesOnly( next, i ) ) {
			return null;
		}
	}
	return { id: key, attributes, range: nextRun };
}

/**
 * Serialize a marked run without its suggestion marker, so the captured HTML
 * describes the run's formatting alone (what a summary diffs and a reject
 * restores) rather than the bookkeeping wrapper.
 *
 * @param record Rich-text record.
 * @param start  Range start.
 * @param end    Range end.
 * @return HTML of the sliced run, marker-free.
 */
function sliceToUnmarkedHTML(
	record: any,
	start: number,
	end: number
): string {
	return sliceToHTML(
		removeFormat( record, SUGGESTION_FORMAT_NAME, start, end ),
		start,
		end
	);
}

/**
 * Plan the marker for a format-only edit. One `format` marker wraps the run; the
 * plan also carries the original and proposed run HTML so the caller can persist
 * the original on the note (for reject) and summarize the change.
 *
 * When the run already carries the suggester's own pending `format` marker, the
 * plan instead names that marker in `extendsId`: the caller revises that
 * suggestion (keeping its recorded original) rather than creating a second one,
 * so `beforeHTML` is deliberately absent from an extending plan.
 *
 * @param prevValue        Value before the edit.
 * @param nextValue        Value after the edit.
 * @param options          Options.
 * @param options.authorId Id of the user making the edit;
 *                         required to extend their own marker.
 * @return Plan.
 */
export function planFormatMarkers(
	prevValue: any,
	nextValue: any,
	{ authorId }: { authorId?: number | string } = {}
): FormatPlan {
	const prev = toRecord( prevValue );
	const next = toRecord( nextValue );
	if ( ! prev || ! next ) {
		return { kind: 'none' };
	}
	const range = analyzeFormatEdit( prevValue, nextValue );
	if ( ! range ) {
		return { kind: 'none' };
	}
	const extendable = findExtendableFormatMarker(
		prev,
		next,
		range,
		authorId
	);
	if ( extendable ) {
		return {
			kind: 'format',
			extendsId: extendable.id,
			markerAttributes: extendable.attributes,
			range: extendable.range,
			afterHTML: sliceToUnmarkedHTML(
				next,
				extendable.range.start,
				extendable.range.end
			),
			/*
			 * The run's plain text, for the caller to check against the text of
			 * the original the note recorded. A reject restores that original
			 * over the marker's whole span, so if the run has grown since the
			 * note was written the two no longer describe the same characters
			 * and rejecting would delete the difference.
			 */
			runText: next.text.slice(
				extendable.range.start,
				extendable.range.end
			),
		};
	}
	if ( overlapsExistingMarker( prev, next, range.start, range.end ) ) {
		return { kind: 'none' };
	}
	return {
		kind: 'format',
		range,
		beforeHTML: sliceToHTML( prev, range.start, range.end ),
		afterHTML: sliceToHTML( next, range.start, range.end ),
	};
}

/**
 * Apply a format plan, producing the marked value: the reformatted run (from the
 * next value, carrying the proposed formatting) wrapped in a single `format`
 * marker. The marker id is the caller's created note id. The text is unchanged,
 * so no duplication — the run is shown once with the proposed formatting.
 *
 * An extending plan re-applies the marker it is extending, with its original
 * attributes, over the same range: the toggle that produced `nextValue` may have
 * split the marker's format stack, and re-applying restores it as one run
 * without touching its id or author.
 *
 * @param nextValue        Value after the edit (source of the reformatted run).
 * @param plan             Plan from `planFormatMarkers`.
 * @param options          Options.
 * @param options.id       Marker (note) id; ignored by an extending plan.
 * @param options.authorId Author id stamped on the marker.
 * @return New RichTextData with the format marker, or `nextValue` unchanged.
 */
export function applyFormatPlan(
	nextValue: any,
	plan: FormatPlan | null | undefined,
	{
		id,
		authorId,
	}: { id?: number | string | null; authorId?: number | string } = {}
): any {
	if ( ! plan || plan.kind !== 'format' ) {
		return nextValue;
	}
	const attributes = plan.extendsId
		? plan.markerAttributes
		: buildSuggestionMarkerAttributes( {
				id: id!,
				type: SUGGESTION_TYPE_FORMAT,
				authorId,
		  } );
	if ( ! attributes ) {
		return nextValue;
	}
	if ( ! plan.extendsId && ( id === undefined || id === null ) ) {
		return nextValue;
	}
	const next = toRecord( nextValue );
	if ( ! next ) {
		return nextValue;
	}
	const { start, end } = plan.range!;

	const marked = applyFormat(
		next,
		{
			type: SUGGESTION_FORMAT_NAME,
			attributes,
		} as any,
		start,
		end
	);
	return new RichTextData( marked as any );
}
