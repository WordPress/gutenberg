import {
	RichTextData,
	create,
	slice,
	toHTMLString,
} from '@wordpress/rich-text';
import { wrapInlineMarker } from '../inline-markers';
import {
	SUGGESTION_FORMAT_NAME,
	SUGGESTION_ID_ATTRIBUTE,
	SUGGESTION_TYPE_ATTRIBUTE,
	SUGGESTION_TYPE_ADDITION,
	SUGGESTION_TYPE_DELETION,
	findSuggestionRange,
} from './format';
import {
	buildSuggestionMarkerAttributes,
	formatsAdditionRunToExtend,
	insertInlineAddition,
	growInlineAddition,
	rejectInlineAddition,
} from './operations';

/**
 * Phase 1 of the overlay-retirement work (#73411): derive a suggestion edit
 * from a value change instead of from input-event types.
 *
 * The legacy capture-phase `beforeinput` handlers only recognise a narrow set of
 * `inputType` strings (`insertText`, `deleteContentBackward/Forward`, single-
 * line paste); word/line deletes, cut, autocorrect, IME, and drag-drop "seam"
 * through to the overlay diff path. These functions are input-type-agnostic:
 * given the value before and after an edit they compute what changed and how it
 * maps to inline `<mark>` markers, so any edit that changes the text is captured
 * uniformly.
 *
 * The work is split so the tricky part is pure and testable:
 *   - `analyzeTextEdit` reduces a prev/next text pair to one contiguous edit.
 *   - `planEditMarkers` decides how that edit maps to marker actions, honouring
 *     markers already in the value (grow an open addition, leave an existing
 *     deletion alone, etc.). It allocates no ids and writes nothing, so it can
 *     be exhaustively unit-tested; the applier/wiring resolves note ids and
 *     executes the plan.
 */

export interface TextEdit {
	/** What the edit did. */
	kind: 'insert' | 'delete' | 'replace' | 'none';
	/** Prev-value offset where the change starts. */
	start: number;
	/** Prev-value offset where the changed (removed) region ends; equals `start` for a pure insert. */
	end: number;
	/** Text present in next but not prev at the change. */
	insertedText: string;
	/** Text present in prev but not next at the change. */
	removedText: string;
}

/**
 * Reduce a previous/next plain-text pair to a single contiguous edit by trimming
 * the common prefix and suffix. A single user action (type, delete, cut, paste,
 * autocorrect, IME commit) changes one contiguous region, so prefix/suffix
 * trimming recovers it exactly without an O(n*m) diff.
 *
 * @param prevText Text before the edit.
 * @param nextText Text after the edit.
 * @return The normalized edit.
 */
export function analyzeTextEdit(
	prevText: string | undefined,
	nextText: string | undefined
): TextEdit {
	const prev = typeof prevText === 'string' ? prevText : '';
	const next = typeof nextText === 'string' ? nextText : '';

	if ( prev === next ) {
		return {
			kind: 'none',
			start: 0,
			end: 0,
			insertedText: '',
			removedText: '',
		};
	}

	const maxPrefix = Math.min( prev.length, next.length );
	let prefix = 0;
	while ( prefix < maxPrefix && prev[ prefix ] === next[ prefix ] ) {
		prefix++;
	}

	let suffix = 0;
	const maxSuffix = Math.min( prev.length - prefix, next.length - prefix );
	while (
		suffix < maxSuffix &&
		prev[ prev.length - 1 - suffix ] === next[ next.length - 1 - suffix ]
	) {
		suffix++;
	}

	const removedText = prev.slice( prefix, prev.length - suffix );
	const insertedText = next.slice( prefix, next.length - suffix );

	let kind: TextEdit[ 'kind' ];
	if ( removedText && insertedText ) {
		kind = 'replace';
	} else if ( insertedText ) {
		kind = 'insert';
	} else {
		kind = 'delete';
	}

	return {
		kind,
		start: prefix,
		end: prev.length - suffix,
		insertedText,
		removedText,
	};
}

/**
 * Cap on how far a replacement is widened toward its word boundaries. Text
 * without whitespace separators — CJK prose, a long URL — would otherwise
 * widen a one-character correction across the whole run.
 */
const MAX_WORD_WIDEN_CHARS = 40;

