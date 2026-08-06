/**
 * The rebase engine and server ingest. See SPEC.md.
 *
 * One-sided transform: because the server assigns a total order, the only
 * property required is that rebasing a client's pending intents over the
 * acked slice (baseSeq, head] and appending them yields the server's
 * document. There is no pairwise peer merge and therefore no OT/TP2
 * obligation.
 *
 * Escalation implements the decided offline policy — never lose work, merge
 * what's clean, review what isn't. An escalated intent is not an error; it
 * is routed to the proposal lane, attributed to its author, for human
 * review.
 *
 * Same-actor rule: intents are authored sequentially per actor against local
 * state that already includes that actor's earlier intents, so both position
 * shifts and escalation checks skip priors from the same actor.
 */

import { locateBlock, subtreeContains } from './document.js';
import { IntentTypes, TEXT_INTENT_TYPES, withPayload } from './intents.js';
import { applyIntent, replay } from './reducer.js';

const clean = ( intent ) => ( { outcome: 'clean', intent } );
const escalate = ( intent, reason ) => ( {
	outcome: 'escalate',
	intent,
	reason,
} );
const voidOut = ( intent, reason ) => ( {
	outcome: 'void',
	intent,
	reason,
} );

/**
 * Every reason an intent can escalate. The escalation-soundness oracle
 * rejects any proposal whose reason is not in this set.
 */
export const ESCALATION_REASONS = new Set( [
	'target-deleted', // Rule 1.
	'range-crosses-split', // Rule 2 (known simplification).
	'concurrent-insert-in-range', // Rule 2.
	'position-in-deleted-range', // Rule 2.
	'concurrent-replace-overlap', // Rule 2.
	'content-replaced', // Rule 2 (coarse family).
	'merge-dropped-field', // Rule 2 (merge drops the absorbed block's other fields).
	'attr-conflict', // Rule 3.
	'property-conflict', // Rule 3 (entity property register analog).
	'frame-conflict', // Rule 5.
	'dependent-on-escalated', // Rule 6.
] );

/**
 * Block ids that must survive for the intent to remain applicable
 * (escalation rule 1: target or required ancestor deleted).
 *
 * @param {Object} intent Intent.
 * @return {string[]} Required block ids.
 */
function requiredTargets( intent ) {
	const { type, payload } = intent;
	switch ( type ) {
		case IntentTypes.SET_PROPERTY:
			// Entity properties target the document, not a block.
			return [];
		case IntentTypes.INSERT_BLOCK:
			return payload.parentId === null ? [] : [ payload.parentId ];
		case IntentTypes.MOVE_BLOCK:
			return payload.newParentId === null
				? [ payload.syncId ]
				: [ payload.syncId, payload.newParentId ];
		case IntentTypes.MERGE_BLOCKS:
			return [ payload.survivorId, payload.absorbedId ];
		default:
			return [ payload.syncId ];
	}
}

/**
 * Frame keys name text coordinate frames at FIELD granularity:
 * `syncId::field` for one named field, or a bare `syncId` for the whole
 * block (every field). Field granularity is the point of the field
 * dimension — concurrent edits to different fields of the same block must
 * never frame-conflict.
 *
 * Frame keys are derived from payloads only (never from document state), so
 * client prediction and server ingest compute identical keys regardless of
 * how log entries were delivered.
 *
 * @param {string} syncId Block id.
 * @param {string} field  Field name.
 * @return {string} Frame key.
 */
const fieldFrameKey = ( syncId, field ) => `${ syncId }::${ field }`;

/**
 * Whether two frame keys address overlapping text state. A block-wide key
 * (bare syncId) overlaps every field key of that block.
 *
 * @param {string} a Frame key.
 * @param {string} b Frame key.
 * @return {boolean} Whether the frames overlap.
 */
export function frameKeysOverlap( a, b ) {
	if ( a === b ) {
		return true;
	}
	return (
		( ! a.includes( '::' ) && b.startsWith( `${ a }::` ) ) ||
		( ! b.includes( '::' ) && a.startsWith( `${ b }::` ) )
	);
}

/**
 * Frame keys an intent READS — its payload carries offsets or lengths that
 * are only meaningful against a specific text state.
 *
 * `format_text` deliberately does not count: formats never escalate (spec),
 * so a format range under a stale frame may drift. That imprecision is
 * cosmetic and recoverable; content placement is not.
 *
 * @param {Object} intent Intent.
 * @return {string[]} Frame keys the payload depends on.
 */
