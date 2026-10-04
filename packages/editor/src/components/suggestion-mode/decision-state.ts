/**
 * Process state the apply/reject flow shares with the note garbage collector
 * and the store interceptor. Keyed by data registry rather than module-
 * scoped, so two editor instances on one page never read each other's
 * decisions, while every hook instance inside one editor sees the same sets.
 */

export interface SuggestionDecisionState {
	/**
	 * Comment ids with an apply/reject decision currently in flight. Deciding
	 * a suggestion mutates block content (clears markers) BEFORE the comment's
	 * lifecycle status lands on the server, so the note garbage collector (see
	 * suggestion-note-gc.ts) would briefly observe "marker gone, note still
	 * pending" and trash a note that was just resolved.
	 */
	decisionsInFlight: Set< string >;
	/**
	 * Suggestions this session has applied or rejected.
	 *
	 * A decision has two halves: the block change, which the undo stack holds,
	 * and the comment's lifecycle status, which lives on the server and no
	 * keystroke here can walk back. Undo therefore puts a marker back while its
	 * note stays resolved, leaving a marked-up run with no Accept/Reject on it
	 * and no way to clear it through the UI (issue #73411, F-18). The note
	 * collector watches this set and reopens a note whose marker reappears, so
	 * the two halves travel together again.
	 *
	 * Deliberately scoped to decisions made HERE rather than to every resolved
	 * note that has a live marker: a peer's decision arriving through sync
	 * before this session's content catches up looks identical from the
	 * outside, and reopening that would undo their review.
	 */
	resolvedThisSession: Set< string >;
	/**
	 * Notes whose last inline marker an edit removed on purpose, such as a
	 * split carrying the author's own proposed text into the new block
	 * (#73411, B8). The note collector only trashes a note whose anchor it has
	 * seen, and a quick edit can remove the marker before the thread list that
	 * would let it see the anchor has loaded. Recording the withdrawal counts
	 * as having seen it, so the note is still collected, behind the
	 * collector's reply guard.
	 */
	withdrawnAnchors: Set< string >;
}

const stateByRegistry = new WeakMap< object, SuggestionDecisionState >();

/**
 * The decision state for a registry, created on first use.
 *
 * @param registry Data registry of the editor instance.
 * @return Its decision state.
 */
export function getSuggestionDecisionState(
	registry: object
): SuggestionDecisionState {
	let state = stateByRegistry.get( registry );
	if ( ! state ) {
		state = {
			decisionsInFlight: new Set(),
			resolvedThisSession: new Set(),
			withdrawnAnchors: new Set(),
		};
		stateByRegistry.set( registry, state );
	}
	return state;
}

/**
 * Whether an apply/reject decision for the given comment is in flight.
 *
 * @param registry  Data registry.
 * @param commentId Comment id to check.
 * @return True while a decision is being processed.
 */
export function isSuggestionDecisionInFlight(
	registry: object,
	commentId: number | string
): boolean {
	return getSuggestionDecisionState( registry ).decisionsInFlight.has(
		String( commentId )
	);
}

/**
 * Wrap a decision callback (apply/reject) so its comment id is registered as
 * in flight for the duration of the call and remembered as resolved after.
 *
 * @param registry Data registry.
 * @param decide   Decision callback taking `{ commentId, ... }`.
 * @return Wrapped callback.
 */
export function withDecisionInFlight<
	Args extends { commentId?: number | string },
>( registry: object, decide: ( args: Args ) => Promise< unknown > ) {
	const { decisionsInFlight, resolvedThisSession } =
		getSuggestionDecisionState( registry );
	return async ( args: Args ) => {
		const key = String( args?.commentId );
		decisionsInFlight.add( key );
		try {
			return await decide( args );
		} finally {
			decisionsInFlight.delete( key );
			resolvedThisSession.add( key );
		}
	};
}

/**
 * Comment ids this session applied or rejected and has not yet reopened.
 *
 * @param registry Data registry.
 * @return Comment id keys.
 */
export function getSuggestionsResolvedThisSession( registry: object ) {
	return getSuggestionDecisionState( registry ).resolvedThisSession;
}

/**
 * Forget a decision, once its note has been reopened or is past reopening.
 *
 * @param registry  Data registry.
 * @param commentId Comment id.
 */
export function forgetResolvedSuggestion(
	registry: object,
	commentId: number | string
) {
	getSuggestionsResolvedThisSession( registry ).delete( String( commentId ) );
}

/**
 * Record a decision again, so a failed reopen is retried on a later pass.
 *
 * @param registry  Data registry.
 * @param commentId Comment id.
 */
export function rememberResolvedSuggestion(
	registry: object,
	commentId: number | string
) {
	getSuggestionsResolvedThisSession( registry ).add( String( commentId ) );
}

/**
 * Record that an edit removed a note's last inline marker.
 *
 * @param registry  Data registry.
 * @param commentId Comment id.
 */
export function rememberWithdrawnAnchor(
	registry: object,
	commentId: number | string
) {
	getSuggestionDecisionState( registry ).withdrawnAnchors.add(
		String( commentId )
	);
}

/**
 * Take a recorded withdrawal, so it is acted on once.
 *
 * @param registry  Data registry.
 * @param commentId Comment id.
 * @return Whether a withdrawal was recorded for the note.
 */
export function takeWithdrawnAnchor(
	registry: object,
	commentId: number | string
) {
	return getSuggestionDecisionState( registry ).withdrawnAnchors.delete(
		String( commentId )
	);
}
