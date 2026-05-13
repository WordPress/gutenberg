/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export const DISTRIBUTED_EDITING_RECOVERY_REST_BASE = 'posts';
export const DISTRIBUTED_EDITING_RECOVERY_REST_BASES = Object.freeze( [
	'posts',
	'pages',
] );

/**
 * Returns the current DE-RTC recovery endpoint path for a post.
 *
 * @param {Object} args                    Endpoint args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {string} REST path.
 */
export function getDistributedEditingRecoveryEndpointPath( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return getDistributedEditingEndpointPath( {
		postId,
		restBase,
		operation: 'recovery',
		errorSubject: 'recovery',
	} );
}

/**
 * Returns the current DE-RTC stale-base endpoint path for a post.
 *
 * @param {Object} args                    Endpoint args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {string} REST path.
 */
export function getDistributedEditingStaleBaseEndpointPath( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return getDistributedEditingEndpointPath( {
		postId,
		restBase,
		operation: 'stale-base',
		errorSubject: 'stale-base',
	} );
}

/**
 * Returns the current DE-RTC retry-submit proof endpoint path for a post.
 *
 * @param {Object} args                    Endpoint args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {string} REST path.
 */
export function getDistributedEditingRetrySubmitEndpointPath( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return getDistributedEditingEndpointPath( {
		postId,
		restBase,
		operation: 'retry-submit',
		errorSubject: 'retry-submit',
	} );
}

/**
 * Returns the current DE-RTC retry-save endpoint path for a post.
 *
 * @param {Object} args                    Endpoint args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {string} REST path.
 */
export function getDistributedEditingRetrySaveEndpointPath( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return getDistributedEditingEndpointPath( {
		postId,
		restBase,
		operation: 'retry-save',
		errorSubject: 'retry-save',
	} );
}

/**
 * Returns the current edited post endpoint path for DE-RTC server-state reads.
 *
 * @param {Object} args                    Endpoint args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {string} REST path.
 */
export function getDistributedEditingServerStateEndpointPath( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	const parsedPostId = getDistributedEditingPostId( postId, 'server-state' );

	assertDistributedEditingRestBase( restBase, 'server-state' );

	return `/wp/v2/${ restBase }/${ parsedPostId }`;
}

function getDistributedEditingEndpointPath( {
	postId,
	restBase,
	operation,
	errorSubject,
} ) {
	const parsedPostId = getDistributedEditingPostId( postId, errorSubject );

	assertDistributedEditingRestBase( restBase, errorSubject );

	return `/wp/v2/${ restBase }/${ parsedPostId }/distributed-editing/${ operation }`;
}

function getDistributedEditingPostId( postId, errorSubject ) {
	const parsedPostId = Number( postId );

	if ( ! Number.isInteger( parsedPostId ) || parsedPostId <= 0 ) {
		throw new TypeError(
			`Distributed Editing ${ errorSubject } requests require a positive post ID.`
		);
	}

	return parsedPostId;
}

function assertDistributedEditingRestBase( restBase, errorSubject ) {
	if ( ! DISTRIBUTED_EDITING_RECOVERY_REST_BASES.includes( restBase ) ) {
		throw new TypeError(
			`Distributed Editing ${ errorSubject } currently supports posts and pages REST bases only.`
		);
	}
}

/**
 * Performs a dry-run sync-meta recovery request.
 *
 * This helper intentionally cannot request apply mode. Future save-path work
 * must introduce a separate, explicitly reviewed call site for writes.
 *
 * @param {Object} args                            Request args.
 * @param {number} args.postId                     Post ID.
 * @param {string} [args.restBase='posts']         REST base for the edited post type.
 * @param {string} [args.candidatePostContentHash] Optional server-derived candidate hash assertion.
 *
 * @return {Promise<Object>} REST response.
 */
export function __experimentalRequestDistributedEditingRecoveryDryRun( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
	candidatePostContentHash,
} = {} ) {
	const data = {
		mode: 'dry_run',
	};

	if ( candidatePostContentHash ) {
		data.candidate_post_content_hash = candidatePostContentHash;
	}

	return apiFetch( {
		path: getDistributedEditingRecoveryEndpointPath( { postId, restBase } ),
		method: 'POST',
		data,
	} );
}

/**
 * Requests the stale-base rejection contract for an unconfirmed local edit.
 *
 * This helper intentionally cannot save, apply recovery, rebase, or retry. The
 * current WordPress proof endpoint returns a REST error that callers normalize
 * into editor state before deciding what human-visible action to offer.
 *
 * @param {Object}  args                               Request args.
 * @param {number}  args.postId                        Post ID.
 * @param {string}  [args.restBase='posts']            REST base for the edited post type.
 * @param {string}  args.clientBaseVersion             Client sync version being submitted from.
 * @param {string}  [args.serverVersion]               Known server sync version.
 * @param {number}  [args.pendingChangeCount=1]        Pending local change groups.
 * @param {number}  [args.remoteChangeCount=1]         Remote change groups reported by the server.
 * @param {boolean} [args.canAttemptLocalRebase=false] Whether the server allows local rebase immediately.
 *
 * @return {Promise<Object>} REST response or error.
 */