export function frameReadTargets( intent ) {
	const { type, payload } = intent;
	switch ( type ) {
		case IntentTypes.INSERT_TEXT:
		case IntentTypes.DELETE_TEXT:
		case IntentTypes.REPLACE_TEXT:
		case IntentTypes.SPLIT_BLOCK:
			return [ fieldFrameKey( payload.syncId, payload.field ) ];
		case IntentTypes.MERGE_BLOCKS:
			// The join point is the survivor's live field length; the
			// absorbed block is read wholesale (its merged field's content
			// AND the fact that its other fields are droppable).
			return [
				fieldFrameKey( payload.survivorId, payload.field ),
				payload.absorbedId,
			];
		default:
			return [];
	}
}

/**
 * Frame keys an intent WRITES (shifts, splits, merges, or replaces),
 * invalidating offsets authored before it.
 *
 * @param {Object} intent Intent.
 * @return {string[]} Frame keys the intent changes.
 */
export function frameWriteTargets( intent ) {
	const { type, payload } = intent;
	switch ( type ) {
		case IntentTypes.INSERT_TEXT:
		case IntentTypes.DELETE_TEXT:
		case IntentTypes.REPLACE_TEXT:
		case IntentTypes.REPLACE_ATTR_CONTENT:
			return [ fieldFrameKey( payload.syncId, payload.field ) ];
		case IntentTypes.SPLIT_BLOCK:
			return [
				fieldFrameKey( payload.syncId, payload.field ),
				fieldFrameKey( payload.newSyncId, payload.field ),
			];
		case IntentTypes.MERGE_BLOCKS:
			// The whole absorbed block disappears (all fields).
			return [
				fieldFrameKey( payload.survivorId, payload.field ),
				payload.absorbedId,
			];
		default:
			return [];
	}
}

function collectBlockIds( blockPayload, into ) {
	into.push( blockPayload.syncId );
	for ( const child of blockPayload.children ?? [] ) {
		collectBlockIds( child, into );
	}
	return into;
}

/**
 * Block ids an intent brings into existence. If the intent does not apply,
 * these ids exist only in its author's local (phantom) state.
 *
 * @param {Object} intent Intent.
 * @return {string[]} Created block ids.
 */
export function createdIds( intent ) {
	if ( intent.type === IntentTypes.INSERT_BLOCK ) {
		return collectBlockIds( intent.payload.block, [] );
	}
	if ( intent.type === IntentTypes.SPLIT_BLOCK ) {
		return [ intent.payload.newSyncId ];
	}
	return [];
}

/**
 * Per-batch frame state for one actor's sequentially authored intents.
 *
 * The authoring model: each intent in a batch was authored against local
 * state that already includes every earlier intent in the batch. The
 * one-sided transform is therefore only sound for an intent whose text
 * coordinates are still expressed in the server's frame. This state tracks,
 * per frame key (block field, or whole block — see fieldFrameKey), whether
 * the author's local text frame has diverged:
 *
 * - `ownWrites`: frame key → { state: 'applied' } (earlier own frame write
 *   accepted; the server frame matches the author's local frame for that
 *   key as long as no OTHER actor also wrote it) or
 *   { state: 'phantom', atSeq } (an earlier own frame write escalated or
 *   voided — the author's local frame contains an effect the server never
 *   applied). `atSeq` is the log index of the entry that settled the phantom:
 *   a well-behaved client observes that entry, drops the phantom from its
 *   local state, and re-authors on a clean frame — so the phantom only
 *   poisons intents whose baseSeq predates it. Lookups are overlap-aware
 *   (a whole-block key covers all of its field keys).
 * - `broken`: block id → atSeq for blocks created by intents that did not
 *   apply. Anything addressing them (with a baseSeq predating the
 *   settlement) references structure the server never had.
 *
 * @return {Object} Frame state.
 */
export function createFrameState() {
	return { ownWrites: new Map(), broken: new Map() };
}

/**
 * Intra-unit frame conflict: unit member `index` reads a text frame that an
 * EARLIER member of the same unit writes. Its coordinates assume that write;
 * if another actor also wrote the block concurrently, the one-sided
 * transform cannot reconcile the frames and the unit must escalate.
 *
 * Deliberately delivery-independent: it uses only the members' authored
 * payloads and remote-write log positions relative to the member's baseSeq,
 * so client prediction and server ingest compute it identically no matter
 * how log entries were batched on the way to the client. (Dependence on an
 * earlier member that fails outright needs no check here — rule 4 already
 * escalates the whole unit.)
 *
 * @param {Object[]} members        The unit's intents, ORIGINAL payloads.
 * @param {number}   index          Member being checked.
 * @param {Function} firstRemoteSeq ( frameKey ) → first overlapping
 *                                  other-actor frame write at/after the
 *                                  member's baseSeq, or null.
 * @return {number|null} The conflicting remote write's log index, or null.
 */
