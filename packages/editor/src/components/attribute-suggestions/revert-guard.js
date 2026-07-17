/**
 * Identity-token guard for the attribute-suggestion revert loop (Phase 3 of the
 * overlay-retirement work, #73411).
 *
 * The attribute shim keeps the post clean by reverting a block's non-content
 * attribute change back to its baseline while the proposed value lives in the
 * overlay. That revert is itself a store dispatch, which the shim's own
 * subscribe would observe and try to process again. The old overlay suppressed
 * this with a coarse boolean `isReverting` window: it swallowed EVERY subscribe
 * fire for the duration of the revert dispatch. That window is fragile
 * (structural problem #2) -- an unrelated change landing in the same tick is
 * lost, and a batched or delayed echo can slip past a window that has already
 * closed.
 *
 * This replaces the time window with per-revert identity tokens. Before
 * dispatching a revert, the shim records a token describing exactly what that
 * revert will make true (the block clientId plus each attribute key's restored
 * value). When the subscribe fires, a change is recognized as the shim's own
 * revert echo only when it matches a pending token exactly, and the token is
 * then consumed. Unrelated changes are never swallowed, and an echo is caught
 * whenever it arrives rather than only inside a fixed window.
 *
 * Pure and store-free: the caller supplies the equality function (so this
 * doesn't depend on the interceptor's attribute comparison) and drives
 * `expect` / `isEcho` from its own subscribe loop.
 *
 * Known limitation: echo recognition is value matching, not event identity.
 * A legitimate concurrent edit that happens to set exactly the values a
 * pending revert was going to restore is indistinguishable from the revert's
 * echo and will consume the token (the edit is then treated as the shim's own
 * write and skipped). The caller narrows the exposure by consuming tokens as
 * soon as the echo is observed and by the bounded per-block queue below —
 * a token that never sees its echo is evicted FIFO once the queue exceeds
 * `MAX_PENDING_TOKENS`, so it can't linger forever waiting to misclassify a
 * future same-value edit.
 */

/**
 * Per-block cap on pending revert tokens. Echoes normally arrive within the
 * same dispatch (or the next batched flush), so more than a handful of
 * outstanding tokens for one block means echoes are never arriving — evicting
 * the oldest keeps a stuck token from poisoning future matches.
 */
export const MAX_PENDING_TOKENS = 20;

/**
 * Strict-equality fallback used when the caller doesn't supply a comparison.
 * Real callers pass a structural comparator (e.g. the interceptor's
 * `shallowAttributeEquals`) so object-valued attributes compare by value.
 *
 * @param {*} a First value.
 * @param {*} b Second value.
 * @return {boolean} True when strictly equal.
 */
function strictEquals( a, b ) {
	return a === b;
}

/**
 * Build a revert token: the block clientId plus a snapshot of the attribute
 * values the revert will restore. `restore` is the `{ key: value }` payload
 * passed to `updateBlockAttributes`; a value of `undefined` means the key is
 * expected to be absent after the revert.
 *
 * @param {string} clientId Block client id being reverted.
 * @param {Object} restore  Attribute values the revert sets.
 * @return {{ clientId: string, values: Object }} The token.
 */
export function createRevertToken( clientId, restore ) {
	return { clientId, values: { ...restore } };
}

/**
 * Whether a block's current attributes satisfy a token — i.e. every restored
 * key now holds the value the revert was going to set. A match means the
 * observed change is the revert's own echo.
 *
 * Only the keys the revert touched are checked; other attributes may legitimately
 * differ (a concurrent edit to an unrelated key) without breaking the match.
 *
 * @param {{ clientId: string, values: Object }} token             Token from `createRevertToken`.
 * @param {string}                               clientId          The block that changed.
 * @param {Object}                               currentAttributes The block's live attributes.
 * @param {Function}                             [equals]          Value comparison; defaults to strict.
 * @return {boolean} True when the change matches the token.
 */
export function matchesRevertToken(
	token,
	clientId,
	currentAttributes,
	equals = strictEquals
) {
	if ( ! token || token.clientId !== clientId ) {
		return false;
	}
	for ( const key of Object.keys( token.values ) ) {
		if ( ! equals( token.values[ key ], currentAttributes?.[ key ] ) ) {
			return false;
		}
	}
	return true;
}

/**
 * Create a revert guard: a small stateful helper that tracks pending revert
 * tokens per block and recognizes (and consumes) their echoes.
 *
 * Usage from a subscribe loop:
 *   const guard = createRevertGuard( shallowAttributeEquals );
 *   // before dispatching the revert:
 *   guard.expect( clientId, restore );
 *   dispatch.updateBlockAttributes( clientId, restore );
 *   // inside subscribe, for each changed block:
 *   if ( guard.isEcho( clientId, currentAttributes ) ) continue;
 *
 * @param {Function} [equals] Value comparison for matching; defaults to strict.
 * @return {{
 *   expect:  ( clientId: string, restore: Object ) => void,
 *   isEcho:  ( clientId: string, currentAttributes: Object ) => boolean,
 *   pending: ( clientId: string ) => number,
 *   size:    () => number,
 *   clear:   () => void,
 * }} Guard API.
 */
export function createRevertGuard( equals = strictEquals ) {
	// clientId -> array of pending tokens (FIFO). Multiple reverts can be
	// queued for the same block before their echoes arrive; each echo consumes
	// the oldest matching token.
	const pending = new Map();

	function expect( clientId, restore ) {
		const token = createRevertToken( clientId, restore );
		const list = pending.get( clientId );
		if ( list ) {
			list.push( token );
			// Bounded queue: a token whose echo never arrives must not sit
			// forever waiting to misclassify a future same-value edit. Evict
			// the oldest (FIFO) once the block exceeds the cap.
			while ( list.length > MAX_PENDING_TOKENS ) {
				list.shift();
			}
		} else {
			pending.set( clientId, [ token ] );
		}
	}

	function isEcho( clientId, currentAttributes ) {
		const list = pending.get( clientId );
		if ( ! list || list.length === 0 ) {
			return false;
		}
		for ( let i = 0; i < list.length; i++ ) {
			if (
				matchesRevertToken(
					list[ i ],
					clientId,
					currentAttributes,
					equals
				)
			) {
				// Consume the matched token (and drop the map entry when the
				// block has no more pending reverts) so a later, unrelated
				// change back to the same values isn't mistaken for an echo.
				list.splice( i, 1 );
				if ( list.length === 0 ) {
					pending.delete( clientId );
				}
				return true;
			}
		}
		return false;
	}

	return {
		expect,
		isEcho,
		pending: ( clientId ) => pending.get( clientId )?.length ?? 0,
		size: () => {
			let total = 0;
			for ( const list of pending.values() ) {
				total += list.length;
			}
			return total;
		},
		clear: () => pending.clear(),
	};
}
