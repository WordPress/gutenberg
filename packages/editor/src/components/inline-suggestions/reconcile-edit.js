/**
 * WordPress dependencies
 */
import { RichTextData, create } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
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

/**
 * @typedef {Object} TextEdit
 * @property {'insert'|'delete'|'replace'|'none'} kind         What the edit did.
 * @property {number}                             start        Prev-value offset where the change starts.
 * @property {number}                             end          Prev-value offset where the changed (removed) region ends; equals `start` for a pure insert.
 * @property {string}                             insertedText Text present in next but not prev at the change.
 * @property {string}                             removedText  Text present in prev but not next at the change.
 */

/**
 * Reduce a previous/next plain-text pair to a single contiguous edit by trimming
 * the common prefix and suffix. A single user action (type, delete, cut, paste,
 * autocorrect, IME commit) changes one contiguous region, so prefix/suffix
 * trimming recovers it exactly without an O(n*m) diff.
 *
 * @param {string} prevText Text before the edit.
 * @param {string} nextText Text after the edit.
 * @return {TextEdit} The normalized edit.
 */
export function analyzeTextEdit( prevText, nextText ) {
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

	let kind;
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
 * Parse a block attribute value into a rich-text record, tolerating plain
 * strings and other non-rich values.
 *
 * @param {*} value Block attribute value.
 * @return {?Object} Rich-text record, or null when the value isn't rich text.
 */
function toRecord( value ) {
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
 * @param {Object} record Rich-text record.
 * @param {number} index  Character index.
 * @return {?Object} The suggestion format object (with `attributes`), or null.
 */
function suggestionAt( record, index ) {
	const stack = record.formats?.[ index ];
	if ( ! Array.isArray( stack ) ) {
		return null;
	}
	return stack.find( ( f ) => f.type === SUGGESTION_FORMAT_NAME ) ?? null;
}

function markerId( format ) {
	return format?.attributes?.[ SUGGESTION_ID_ATTRIBUTE ] ?? null;
}

function markerType( format ) {
	return format?.attributes?.[ SUGGESTION_TYPE_ATTRIBUTE ] ?? null;
}

/**
 * @typedef {Object} MarkerAction
 * @property {'insert-add'|'grow-add'|'wrap-del'|'remove-add'} type      Action kind.
 * @property {string}                                          [text]    Text to insert/append (insert-add, grow-add).
 * @property {number}                                          [at]      Insertion offset (insert-add).
 * @property {number}                                          [start]   Range start (wrap-del).
 * @property {number}                                          [end]     Range end (wrap-del).
 * @property {string}                                          [id]      Existing marker id to reuse (grow-add, remove-add).
 * @property {boolean}                                         [newNote] True when the action needs a freshly created note/id.
 */

/**
 * Decide how a text edit maps to inline-suggestion marker actions, against the
 * markers already present in the value. All offsets are in the *previous*
 * value, which is where the actions apply (the edit is re-expressed as markers
 * on the original text rather than committed as-is).
 *
 * Handled cleanly:
 *   - insert into unmarked text                       -> new `add` marker
 *   - insert at the trailing edge of the author's own
 *     open `add` marker                               -> grow that marker
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
 * @param {*}             prevValue          Block attribute value before the edit.
 * @param {*}             nextValue          Block attribute value after the edit.
 * @param {Object}        [options]
 * @param {number|string} [options.authorId] Current author id; gates growing/removing the author's own markers.
 * @return {{ kind: string, actions: MarkerAction[] }} The marker plan.
 */
export function planEditMarkers( prevValue, nextValue, { authorId } = {} ) {
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
	const uniformMarker = ( start, end, type ) => {
		if ( start >= end ) {
			return null;
		}
		let id = null;
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
	const isUnmarked = ( start, end ) => {
		for ( let i = start; i < end; i++ ) {
			if ( suggestionAt( record, i ) ) {
				return false;
			}
		}
		return true;
	};

	if ( edit.kind === 'insert' ) {
		const left =
			edit.start > 0 ? suggestionAt( record, edit.start - 1 ) : null;
		const right = suggestionAt( record, edit.start );
		const sameMarker =
			left && right && markerId( left ) === markerId( right );

		// Grow the author's own open addition when typing at its trailing edge
		// (left edge is that marker, the insertion point is past its end).
		const atAddTrailingEdge =
			left &&
			markerType( left ) === SUGGESTION_TYPE_ADDITION &&
			! sameMarker;
		if (
			atAddTrailingEdge &&
			( authorToken === null ||
				left.attributes?.[ 'data-author' ] === authorToken )
		) {
			return {
				kind: 'insert',
				actions: [
					{
						type: 'grow-add',
						id: markerId( left ),
						text: edit.insertedText,
					},
				],
			};
		}
		// Typing in the middle of an existing marker: leave to a later phase.
		if ( sameMarker ) {
			return { kind: 'insert', actions: [] };
		}
		return {
			kind: 'insert',
			actions: [
				{
					type: 'insert-add',
					at: edit.start,
					text: edit.insertedText,
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
		// Already proposed for deletion: nothing to do (the removal is rejected
		// by the caller re-rendering the un-applied value).
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
	if ( isUnmarked( edit.start, edit.end ) ) {
		return {
			kind: 'replace',
			actions: [
				{
					type: 'wrap-del',
					start: edit.start,
					end: edit.end,
					newNote: true,
				},
				{
					type: 'insert-add',
					at: edit.end,
					text: edit.insertedText,
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
 * @param {*}                    value              Block attribute value to mark (RichTextData or other).
 * @param {MarkerAction[]}       actions            Plan from `planEditMarkers`.
 * @param {Object}               [options]
 * @param {number|string}        [options.authorId] Author id stamped on new markers.
 * @param {Array<number|string>} [options.ids]      Note ids for the `newNote` actions, in order.
 * @return {*} The value with markers applied (unchanged when nothing applies).
 */
export function applyEditPlan( value, actions, { authorId, ids = [] } = {} ) {
	let result = value;
	let idIndex = 0;

	for ( const action of actions ) {
		switch ( action.type ) {
			case 'insert-add': {
				const id = ids[ idIndex++ ];
				result = insertInlineAddition( result, {
					text: action.text,
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
				const range = findSuggestionRange( result, action.id );
				if ( ! range ) {
					break;
				}
				result = growInlineAddition( result, {
					text: action.text,
					attributes: buildSuggestionMarkerAttributes( {
						id: action.id,
						type: SUGGESTION_TYPE_ADDITION,
						authorId,
					} ),
					markerStart: range.start,
					markerEnd: range.end,
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
					start: action.start,
					end: action.end,
				} );
				if ( wrapped ) {
					result = wrapped;
				}
				break;
			}
			case 'remove-add': {
				result = rejectInlineAddition( result, action.id );
				break;
			}
		}
	}

	return result;
}