export function intraUnitConflictSeq( members, index, firstRemoteSeq ) {
	const priorWrites = new Set();
	for ( let k = 0; k < index; k++ ) {
		for ( const id of frameWriteTargets( members[ k ] ) ) {
			priorWrites.add( id );
		}
	}
	let best = null;
	for ( const key of frameReadTargets( members[ index ] ) ) {
		if (
			! [ ...priorWrites ].some( ( prior ) =>
				frameKeysOverlap( prior, key )
			)
		) {
			continue;
		}
		const seq = firstRemoteSeq( key );
		if ( seq !== null && ( best === null || seq < best ) ) {
			best = seq;
		}
	}
	return best;
}

/**
 * The canonical rule-4 settle outcome for a unit: the escalated member with
 * the LOWEST trigger position (ties broken by unit order). A client absorbs
 * the log in arbitrary chunks and settles the unit the moment it observes
 * the earliest trigger, so any other choice would be delivery-dependent and
 * break prediction parity.
 *
 * @param {Object[]} outcomes    Per-member outcomes carrying
 *                               { outcome|kind, atSeq }.
 * @param {Function} isEscalated ( outcome ) → boolean.
 * @return {Object|null} The settling outcome, or null.
 */
export function unitEscalation( outcomes, isEscalated ) {
	let best = null;
	for ( const outcome of outcomes ) {
		if ( ! isEscalated( outcome ) ) {
			continue;
		}
		if ( best === null || outcome.atSeq < best.atSeq ) {
			best = outcome;
		}
	}
	return best;
}

/**
 * Escalation rules 5 and 6: returns { reason, atSeq } if the intent's
 * coordinates or targets are unsound under the batch's frame state, else
 * null.
 *
 * Rule 5 (`frame-conflict`): the intent reads a text frame that BOTH an
 * earlier own applied intent and another actor's concurrent intent have
 * written. The one-sided transform cannot express both shifts (that would
 * require a two-sided OT with TP-1 obligations), so the intent is parked
 * for review instead of being silently misplaced.
 *
 * Rule 6 (`dependent-on-escalated`): the intent depends on an earlier own
 * intent that did not apply — it reads a frame containing a phantom write,
 * or addresses a block only a phantom intent created. Scoped by baseSeq:
 * an intent authored AFTER its author observed the settling entry was
 * authored on a frame with the phantom already dropped, and is clean.
 *
 * @param {Object}   frame          Frame state (createFrameState).
 * @param {Object}   intent         Intent, with its ORIGINAL payload.
 * @param {Function} firstRemoteSeq ( frameKey ) → log index of the first
 *                                  overlapping other-actor frame write at
 *                                  or after intent.baseSeq, or null.
 * @return {Object|null} { reason, atSeq }, or null.
 */
export function frameEscalation( frame, intent, firstRemoteSeq ) {
	for ( const id of requiredTargets( intent ) ) {
		const brokenAt = frame.broken.get( id );
		if ( brokenAt !== undefined && intent.baseSeq <= brokenAt ) {
			return { reason: 'dependent-on-escalated', atSeq: brokenAt };
		}
	}
	for ( const key of frameReadTargets( intent ) ) {
		// Overlap-aware lookup: a block-wide write covers every field key
		// of that block and vice versa.
		let phantomAt = null;
		let hasApplied = false;
		for ( const [ ownKey, own ] of frame.ownWrites ) {
			if ( ! frameKeysOverlap( ownKey, key ) ) {
				continue;
			}
			if ( own.state === 'phantom' && intent.baseSeq <= own.atSeq ) {
				phantomAt = Math.max( phantomAt ?? -1, own.atSeq );
			} else if ( own.state === 'applied' ) {
				hasApplied = true;
			}
		}
		if ( phantomAt !== null ) {
			return { reason: 'dependent-on-escalated', atSeq: phantomAt };
		}
		if ( hasApplied ) {
			const remoteAt = firstRemoteSeq( key );
			if ( remoteAt !== null ) {
				return { reason: 'frame-conflict', atSeq: remoteAt };
			}
		}
	}
	return null;
}

/**
 * Records an intent's terminal outcome into the batch frame state.
 *
 * Phantom marks are sticky and keep the LATEST settling position: an intent
 * is poisoned if any phantom it could have observed locally settled at or
 * after its baseSeq.
 *
 * A clean-rebased intent that the reducer then voids at apply time counts as
 * applied here: the void is deterministic on the shared sequence, so both
 * sides drop the effect identically, and any text-frame divergence it could
 * mask is already caught by the frame-conflict rule.
 *
 * @param {Object}      frame   Frame state.
 * @param {Object}      intent  Intent, with its ORIGINAL payload.
 * @param {boolean}     applied Whether the intent survived rebase cleanly.
 * @param {number|null} atSeq   Log index of the settling entry when not
 *                              applied.
 */
