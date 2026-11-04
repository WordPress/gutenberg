/**
 * The values of a suggestion note's `_wp_suggestion_status` meta. Keep in
 * sync with the enum registered in `gutenberg_register_suggestion_meta()`.
 *
 * A decision is provisional until the post is saved: the editor writes
 * `applied-unsaved` / `rejected-unsaved` and keeps the note open (`hold`), and
 * the server's save pass writes the final value once a saved post no longer
 * carries the suggestion. `outdated` is the server's verdict for a pending
 * suggestion whose anchor someone else's save removed. No client writes a
 * final value.
 */

export const PENDING = 'pending';
export const APPLIED_UNSAVED = 'applied-unsaved';
export const REJECTED_UNSAVED = 'rejected-unsaved';
export const APPLIED = 'applied';
export const REJECTED = 'rejected';
export const OUTDATED = 'outdated';

export type SuggestionStatus =
	| typeof PENDING
	| typeof APPLIED_UNSAVED
	| typeof REJECTED_UNSAVED
	| typeof APPLIED
	| typeof REJECTED
	| typeof OUTDATED;

/** The two decisions a reviewer can make. */
export type SuggestionDecision = typeof APPLIED | typeof REJECTED;

const STATUSES = new Set< string >( [
	PENDING,
	APPLIED_UNSAVED,
	REJECTED_UNSAVED,
	APPLIED,
	REJECTED,
	OUTDATED,
] );

/**
 * A note's status. Absent meta, and a value this client does not know, read
 * as pending: offering the decision again is the safe display.
 *
 * @param note Note comment record.
 * @return The status.
 */
export function getSuggestionStatus( note: any ): SuggestionStatus {
	const status = note?.meta?._wp_suggestion_status;
	return STATUSES.has( status ) ? status : PENDING;
}

/**
 * Whether the status awaits a decision.
 *
 * @param status Status.
 * @return True for pending.
 */
export function isPendingStatus( status: SuggestionStatus ): boolean {
	return status === PENDING;
}

/**
 * Whether the status is a decision the post has not been saved with yet.
 *
 * @param status Status.
 * @return True for `applied-unsaved` and `rejected-unsaved`.
 */
export function isProvisionalStatus( status: SuggestionStatus ): boolean {
	return status === APPLIED_UNSAVED || status === REJECTED_UNSAVED;
}

/**
 * Whether the status is one only the server writes.
 *
 * @param status Status.
 * @return True for `applied`, `rejected` and `outdated`.
 */
export function isFinalStatus( status: SuggestionStatus ): boolean {
	return status === APPLIED || status === REJECTED || status === OUTDATED;
}

/**
 * The decision a status records, saved or not.
 *
 * @param status Status.
 * @return `applied`, `rejected`, or null when nobody decided.
 */
export function getDecision(
	status: SuggestionStatus
): SuggestionDecision | null {
	if ( status === APPLIED || status === APPLIED_UNSAVED ) {
		return APPLIED;
	}
	if ( status === REJECTED || status === REJECTED_UNSAVED ) {
		return REJECTED;
	}
	return null;
}

/**
 * The status a client writes for a decision.
 *
 * @param decision Decision.
 * @return The provisional status.
 */
export function getProvisionalStatus(
	decision: SuggestionDecision
): typeof APPLIED_UNSAVED | typeof REJECTED_UNSAVED {
	return decision === APPLIED ? APPLIED_UNSAVED : REJECTED_UNSAVED;
}