export function __experimentalRequestDistributedEditingStaleBaseRejection( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
	clientBaseVersion,
	serverVersion,
	pendingChangeCount = 1,
	remoteChangeCount = 1,
	canAttemptLocalRebase = false,
} = {} ) {
	const data = {
		client_base_version: clientBaseVersion,
		pending_change_count: pendingChangeCount,
		remote_change_count: remoteChangeCount,
		can_attempt_local_rebase: canAttemptLocalRebase,
	};

	if ( serverVersion ) {
		data.server_version = serverVersion;
	}

	return apiFetch( {
		path: getDistributedEditingStaleBaseEndpointPath( {
			postId,
			restBase,
		} ),
		method: 'POST',
		data,
	} );
}

/**
 * Requests the retry-submit proof contract for locally rebased edits.
 *
 * This helper posts only proof metadata. It does not send raw post content,
 * save, apply recovery, change post locks, dispatch notices, or claim that
 * pending local changes have been persisted.
 *
 * @param {Object} args                           Request args.
 * @param {number} args.postId                    Post ID.
 * @param {string} [args.restBase='posts']        REST base for the edited post type.
 * @param {string} args.clientBaseVersion         Current sync version after local rebase.
 * @param {string} [args.rebasedFromVersion]      Original stale sync version.
 * @param {number} [args.pendingChangeCount=1]    Pending local change groups.
 * @param {string} [args.proposedPostContentHash] SHA-256 hash of proposed post content.
 *
 * @return {Promise<Object>} REST response or error.
 */
export function __experimentalRequestDistributedEditingRetrySubmitProbe( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
	clientBaseVersion,
	rebasedFromVersion,
	pendingChangeCount = 1,
	proposedPostContentHash,
} = {} ) {
	const data = {
		client_base_version: clientBaseVersion,
		pending_change_count: pendingChangeCount,
	};

	if ( rebasedFromVersion ) {
		data.rebased_from_version = rebasedFromVersion;
	}

	if ( proposedPostContentHash ) {
		data.proposed_post_content_hash = proposedPostContentHash;
	}

	return apiFetch( {
		path: getDistributedEditingRetrySubmitEndpointPath( {
			postId,
			restBase,
		} ),
		method: 'POST',
		data,
	} );
}

/**
 * Requests the retry-save write contract for accepted retry-submit proof.
 *
 * This low-level helper is intentionally not wired to savePost. The server owns
 * sync-meta mutation; callers send proposed post content without sync metadata
 * and keep pending/export protection until the response is normalized by a
 * later editor action.
 *
 * @param {Object}  args                                         Request args.
 * @param {number}  args.postId                                  Post ID.
 * @param {string}  [args.restBase='posts']                      REST base for the edited post type.
 * @param {string}  args.clientBaseVersion                       Current sync version after local rebase.
 * @param {string}  args.acceptedProofServerVersion              Server version from accepted retry-submit proof.
 * @param {string}  [args.rebasedFromVersion]                    Original stale sync version.
 * @param {number}  [args.pendingChangeCount=1]                  Pending local change groups.
 * @param {string}  args.proposedPostContent                     Proposed post content without sync metadata.
 * @param {string}  [args.proposedPostContentHash]               SHA-256 hash of proposed post content.
 * @param {boolean} [args.acceptedProofSavesPost=false]          Whether accepted proof claimed a save.
 * @param {boolean} [args.acceptedProofMutatesPostContent=false] Whether accepted proof claimed content mutation.
 * @param {boolean} [args.acceptedProofCreatesRevision=false]    Whether accepted proof claimed revision creation.
 * @param {boolean} [args.acceptedProofClaimsSaved=false]        Whether accepted proof claimed saved state.
 *
 * @return {Promise<Object>} REST response or error.
 */
export function __experimentalRequestDistributedEditingRetrySave( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
	clientBaseVersion,
	acceptedProofServerVersion,
	rebasedFromVersion,
	pendingChangeCount = 1,
	proposedPostContent,
	proposedPostContentHash,
	acceptedProofSavesPost = false,
	acceptedProofMutatesPostContent = false,
	acceptedProofCreatesRevision = false,
	acceptedProofClaimsSaved = false,
} = {} ) {
	const data = {
		client_base_version: clientBaseVersion,
		accepted_proof_server_version: acceptedProofServerVersion,
		pending_change_count: pendingChangeCount,
		proposed_post_content: proposedPostContent,
		accepted_proof_saves_post: acceptedProofSavesPost,
		accepted_proof_mutates_post_content: acceptedProofMutatesPostContent,
		accepted_proof_creates_revision: acceptedProofCreatesRevision,
		accepted_proof_claims_saved: acceptedProofClaimsSaved,
	};

	if ( rebasedFromVersion ) {
		data.rebased_from_version = rebasedFromVersion;
	}

	if ( proposedPostContentHash ) {
		data.proposed_post_content_hash = proposedPostContentHash;
	}

	return apiFetch( {
		path: getDistributedEditingRetrySaveEndpointPath( {
			postId,
			restBase,
		} ),
		method: 'POST',
		data,
	} );
}

/**
 * Refetches the current server post state for a stale-base session.
 *
 * This helper reads the post only. It does not save, apply the response to the
 * editor entity, rebase local edits, retry a submit, or change post locks.
 *
 * @param {Object} args                    Request args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {Promise<Object>} REST response.
 */
export function __experimentalRequestDistributedEditingServerStateRefetch( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return apiFetch( {
		path: `${ getDistributedEditingServerStateEndpointPath( {
			postId,
			restBase,
		} ) }?context=edit`,
		method: 'GET',
	} );
}