export function recordFrameOutcome( frame, intent, applied, atSeq = null ) {
	for ( const id of frameWriteTargets( intent ) ) {
		const current = frame.ownWrites.get( id );
		if ( ! applied ) {
			const seq = Math.max( atSeq ?? 0, current?.atSeq ?? -1 );
			frame.ownWrites.set( id, { state: 'phantom', atSeq: seq } );
		} else if ( current?.state !== 'phantom' ) {
			frame.ownWrites.set( id, { state: 'applied' } );
		}
	}
	if ( ! applied ) {
		for ( const id of createdIds( intent ) ) {
			frame.broken.set(
				id,
				Math.max( atSeq ?? 0, frame.broken.get( id ) ?? -1 )
			);
		}
	}
}

// A point position carried by the intent, or null.
function pointOf( intent ) {
	if ( intent.type === IntentTypes.INSERT_TEXT ) {
		return intent.payload.offset;
	}
	if ( intent.type === IntentTypes.SPLIT_BLOCK ) {
		return intent.payload.offset;
	}
	return null;
}

function withPoint( intent, point ) {
	return withPayload( intent, { offset: point } );
}

function hasRange( intent ) {
	return (
		intent.type === IntentTypes.DELETE_TEXT ||
		intent.type === IntentTypes.FORMAT_TEXT ||
		intent.type === IntentTypes.REPLACE_TEXT
	);
}

/**
 * Whether the intent carries text coordinates in the given block and field
 * (text family ops and split; the ops whose payloads a concurrent frame
 * write can invalidate).
 *
 * @param {Object} intent Intent.
 * @param {string} syncId Block id.
 * @param {string} field  Field name.
 * @return {boolean} Whether the intent targets that exact text frame.
 */
function targetsTextOf( intent, syncId, field ) {
	return (
		( TEXT_INTENT_TYPES.has( intent.type ) ||
			intent.type === IntentTypes.SPLIT_BLOCK ) &&
		intent.payload.syncId === syncId &&
		intent.payload.field === field
	);
}

/**
 * Whether the intent addresses any text content of the given block,
 * whatever the field (used when the whole block disappears in a merge).
 *
 * @param {Object} intent Intent.
 * @param {string} syncId Block id.
 * @return {boolean} Whether the intent targets any field of that block.
 */
function targetsAnyTextOf( intent, syncId ) {
	return (
		( TEXT_INTENT_TYPES.has( intent.type ) ||
			intent.type === IntentTypes.SPLIT_BLOCK ||
			intent.type === IntentTypes.REPLACE_ATTR_CONTENT ) &&
		intent.payload.syncId === syncId
	);
}

/**
 * Transforms `intent` over one accepted prior from another actor.
 *
 * @param {Object} intent Intent being rebased.
 * @param {Object} prior  Accepted prior intent (other actor).
 * @param {Object} doc    Document state immediately BEFORE `prior` applied
 *                        (needed for subtree checks and actual merge
 *                        offsets).
 * @return {Object} { outcome: 'clean'|'escalate'|'void', intent, reason? }.
 */