/**
 * Widen a replacement to the whole words it lands inside.
 *
 * `analyzeTextEdit` trims the common prefix and suffix, which is exactly right
 * for locating the edit but wrong for describing it: correcting "teh" to "the"
 * shares a leading "t" and a trailing "e", so the raw edit is delete "eh",
 * insert "he". That renders in the canvas as "tehhe" and in the sidebar as two
 * notes quoting fragments of words, neither of which a reviewer can act on.
 * Snapping both ends out to the surrounding word boundaries proposes the
 * correction the way a person would describe it: replace "teh" with "the".
 *
 * The prefix and suffix are shared by construction, so extending the range in
 * the previous text extends it by the identical characters in the next text.
 *
 * @param prevText     Text before the edit.
 * @param nextText     Text after the edit.
 * @param edit         The trimmed edit from `analyzeTextEdit`.
 * @param [isUnmarked] Predicate reporting whether a prev-text range
 *                     is free of suggestion markers; widening into a
 *                     marker is declined so the narrow edit is used.
 * @return The widened edit, or the original when it can't widen.
 */
export function widenReplaceToWords(
	prevText: string,
	nextText: string,
	edit: TextEdit,
	isUnmarked?: ( start: number, end: number ) => boolean
): TextEdit {
	if ( edit.kind !== 'replace' ) {
		return edit;
	}
	const isWordChar = ( char: string | undefined ) =>
		typeof char === 'string' && ! /\s/.test( char );

	let start = edit.start;
	while (
		start > 0 &&
		edit.start - start < MAX_WORD_WIDEN_CHARS &&
		isWordChar( prevText[ start - 1 ] )
	) {
		start--;
	}

	let end = edit.end;
	while (
		end < prevText.length &&
		end - edit.end < MAX_WORD_WIDEN_CHARS &&
		isWordChar( prevText[ end ] )
	) {
		end++;
	}

	if ( start === edit.start && end === edit.end ) {
		return edit;
	}
	if ( typeof isUnmarked === 'function' && ! isUnmarked( start, end ) ) {
		return edit;
	}

	return {
		...edit,
		start,
		end,
		removedText: prevText.slice( start, end ),
		insertedText: nextText.slice(
			start,
			nextText.length - ( prevText.length - end )
		),
	};
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
 * The `core/suggestion` format active at a character, or null.
 *
 * @param record Rich-text record.
 * @param index  Character index.
 * @return The suggestion format object (with `attributes`), or null.
 */
function suggestionAt( record: any, index: number ) {
	const stack = record.formats?.[ index ];
	if ( ! Array.isArray( stack ) ) {
		return null;
	}
	return stack.find( ( f ) => f.type === SUGGESTION_FORMAT_NAME ) ?? null;
}

function markerId( format: any ) {
	return format?.attributes?.[ SUGGESTION_ID_ATTRIBUTE ] ?? null;
}

function markerType( format: any ) {
	return format?.attributes?.[ SUGGESTION_TYPE_ATTRIBUTE ] ?? null;
}

/**
 * HTML of the inserted run when it carries inline formatting of its own, so the
 * proposed addition can be marked up rather than flattened to plain text — a
 * pasted `<strong>`/`<a href>` reaches the block as a new `content` value, and
 * diffing only `record.text` would drop it.
 *
 * Returns null when the run is unformatted (the plain-text path stays exactly as
 * it was) and when it already carries a suggestion marker: re-marking a marked
 * run would nest one marker inside another.
 *
 * @param nextRecord Rich-text record of the value after the edit.
 * @param edit       Normalized edit from `analyzeTextEdit`.
 * @return HTML of the inserted run, or null.
 */
function insertedRunHTML( nextRecord: any, edit: TextEdit ): string | null {
	if ( ! nextRecord || ! edit.insertedText ) {
		return null;
	}
	const from = edit.start;
	const to = from + edit.insertedText.length;
	let hasFormats = false;
	for ( let index = from; index < to; index++ ) {
		const stack = nextRecord.formats?.[ index ];
		if ( ! Array.isArray( stack ) || stack.length === 0 ) {
			continue;
		}
		if ( stack.some( ( f: any ) => f.type === SUGGESTION_FORMAT_NAME ) ) {
			return null;
		}
		hasFormats = true;
	}
	if ( ! hasFormats ) {
		return null;
	}
	return toHTMLString( { value: slice( nextRecord, from, to ) } );
}

export interface MarkerAction {
	/** Action kind. */
	type: 'insert-add' | 'grow-add' | 'wrap-del' | 'remove-add';
	/** Text to insert/append (insert-add, grow-add). */
	text?: string;
	/** HTML of the inserted run when it carries inline formatting (insert-add). */
	html?: string;
	/** Insertion offset (insert-add, grow-add). */
	at?: number;
	/** Range start (wrap-del). */
	start?: number;
	/** Range end (wrap-del). */
	end?: number;
	/** Existing marker id to reuse (grow-add, remove-add). */
	id?: string;
	/** True when the action needs a freshly created note/id. */
	newNote?: boolean;
}

/**
 * Decide how a text edit maps to inline-suggestion marker actions, against the
 * markers already present in the value. All offsets are in the *previous*
 * value, which is where the actions apply (the edit is re-expressed as markers
 * on the original text rather than committed as-is).
 *
 * Handled cleanly:
 *   - insert into unmarked text                       -> new `add` marker
 *   - insert inside, or at the trailing edge of, the
 *     author's own `add` marker                       -> grow that marker
 *   - delete unmarked text                            -> new `del` marker (kept, struck through)
 *   - delete text already inside a `del` marker       -> no-op (already proposed for deletion)
 *   - delete the author's own `add` text              -> remove that marker (un-add)
 *   - replace unmarked text (type-over)               -> `del` over the old run + `add` for the new
 *
 * Ambiguous cases (an edit straddling a marker boundary, deleting a mix of
 * marked and unmarked text, or editing another author's marker) return no
 * actions; the caller leaves the value as the user typed it rather than guess.
 * Those are tightened in later phases with the safety-net e2e as the oracle.
 *
 * @param prevValue        Block attribute value before the edit.
 * @param nextValue        Block attribute value after the edit.
 * @param options
 * @param options.authorId Current author id; gates growing/removing the author's own markers.
 * @return The marker plan.
 */
export function planEditMarkers(
	prevValue: any,
	nextValue: any,
	{ authorId }: { authorId?: number | string } = {}
): { kind: string; actions: MarkerAction[] } {
	const record = toRecord( prevValue );
	if ( ! record ) {
		return { kind: 'none', actions: [] };
	}

	const nextRecord = toRecord( nextValue );
	const edit = analyzeTextEdit(
		record.text,
		nextRecord ? nextRecord.text : ''
	);

	if ( edit.kind === 'none' ) {
		return { kind: 'none', actions: [] };
	}

	const authorToken =
		authorId !== undefined && authorId !== null ? String( authorId ) : null;

	// Whether every character in [start, end) carries a suggestion marker of the
	// given type sharing one id; returns that id, or null otherwise.
	const uniformMarker = ( start: number, end: number, type: string ) => {
		if ( start >= end ) {
			return null;
		}
		let id: string | null = null;
		for ( let i = start; i < end; i++ ) {
			const f = suggestionAt( record, i );
			if ( ! f || markerType( f ) !== type ) {
				return null;
			}
			const fid = markerId( f );
			if ( id === null ) {
				id = fid;
			} else if ( id !== fid ) {
				return null;
			}
		}
		return id;
	};

	// Whether [start, end) is entirely free of suggestion markers.
	const isUnmarked = ( start: number, end: number ) => {
		for ( let i = start; i < end; i++ ) {
			if ( suggestionAt( record, i ) ) {
				return false;
			}
		}
		return true;
	};

	if ( edit.kind === 'insert' ) {
		/*
		 * Grow the author's own pending addition when the insertion point sits
		 * inside it or at its trailing edge, rather than opening a second
		 * suggestion over the same words. Nesting a new marker inside an
		 * existing one splits it into two disjoint `<mark>` elements sharing an
		 * id and leaves two notes claiming the same characters (#73411, finding
		 * F-06).
		 */
		const extendable = formatsAdditionRunToExtend(
			record.formats,
			edit.start,
			authorToken
		);
		if ( extendable ) {
			return {
				kind: 'insert',
				actions: [
					{
						type: 'grow-add',
						id: extendable.id,
						text: edit.insertedText,
						at: edit.start,
					},
				],
			};
		}
		/*
		 * Inside a marker this edit may not extend — a run proposed for
		 * deletion, or someone else's addition. Splitting it would fragment a
		 * marker whose accept/reject then acts on a partial range, so plan
		 * nothing and leave the call to the caller.
		 */
		const left =
			edit.start > 0 ? suggestionAt( record, edit.start - 1 ) : null;
		const right = suggestionAt( record, edit.start );
		if ( left && right && markerId( left ) === markerId( right ) ) {
			return { kind: 'insert', actions: [] };
		}
		const html = insertedRunHTML( nextRecord, edit );
		return {
			kind: 'insert',
			actions: [
				{
					type: 'insert-add',
					at: edit.start,
					text: edit.insertedText,
					...( html ? { html } : {} ),
					newNote: true,
				},
			],
		};
	}

	if ( edit.kind === 'delete' ) {
		if ( isUnmarked( edit.start, edit.end ) ) {
			return {
				kind: 'delete',
				actions: [
					{
						type: 'wrap-del',
						start: edit.start,
						end: edit.end,
						newNote: true,
					},
				],
			};
		}
		/*
		 * Already proposed for deletion: no marker action to plan. An empty
		 * plan reads as "not handled" to `maybeHandleContentEdit`, which
		 * returns false so the edit falls through to the attribute-overlay
		 * path and is captured there as a whole-attribute suggestion — the
		 * removal is neither applied in place nor silently discarded.
		 */
		if ( uniformMarker( edit.start, edit.end, SUGGESTION_TYPE_DELETION ) ) {
			return { kind: 'delete', actions: [] };
		}
		// The author removing their own pending addition: drop that marker.
		const addId = uniformMarker(
			edit.start,
			edit.end,
			SUGGESTION_TYPE_ADDITION
		);
		if ( addId !== null ) {
			return {
				kind: 'delete',
				actions: [ { type: 'remove-add', id: addId } ],
			};
		}
		// Mixed / straddling: leave to a later phase.
		return { kind: 'delete', actions: [] };
	}

	// replace (type-over): only the clean unmarked case for now.
	const replaceEdit = widenReplaceToWords(
		record.text,
		nextRecord ? nextRecord.text : '',
		edit,
		isUnmarked
	);
	if ( isUnmarked( replaceEdit.start, replaceEdit.end ) ) {
		// Widening moves both ends together, so the widened range still spans
		// exactly the inserted run in `nextRecord`.
		const html = insertedRunHTML( nextRecord, replaceEdit );
		return {
			kind: 'replace',
			actions: [
				{
					type: 'wrap-del',
					start: replaceEdit.start,
					end: replaceEdit.end,
					newNote: true,
				},
				{
					type: 'insert-add',
					at: replaceEdit.end,
					text: replaceEdit.insertedText,
					...( html ? { html } : {} ),
					newNote: true,
				},
			],
		};
	}
	return { kind: 'replace', actions: [] };
}

/**
 * Execute a marker plan against a value, returning the marked value. Pure: the
 * caller resolves note ids (creating one note per `newNote` action) and passes
 * them in `ids`, in the same order the actions appear; this only writes markers.
 *
 * `wrap-del` before `insert-add` in a replace is order-safe: wrapping existing
 * text doesn't change the value length, so a later action's offset stays valid.
 *
 * @param value            Block attribute value to mark (RichTextData or other).
 * @param actions          Plan from `planEditMarkers`.
 * @param options
 * @param options.authorId Author id stamped on new markers.
 * @param options.ids      Note ids for the `newNote` actions, in order.
 * @return The value with markers applied (unchanged when nothing applies).
 */
export function applyEditPlan(
	value: any,
	actions: MarkerAction[],
	{
		authorId,
		ids = [],
	}: { authorId?: number | string; ids?: Array< number | string > } = {}
): any {
	let result = value;
	let idIndex = 0;

	for ( const action of actions ) {
		switch ( action.type ) {
			case 'insert-add': {
				const id = ids[ idIndex++ ];
				result = insertInlineAddition( result, {
					text: action.text,
					html: action.html,
					attributes: buildSuggestionMarkerAttributes( {
						id,
						type: SUGGESTION_TYPE_ADDITION,
						authorId,
					} ),
					start: action.at,
					end: action.at,
				} );
				break;
			}
			case 'grow-add': {
				const range = findSuggestionRange( result, action.id! );
				if ( ! range ) {
					break;
				}
				result = growInlineAddition( result, {
					text: action.text!,
					attributes: buildSuggestionMarkerAttributes( {
						id: action.id!,
						type: SUGGESTION_TYPE_ADDITION,
						authorId,
					} ),
					markerStart: range.start,
					markerEnd: range.end,
					at: action.at,
				} );
				break;
			}
			case 'wrap-del': {
				const id = ids[ idIndex++ ];
				const wrapped = wrapInlineMarker( result, {
					formatType: SUGGESTION_FORMAT_NAME,
					attributes: buildSuggestionMarkerAttributes( {
						id,
						type: SUGGESTION_TYPE_DELETION,
						authorId,
					} ),
					start: action.start!,
					end: action.end!,
				} );
				if ( wrapped ) {
					result = wrapped;
				}
				break;
			}
			case 'remove-add': {
				result = rejectInlineAddition( result, action.id! );
				break;
			}
		}
	}

	return result;
}