function transformOne( intent, prior, doc ) {
	const { type, payload } = intent;
	const priorPayload = prior.payload;

	switch ( prior.type ) {
		case IntentTypes.REMOVE_BLOCK: {
			const removed = locateBlock( doc, priorPayload.syncId );
			if ( ! removed ) {
				return clean( intent );
			}
			for ( const id of requiredTargets( intent ) ) {
				if ( subtreeContains( removed.block, id ) ) {
					if (
						type === IntentTypes.REMOVE_BLOCK &&
						id === payload.syncId
					) {
						return voidOut( intent, 'already-removed' );
					}
					return escalate( intent, 'target-deleted' );
				}
			}
			return clean( intent );
		}

		case IntentTypes.SPLIT_BLOCK: {
			// Only the split field's coordinates move; intents on the same
			// block's OTHER fields stay whole on the head — clean.
			if (
				! targetsTextOf(
					intent,
					priorPayload.syncId,
					priorPayload.field
				)
			) {
				return clean( intent );
			}
			const splitAt = priorPayload.offset;
			const point = pointOf( intent );
			if ( point !== null ) {
				if ( point < splitAt ) {
					return clean( intent );
				}
				return clean(
					withPayload( intent, {
						syncId: priorPayload.newSyncId,
						offset: point - splitAt,
					} )
				);
			}
			if ( hasRange( intent ) ) {
				const { start, end } = payload;
				if ( end <= splitAt ) {
					return clean( intent );
				}
				if ( start >= splitAt ) {
					return clean(
						withPayload( intent, {
							syncId: priorPayload.newSyncId,
							start: start - splitAt,
							end: end - splitAt,
						} )
					);
				}
				if ( intent.type === IntentTypes.FORMAT_TEXT ) {
					// Formats never escalate: clip to the first half. The
					// tail's missing/lingering formatting is cosmetic drift,
					// documented as a known simplification.
					return clean( withPayload( intent, { end: splitAt } ) );
				}
				// Known simplification: a destructive range crossing a
				// concurrent split point escalates rather than dividing
				// into two intents.
				return escalate( intent, 'range-crosses-split' );
			}
			return clean( intent );
		}

		case IntentTypes.MERGE_BLOCKS: {
			if ( ! targetsAnyTextOf( intent, priorPayload.absorbedId ) ) {
				/*
				 * The merge consumes the absorbed block (and its subtree):
				 * identity-addressed intents on it — attr writes, moves,
				 * transforms, inserts anchored under it — reference
				 * structure the log dropped. Mirroring the remove_block
				 * prior (rule 1), they escalate rather than silently void
				 * at apply time: the drop must never swallow another
				 * actor's work. The one idempotent case: a concurrent merge
				 * of the SAME pair already achieved this intent's effect —
				 * nothing was lost, so it voids.
				 */
				if (
					type === IntentTypes.MERGE_BLOCKS &&
					payload.absorbedId === priorPayload.absorbedId &&
					payload.survivorId === priorPayload.survivorId
				) {
					return voidOut( intent, 'already-merged' );
				}
				const absorbedLocation = locateBlock(
					doc,
					priorPayload.absorbedId
				);
				if ( absorbedLocation ) {
					for ( const id of requiredTargets( intent ) ) {
						if ( subtreeContains( absorbedLocation.block, id ) ) {
							return escalate( intent, 'target-deleted' );
						}
					}
				}
				return clean( intent );
			}
			// Intents on the absorbed block's OTHER fields (or a wholesale
			// field rewrite) address content the merge dropped — the drop
			// must not silently swallow another actor's work.
			if (
				intent.type === IntentTypes.REPLACE_ATTR_CONTENT ||
				payload.field !== priorPayload.field
			) {
				return escalate( intent, 'merge-dropped-field' );
			}
			// The merged field follows the content across the join. The
			// reducer joins at the survivor field's actual length; read it
			// from the document state before the merge applied.
			const survivor = locateBlock( doc, priorPayload.survivorId );
			const absorbed = locateBlock( doc, priorPayload.absorbedId );
			if ( ! survivor || ! absorbed ) {
				return clean( intent );
			}
			const joinOffset =
				survivor.block.fields[ priorPayload.field ]?.text.length ?? 0;
			const point = pointOf( intent );
			if ( point !== null ) {
				return clean(
					withPayload( intent, {
						syncId: priorPayload.survivorId,
						offset: point + joinOffset,
					} )
				);
			}
			if ( hasRange( intent ) ) {
				return clean(
					withPayload( intent, {
						syncId: priorPayload.survivorId,
						start: payload.start + joinOffset,
						end: payload.end + joinOffset,
					} )
				);
			}
			return clean( intent );
		}

		case IntentTypes.INSERT_TEXT: {
			if (
				! targetsTextOf(
					intent,
					priorPayload.syncId,
					priorPayload.field
				)
			) {
				return clean( intent );
			}
			const at = priorPayload.offset;
			const length = priorPayload.text.length;
			const point = pointOf( intent );
			if ( point !== null ) {
				// Ties resolve by log order: the earlier-accepted insert
				// shifts the later one; runs never interleave.
				if ( at <= point ) {
					return clean( withPoint( intent, point + length ) );
				}
				return clean( intent );
			}
			const { start, end } = payload;
			if ( at <= start ) {
				return clean(
					withPayload( intent, {
						start: start + length,
						end: end + length,
					} )
				);
			}
			if ( at >= end ) {
				return clean( intent );
			}
			// Another actor inserted inside our range.
			if ( intent.type === IntentTypes.FORMAT_TEXT ) {
				return clean( withPayload( intent, { end: end + length } ) );
			}
			return escalate( intent, 'concurrent-insert-in-range' );
		}

		case IntentTypes.DELETE_TEXT:
		case IntentTypes.REPLACE_TEXT: {
			if (
				! targetsTextOf(
					intent,
					priorPayload.syncId,
					priorPayload.field
				)
			) {
				return clean( intent );
			}
			const ds = priorPayload.start;
			const de = priorPayload.end;
			const removed = de - ds;
			const inserted =
				prior.type === IntentTypes.REPLACE_TEXT
					? priorPayload.text.length
					: 0;
			const isReplace = prior.type === IntentTypes.REPLACE_TEXT;
			const mapPosition = ( position ) => {
				if ( position <= ds ) {
					return position;
				}
				if ( position >= de ) {
					return position - removed + inserted;
				}
				return null; // Inside the destroyed range.
			};
			const point = pointOf( intent );
			if ( point !== null ) {
				const mapped = mapPosition( point );
				if ( mapped === null ) {
					return escalate( intent, 'position-in-deleted-range' );
				}
				return clean( withPoint( intent, mapped ) );
			}
			const { start, end } = payload;
			if ( end <= ds || start >= de ) {
				// Disjoint: pure shift.
				const shift = ( position ) =>
					position >= de ? position - removed + inserted : position;
				return clean(
					withPayload( intent, {
						start: shift( start ),
						end: shift( end ),
					} )
				);
			}
			// Overlapping ranges.
			if ( isReplace || intent.type === IntentTypes.REPLACE_TEXT ) {
				return escalate( intent, 'concurrent-replace-overlap' );
			}
			// delete/format vs delete: set difference is clean.
			const mappedStart = mapPosition( start ) ?? ds;
			const mappedEnd = mapPosition( end ) ?? ds;
			if ( mappedEnd <= mappedStart ) {
				return voidOut( intent, 'already-deleted' );
			}
			return clean(
				withPayload( intent, {
					start: mappedStart,
					end: mappedEnd,
				} )
			);
		}

		case IntentTypes.REPLACE_ATTR_CONTENT: {
			// Field-scoped: a wholesale rewrite of one field leaves
			// concurrent edits to the block's other fields untouched.
			if (
				targetsTextOf( intent, priorPayload.syncId, priorPayload.field )
			) {
				return escalate( intent, 'content-replaced' );
			}
			if (
				intent.type === IntentTypes.REPLACE_ATTR_CONTENT &&
				payload.syncId === priorPayload.syncId &&
				payload.field === priorPayload.field
			) {
				return escalate( intent, 'content-replaced' );
			}
			return clean( intent );
		}

		case IntentTypes.SET_ATTR:
		case IntentTypes.REMOVE_ATTR: {
			const intentIsMapWrite =
				type === IntentTypes.SET_ATTR ||
				type === IntentTypes.REMOVE_ATTR;
			if (
				intentIsMapWrite &&
				payload.syncId === priorPayload.syncId &&
				payload.key === priorPayload.key
			) {
				// Escalation rule 3: the per-key register saw a write this
				// intent did not observe.
				return escalate( intent, 'attr-conflict' );
			}
			return clean( intent );
		}

		case IntentTypes.SET_PROPERTY: {
			if (
				type === IntentTypes.SET_PROPERTY &&
				payload.name === priorPayload.name
			) {
				// Escalation rule 3, entity analog: the per-property register
				// saw a write this intent did not observe.
				return escalate( intent, 'property-conflict' );
			}
			return clean( intent );
		}

		// insert_block, move_block, transform_block, format_text: never
		// invalidate concurrent intents (identity addressing; formats do not
		// shift text).
		default:
			return clean( intent );
	}
}

/**
 * Rebases one intent over the accepted slice (intent.baseSeq, head].
 *
 * @param {Object}   intent    Intent to rebase.
 * @param {Object[]} priors    Accepted intents after startSeq, in log order.
 * @param {Object}   docAtBase Document at startSeq.
 * @param {number}   startSeq  Log index of priors[0] (defaults to
 *                             intent.baseSeq). Non-clean outcomes carry
 *                             `atSeq`, the absolute log index of the prior
 *                             that settled them.
 * @return {Object} { outcome: 'clean'|'escalate'|'void', intent, reason?,
 *                  atSeq? }.
 */
export function rebaseIntent( intent, priors, docAtBase, startSeq = null ) {
	const base = startSeq ?? intent.baseSeq;
	let current = intent;
	let doc = docAtBase;
	for ( let i = 0; i < priors.length; i++ ) {
		const prior = priors[ i ];
		if ( prior.actorId !== intent.actorId ) {
			const result = transformOne( current, prior, doc );
			if ( result.outcome !== 'clean' ) {
				return { ...result, atSeq: base + i };
			}
			current = result.intent;
		}
		( { doc } = applyIntent( doc, prior ) );
	}
	return clean( current );
}

/**
 * Creates a server: the single ordering and trust authority.
 *
 * @param {Object} initialDoc Genesis document (server-owned).
 * @param {number} [firstSeq] Engine seq of the initial document (> 0 when
 *                            reconstructed from a compaction checkpoint).
 * @return {Object} Server state.
 */
export function createServer( initialDoc, firstSeq = 0 ) {
	return {
		initialDoc,
		// Engine seq of log[0]; > 0 when initialized from a compaction
		// checkpoint rather than genesis.
		firstSeq,
		log: [],
		proposals: [],
		dispositions: new Map(),
		// seq → document snapshot. Append-only log makes entries permanently
		// valid; callers must treat returned documents as read-only.
		docCache: new Map( [ [ firstSeq, initialDoc ] ] ),
	};
}

/**
 * Document state at a given log position. Cached: computes forward from the
 * nearest earlier snapshot, so repeated ingests stay linear instead of
 * replaying from genesis each time.
 *
 * @param {Object} server Server.
 * @param {number} seq    Log position (0 = genesis).
 * @return {Object} Document (read-only — do not mutate).
 */
export function serverDocAt( server, seq ) {
	const cached = server.docCache.get( seq );
	if ( cached ) {
		return cached;
	}
	// The log array holds entries [firstSeq ..); replicas initialized from a
	// checkpoint (server compaction) have firstSeq > 0. Absolute seqs are
	// the public coordinate; array indices are translated here only.
	const firstSeq = server.firstSeq ?? 0;
	let nearest = firstSeq;
	for ( const key of server.docCache.keys() ) {
		if ( key <= seq && key > nearest ) {
			nearest = key;
		}
	}
	const doc = replay(
		server.docCache.get( nearest ),
		server.log.slice( nearest - firstSeq, seq - firstSeq )
	);
	server.docCache.set( seq, doc );
	return doc;
}

/**
 * Groups a batch into atomic units.
 *
 * @param {Object[]} intents Intents in authoring order.
 * @return {Object[][]} Units: contiguous runs sharing a txnId, singletons
 *                      otherwise. Shared by server ingest and the client's
 *                      prediction path so both resolve rule 4 identically.
 */
export function groupUnits( intents ) {
	const units = [];
	for ( const intent of intents ) {
		const last = units.at( -1 );
		if (
			intent.txnId !== null &&
			last &&
			last[ 0 ].txnId === intent.txnId
		) {
			last.push( intent );
		} else {
			units.push( [ intent ] );
		}
	}
	return units;
}

/**
 * Plans one client's batch against a log: THE shared deterministic core.
 *
 * Pure function of (units, log, docAt): no server state, no side effects.
 * The server commits a plan's rows at ingest; a caught-up client runs the
 * SAME function over its log copy to predict dispositions and build its
 * optimistic document — prediction parity holds by construction, and the
 * simulator's prediction oracle guards that construction. The future PHP
 * twin mirrors exactly this function.
 *
 * Per intent, in batch order: frame check (rules 5/6, against the batch
 * frame state), intra-unit frame check, then rebase over the slice
 * (baseSeq, head]; rule 4 settles each unit atomically under its canonical
 * (lowest-trigger) escalation; surviving intents apply in order to the head
 * document.
 *
 * @param {Object[][]} units      Batch grouped into units (groupUnits), in
 *                                authoring order.
 * @param {Object[]}   log        Accepted log (the batch's intents NOT
 *                                included).
 * @param {Function}   docAt      ( seq ) → document at that log position
 *                                (read-only).
 * @param {number}     [firstSeq] Engine seq of log[0]; callers guarantee
 *                                every intent's baseSeq >= firstSeq.
 * @return {Object} { rows, headDoc }. Each row:
 *                  { intent, disposition, accepted, proposal } — `accepted`
 *                  is the transformed intent to append (null if not
 *                  accepted), `proposal` the proposal-lane record (null if
 *                  not escalated).
 */
export function planBatch( units, log, docAt, firstSeq = 0 ) {
	// Frame state spans the whole batch: one client's sequential authoring.
	const frame = createFrameState();
	const rows = [];
	let headDoc = docAt( firstSeq + log.length );
	for ( const unit of units ) {
		const rebased = [];
		for ( let j = 0; j < unit.length; j++ ) {
			const intent = unit[ j ];
			// Callers guarantee baseSeq >= firstSeq (the server rejects or
			// stale-voids intents older than its retention horizon).
			const slice = log.slice( intent.baseSeq - firstSeq );
			const firstRemoteSeq = ( key ) => {
				const index = slice.findIndex(
					( entry ) =>
						entry.actorId !== intent.actorId &&
						frameWriteTargets( entry ).some( ( written ) =>
							frameKeysOverlap( written, key )
						)
				);
				return index === -1 ? null : intent.baseSeq + index;
			};
			const frameProblem = frameEscalation(
				frame,
				intent,
				firstRemoteSeq
			);
			const conflictSeq = frameProblem
				? null
				: intraUnitConflictSeq( unit, j, firstRemoteSeq );
			let result;
			if ( frameProblem ) {
				result = {
					...escalate( intent, frameProblem.reason ),
					atSeq: frameProblem.atSeq,
				};
			} else if ( conflictSeq !== null ) {
				result = {
					...escalate( intent, 'frame-conflict' ),
					atSeq: conflictSeq,
				};
			} else {
				result = rebaseIntent( intent, slice, docAt( intent.baseSeq ) );
			}
			rebased.push( result );
		}
		const escalation = unitEscalation(
			rebased,
			( result ) => result.outcome === 'escalate'
		);
		for ( let j = 0; j < unit.length; j++ ) {
			const intent = unit[ j ];
			const result = rebased[ j ];
			let disposition = null;
			let accepted = null;
			let proposal = null;
			if ( escalation ) {
				// Rule 4: the unit escalates together, attributed to its
				// author, carrying the transformed intents for review.
				disposition = {
					status: 'escalated',
					reason: escalation.reason,
				};
				proposal = {
					intent: result.intent,
					actorId: intent.actorId,
					reason: escalation.reason,
				};
			} else if ( result.outcome === 'void' ) {
				disposition = { status: 'voided', reason: result.reason };
			} else {
				const applied = applyIntent( headDoc, result.intent );
				headDoc = applied.doc;
				accepted = result.intent;
				disposition =
					applied.disposition.status === 'applied'
						? { status: 'applied' }
						: {
								status: 'voided',
								reason: applied.disposition.reason,
						  };
			}
			// Apply-time voids count as applied for frame purposes (see
			// recordFrameOutcome); rebase-level escalations and voids are
			// phantoms, settled at the log position that triggered them.
			const frameApplied =
				disposition.status === 'applied' ||
				( disposition.status === 'voided' &&
					result.outcome === 'clean' );
			recordFrameOutcome(
				frame,
				intent,
				frameApplied,
				( escalation ? escalation.atSeq : result.atSeq ) ?? null
			);
			rows.push( { intent, disposition, accepted, proposal } );
		}
	}
	return { rows, headDoc };
}

/**
 * Ingests a batch of intents from one client, in authoring order: plans the
 * fresh intents with planBatch and commits the plan.
 *
 * Contiguous intents sharing a txnId form an atomic unit: if any member
 * escalates, the whole unit escalates (rule 4) and none of it is applied.
 * Ingest is idempotent per intentId (at-least-once transport is safe) —
 * freshness is filtered within units so a redelivered prefix cannot fuse
 * two distinct units.
 *
 * In production, actorId is stamped here from the authenticated request;
 * the prototype trusts the envelope because the simulator plays both roles.
 *
 * @param {Object}   server  Server.
 * @param {Object[]} intents Intents in authoring order.
 * @return {Object[]} Dispositions, one per intent.
 */
export function serverIngestBatch( server, intents ) {
	// Optional transcript recorder (see tools/generate-planner-vectors.js):
	// captures every ingest batch so a twin implementation can replay the
	// exact call sequence against frozen expectations.
	if ( server.recorder ) {
		server.recorder.push( intents );
	}
	// Idempotency covers duplicates WITHIN one batch too, not only
	// redeliveries of settled intents: without the in-batch set, a batch
	// containing the same intentId twice would double-apply (the settled
	// map is only populated after planning).
	const seenInBatch = new Set();
	const units = groupUnits( intents )
		.map( ( unit ) =>
			unit.filter( ( intent ) => {
				if (
					server.dispositions.has( intent.intentId ) ||
					seenInBatch.has( intent.intentId )
				) {
					return false;
				}
				seenInBatch.add( intent.intentId );
				return true;
			} )
		)
		.filter( ( unit ) => unit.length > 0 );
	const { rows, headDoc } = planBatch(
		units,
		server.log,
		( seq ) => serverDocAt( server, seq ),
		server.firstSeq ?? 0
	);
	for ( const row of rows ) {
		server.dispositions.set( row.intent.intentId, row.disposition );
		if ( row.proposal ) {
			server.proposals.push( row.proposal );
		}
		if ( row.accepted ) {
			server.log.push( row.accepted );
		}
	}
	server.docCache.set(
		( server.firstSeq ?? 0 ) + server.log.length,
		headDoc
	);
	return intents.map( ( intent ) =>
		server.dispositions.get( intent.intentId )
	);
}
