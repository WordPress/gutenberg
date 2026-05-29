/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export const DISTRIBUTED_EDITING_RECOVERY_REST_BASE = 'posts';
export const DISTRIBUTED_EDITING_RECOVERY_REST_BASES = Object.freeze( [
	'posts',
	'pages',
] );
const DISTRIBUTED_EDITING_REVIEW_APPROVAL_PROOF_ENVELOPE_TYPE =
	'field_based_review_approval_proof';
const DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_ENVELOPE_TYPE =
	'opaque_review_approval_proof_token';

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
 * Returns the current DE-RTC document-history endpoint path for a post.
 *
 * @param {Object} args                    Endpoint args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {string} REST path.
 */
export function getDistributedEditingHistoryEndpointPath( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return getDistributedEditingEndpointPath( {
		postId,
		restBase,
		operation: 'history',
		errorSubject: 'history',
	} );
}

/**
 * Returns the current DE-RTC document-history planning endpoint path.
 *
 * @param {Object} args                    Endpoint args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {string} REST path.
 */
export function getDistributedEditingHistoryPlanEndpointPath( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return getDistributedEditingEndpointPath( {
		postId,
		restBase,
		operation: 'history/plan',
		errorSubject: 'history planning',
	} );
}

/**
 * Returns the current DE-RTC retry-save reviewer approval proof endpoint path
 * for a post.
 *
 * @param {Object} args                    Endpoint args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {string} REST path.
 */
export function getDistributedEditingRetrySaveReviewApprovalEndpointPath( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return getDistributedEditingEndpointPath( {
		postId,
		restBase,
		operation: 'review-approval',
		errorSubject: 'retry-save reviewer approval',
	} );
}

/**
 * Returns the current DE-RTC fresh-review request endpoint path for a post.
 *
 * @param {Object} args                    Endpoint args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {string} REST path.
 */
export function getDistributedEditingFreshReviewRequestEndpointPath( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return getDistributedEditingEndpointPath( {
		postId,
		restBase,
		operation: 'fresh-review-request',
		errorSubject: 'fresh-review request',
	} );
}

/**
 * Returns the current DE-RTC fresh-review decision endpoint path for a post.
 *
 * @param {Object} args                    Endpoint args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {string} REST path.
 */
export function getDistributedEditingFreshReviewDecisionEndpointPath( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return getDistributedEditingEndpointPath( {
		postId,
		restBase,
		operation: 'fresh-review-decision',
		errorSubject: 'fresh-review decision',
	} );
}

/**
 * Returns the current DE-RTC fresh-review decision consumption endpoint path
 * for a post.
 *
 * @param {Object} args                    Endpoint args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {string} REST path.
 */
export function getDistributedEditingFreshReviewConsumeEndpointPath( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return getDistributedEditingEndpointPath( {
		postId,
		restBase,
		operation: 'fresh-review-consume',
		errorSubject: 'fresh-review consume',
	} );
}

/**
 * Returns the current DE-RTC presence snapshot endpoint path for a post.
 *
 * @param {Object} args                    Endpoint args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {string} REST path.
 */
export function getDistributedEditingPresenceEndpointPath( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return getDistributedEditingEndpointPath( {
		postId,
		restBase,
		operation: 'presence',
		errorSubject: 'presence',
	} );
}

/**
 * Returns the current DE-RTC presence heartbeat endpoint path for a post.
 *
 * @param {Object} args                    Endpoint args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {string} REST path.
 */
export function getDistributedEditingPresenceHeartbeatEndpointPath( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return getDistributedEditingEndpointPath( {
		postId,
		restBase,
		operation: 'presence/heartbeat',
		errorSubject: 'presence heartbeat',
	} );
}

/**
 * Returns the current DE-RTC presence storage readiness endpoint path for a post.
 *
 * @param {Object} args                    Endpoint args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {string} REST path.
 */
export function getDistributedEditingPresenceStorageReadinessEndpointPath( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return getDistributedEditingEndpointPath( {
		postId,
		restBase,
		operation: 'presence/storage-readiness',
		errorSubject: 'presence storage readiness',
	} );
}

/**
 * Returns the current DE-RTC post snapshot endpoint path for a post.
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

	return `/wp/v2/${ restBase }/${ parsedPostId }/distributed-editing`;
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
 * Requests a read-only Distributed Editing presence snapshot.
 *
 * This helper performs one explicit GET. It does not start polling, write
 * heartbeats, save, mutate editor content, or change post locks.
 *
 * @param {Object} args                    Request args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 * @param {string} [args.sessionKey]       Opaque local session key for this tab.
 *
 * @return {Promise<Object>} REST response.
 */
export function __experimentalRequestDistributedEditingPresenceSnapshot( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
	sessionKey,
} = {} ) {
	const basePath = getDistributedEditingPresenceEndpointPath( {
		postId,
		restBase,
	} );
	const trimmedSessionKey =
		typeof sessionKey === 'string' ? sessionKey.trim() : '';

	return apiFetch( {
		path: trimmedSessionKey
			? `${ basePath }?session_key=${ encodeURIComponent(
					trimmedSessionKey
			  ) }`
			: basePath,
		method: 'GET',
	} );
}

/**
 * Sends a one-shot Distributed Editing presence heartbeat.
 *
 * This helper posts only an opaque tab/session key plus content-free reported
 * document state and optional content-free selection presence. It does not
 * include raw content, raw selected text, DOM data, save data, or post-lock
 * data.
 *
 * @param {Object}  args                        Request args.
 * @param {number}  args.postId                 Post ID.
 * @param {string}  [args.restBase='posts']     REST base for the edited post type.
 * @param {string}  args.sessionKey             Opaque local session key.
 * @param {string}  [args.confirmedBaseVersion] Last accepted sync version.
 * @param {string}  [args.confirmedStateHash]   Last accepted opaque state hash.
 * @param {boolean} [args.hasPendingChanges]    Whether this tab has unsaved changes.
 * @param {string}  [args.confirmedAtGmt]       When this tab observed the accepted copy.
 * @param {Object}  [args.selectionState]       Content-free selection presence.
 *
 * @return {Promise<Object>} REST response.
 */
export function __experimentalRequestDistributedEditingPresenceHeartbeat( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
	sessionKey,
	confirmedBaseVersion,
	confirmedStateHash,
	hasPendingChanges,
	confirmedAtGmt,
	selectionState,
} = {} ) {
	if ( typeof sessionKey !== 'string' || sessionKey.trim() === '' ) {
		throw new TypeError(
			'Distributed Editing presence heartbeat requests require an opaque session key.'
		);
	}

	const data = {
		session_key: sessionKey,
	};
	const trimmedConfirmedBaseVersion =
		typeof confirmedBaseVersion === 'string'
			? confirmedBaseVersion.trim()
			: '';
	const trimmedConfirmedStateHash =
		typeof confirmedStateHash === 'string' ? confirmedStateHash.trim() : '';
	const trimmedConfirmedAtGmt =
		typeof confirmedAtGmt === 'string' ? confirmedAtGmt.trim() : '';

	if ( trimmedConfirmedBaseVersion ) {
		data.confirmed_base_version = trimmedConfirmedBaseVersion;
		data.has_pending_changes = Boolean( hasPendingChanges );

		if ( trimmedConfirmedStateHash ) {
			data.confirmed_state_hash = trimmedConfirmedStateHash;
		}

		if ( trimmedConfirmedAtGmt ) {
			data.confirmed_at_gmt = trimmedConfirmedAtGmt;
		}
	}

	if (
		selectionState &&
		typeof selectionState === 'object' &&
		selectionState.available
	) {
		data.selection_state = selectionState;
	}

	return apiFetch( {
		path: getDistributedEditingPresenceHeartbeatEndpointPath( {
			postId,
			restBase,
		} ),
		method: 'POST',
		data,
	} );
}

/**
 * Re-checks the content-free Distributed Editing presence storage readiness
 * fact. This helper performs one explicit GET. It does not install storage,
 * write presence, save, mutate editor content, start polling, or change post
 * locks.
 *
 * @param {Object} args                    Request args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {Promise<Object>} REST response.
 */
export function __experimentalRequestDistributedEditingPresenceStorageReadiness( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return apiFetch( {
		path: getDistributedEditingPresenceStorageReadinessEndpointPath( {
			postId,
			restBase,
		} ),
		method: 'GET',
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
 * Requests the no-write Distributed Editing document history.
 *
 * @param {Object} args                    Request args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 *
 * @return {Promise<Object>} REST response.
 */
export function __experimentalRequestDistributedEditingHistory( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} = {} ) {
	return apiFetch( {
		path: getDistributedEditingHistoryEndpointPath( {
			postId,
			restBase,
		} ),
		method: 'GET',
	} );
}

/**
 * Requests a no-write document-history action plan.
 *
 * The returned content is staged locally by the editor. Persistence still flows
 * through the normal Save button and guarded DE-RTC save path.
 *
 * @param {Object} args                       Request args.
 * @param {number} args.postId                Post ID.
 * @param {string} [args.restBase='posts']    REST base for the edited post type.
 * @param {string} args.historyAction         Either "revert" or "restore".
 * @param {number} args.revisionId            Revision ID, or 0 for the current post.
 * @param {string} [args.selectedContentHash] Hash of the selected stripped content.
 *
 * @return {Promise<Object>} REST response.
 */
export function __experimentalRequestDistributedEditingHistoryPlan( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
	historyAction,
	revisionId,
	selectedContentHash,
} = {} ) {
	const data = {
		history_action: historyAction,
		revision_id: revisionId,
	};

	if ( selectedContentHash ) {
		data.selected_content_hash = selectedContentHash;
	}

	return apiFetch( {
		path: getDistributedEditingHistoryPlanEndpointPath( {
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
 * @param {Object}  [args.acceptedReviewApprovalProof]           Hash-only review approval proof.
 * @param {Object}  [args.acceptedFreshReviewConsumeValidation]  Hash-only fresh-review consume validation evidence.
 * @param {Object}  [args.blockIdentityRequestProof]             Content-free block identity request proof.
 * @param {Object}  [args.yjsClientUpdate]                       Native PHP Yjs update evidence.
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
	acceptedReviewApprovalProof,
	acceptedFreshReviewConsumeValidation,
	blockIdentityRequestProof,
	yjsClientUpdate,
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

	const normalizedReviewApprovalProof =
		normalizeAcceptedReviewApprovalProofForRetrySaveRequest(
			acceptedReviewApprovalProof
		);

	if ( normalizedReviewApprovalProof ) {
		data.accepted_review_approval_proof = normalizedReviewApprovalProof;
	}

	const normalizedFreshReviewConsumeValidation =
		normalizeAcceptedFreshReviewConsumeValidationForRetrySaveRequest(
			acceptedFreshReviewConsumeValidation
		);

	if ( normalizedFreshReviewConsumeValidation ) {
		data.accepted_fresh_review_decision =
			normalizedFreshReviewConsumeValidation;
	}

	const normalizedBlockIdentityRequestProof =
		normalizeBlockIdentityRequestProofForRetrySaveRequest(
			blockIdentityRequestProof
		);

	if ( normalizedBlockIdentityRequestProof ) {
		data.block_identity_request_proof = normalizedBlockIdentityRequestProof;
	}

	const normalizedYjsClientUpdate =
		normalizeYjsClientUpdateForRetrySaveRequest( yjsClientUpdate );

	if ( normalizedYjsClientUpdate ) {
		data.yjs_client_update = normalizedYjsClientUpdate;
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

function normalizeYjsClientUpdateForRetrySaveRequest( update ) {
	if (
		! update ||
		typeof update !== 'object' ||
		Array.isArray( update ) ||
		containsRawContentEvidence( update )
	) {
		return null;
	}

	if ( update.format && update.format !== 'native-yjs-php-update-v0' ) {
		return null;
	}

	const operations = Array.isArray( update.operations )
		? update.operations
				.map( normalizeYjsClientUpdateOperation )
				.filter( Boolean )
		: null;

	if ( ! operations ) {
		return null;
	}

	const normalized = {
		format: 'native-yjs-php-update-v0',
		operations,
		stateVector:
			update.stateVector &&
			typeof update.stateVector === 'object' &&
			! Array.isArray( update.stateVector )
				? update.stateVector
				: {},
	};

	if (
		update.interop &&
		typeof update.interop === 'object' &&
		! Array.isArray( update.interop )
	) {
		normalized.interop = update.interop;
	}

	return normalized;
}

function normalizeYjsClientUpdateOperation( operation ) {
	if (
		! operation ||
		typeof operation !== 'object' ||
		Array.isArray( operation ) ||
		containsRawContentEvidence( operation )
	) {
		return null;
	}

	if ( operation.type === 'delete' ) {
		const index = normalizeProofNonNegativeInteger( operation.index );
		const length = normalizeProofNonNegativeInteger( operation.length );

		if ( index === undefined || length === undefined || length < 1 ) {
			return null;
		}

		return {
			type: 'delete',
			index,
			length,
			...( normalizeProofString( operation.actor )
				? { actor: normalizeProofString( operation.actor ) }
				: {} ),
			...( normalizeProofNonNegativeInteger( operation.sequence ) !==
			undefined
				? {
						sequence: normalizeProofNonNegativeInteger(
							operation.sequence
						),
				  }
				: {} ),
			...( normalizeProofString( operation.id )
				? { id: normalizeProofString( operation.id ) }
				: {} ),
		};
	}

	if ( operation.type === 'insert' ) {
		const index = normalizeProofNonNegativeInteger( operation.index );

		if ( index === undefined || typeof operation.text !== 'string' ) {
			return null;
		}

		return {
			type: 'insert',
			index,
			text: operation.text,
			...( normalizeProofString( operation.actor )
				? { actor: normalizeProofString( operation.actor ) }
				: {} ),
			...( normalizeProofNonNegativeInteger( operation.sequence ) !==
			undefined
				? {
						sequence: normalizeProofNonNegativeInteger(
							operation.sequence
						),
				  }
				: {} ),
			...( normalizeProofString( operation.id )
				? { id: normalizeProofString( operation.id ) }
				: {} ),
		};
	}

	return null;
}

function normalizeBlockIdentityRequestProofForRetrySaveRequest( proof ) {
	if (
		! proof ||
		typeof proof !== 'object' ||
		Array.isArray( proof ) ||
		containsRawContentEvidence( proof ) ||
		containsClientIdEvidence( proof )
	) {
		return null;
	}

	const proposedBlockMap = Array.isArray(
		proof.proposedBlockMap ?? proof.proposed_block_map
	)
		? ( proof.proposedBlockMap ?? proof.proposed_block_map )
				.map( normalizeBlockIdentityRequestProofBlock )
				.filter( Boolean )
		: null;
	const normalized = {
		client_base_version: normalizeProofString(
			proof.clientBaseVersion ?? proof.client_base_version
		),
		proposed_post_content_hash: normalizeProofString(
			proof.proposedPostContentHash ?? proof.proposed_post_content_hash
		),
		proposed_block_map: proposedBlockMap,
		retained_block_uids: normalizeProofStringList(
			proof.retainedBlockUids ?? proof.retained_block_uids
		),
		inserted_block_nonces: normalizeProofStringList(
			proof.insertedBlockNonces ?? proof.inserted_block_nonces
		),
		deleted_block_uids: normalizeProofStringList(
			proof.deletedBlockUids ?? proof.deleted_block_uids
		),
		moved_block_uids: normalizeProofStringList(
			proof.movedBlockUids ?? proof.moved_block_uids
		),
	};

	if (
		! normalized.client_base_version ||
		! normalized.proposed_post_content_hash ||
		! Array.isArray( normalized.proposed_block_map ) ||
		normalized.proposed_block_map.length === 0 ||
		! Array.isArray( normalized.retained_block_uids ) ||
		! Array.isArray( normalized.inserted_block_nonces ) ||
		! Array.isArray( normalized.deleted_block_uids ) ||
		! Array.isArray( normalized.moved_block_uids )
	) {
		return null;
	}

	return normalized;
}

function normalizeBlockIdentityRequestProofBlock( block ) {
	if (
		! block ||
		typeof block !== 'object' ||
		Array.isArray( block ) ||
		containsRawContentEvidence( block ) ||
		containsClientIdEvidence( block )
	) {
		return null;
	}

	const blockUid = normalizeProofString( block.blockUid ?? block.block_uid );
	const insertedBlockNonce = normalizeProofString(
		block.insertedBlockNonce ?? block.inserted_block_nonce
	);
	const normalized = {
		...( blockUid ? { block_uid: blockUid } : {} ),
		...( insertedBlockNonce
			? { inserted_block_nonce: insertedBlockNonce }
			: {} ),
		block_name: normalizeProofString( block.blockName ?? block.block_name ),
		ordinal_path: normalizeProofNonNegativeIntegerList(
			block.ordinalPath ?? block.ordinal_path
		),
		serialized_hash: normalizeProofString(
			block.serializedHash ?? block.serialized_hash
		),
	};

	if (
		( ! normalized.block_uid && ! normalized.inserted_block_nonce ) ||
		! normalized.block_name ||
		! normalized.ordinal_path ||
		normalized.ordinal_path.length === 0 ||
		! normalized.serialized_hash
	) {
		return null;
	}

	return normalized;
}

function normalizeAcceptedFreshReviewConsumeValidationForRetrySaveRequest(
	validation
) {
	if (
		! validation ||
		typeof validation !== 'object' ||
		Array.isArray( validation ) ||
		containsRawContentEvidence( validation )
	) {
		return null;
	}

	const proposedPostContentHash =
		validation.proposedPostContentHash ??
		validation.proposed_post_content_hash;
	const candidatePostContentHash =
		validation.candidatePostContentHash ??
		validation.candidate_post_content_hash;
	const consumptionValidated = Boolean(
		validation.freshReviewDecisionConsumptionValidated ??
			validation.fresh_review_decision_consumption_validated ??
			validation.validated ??
			validation.accepted
	);
	const eligibleForRetrySave = Boolean(
		validation.freshReviewDecisionEligibleForRetrySave ??
			validation.fresh_review_decision_eligible_for_retry_save ??
			validation.eligibleForRetrySave ??
			validation.accepted
	);
	const normalized = {
		type:
			validation.type ??
			validation.validationType ??
			validation.validation_type ??
			'fresh_review_decision_consumption_validation',
		status:
			validation.status ??
			validation.validationStatus ??
			validation.validation_status ??
			'eligible_for_retry_save_handoff',
		result: validation.result,
		rest_route: validation.restRoute ?? validation.rest_route,
		fresh_review_request_record_id:
			validation.freshReviewRequestRecordId ??
			validation.fresh_review_request_record_id ??
			validation.requestRecordId ??
			validation.request_record_id,
		fresh_review_request_status:
			validation.freshReviewRequestStatus ??
			validation.fresh_review_request_status,
		fresh_review_decision_status:
			validation.freshReviewDecisionStatus ??
			validation.fresh_review_decision_status,
		client_base_version:
			validation.clientBaseVersion ??
			validation.client_base_version ??
			undefined,
		server_version:
			validation.serverVersion ?? validation.server_version ?? undefined,
		proposed_post_content_hash: proposedPostContentHash,
		reviewed_proposed_content_hash:
			validation.reviewedProposedContentHash ??
			validation.reviewed_proposed_content_hash ??
			proposedPostContentHash,
		candidate_post_content_hash: candidatePostContentHash,
		reviewed_candidate_content_hash:
			validation.reviewedCandidateContentHash ??
			validation.reviewed_candidate_content_hash ??
			candidatePostContentHash,
		reviewed_block_item_count:
			normalizeProofNonNegativeInteger(
				validation.reviewedBlockItemCount ??
					validation.reviewed_block_item_count
			) ?? undefined,
		hash_evidence_status:
			validation.hashEvidenceStatus ??
			validation.hash_evidence_status ??
			undefined,
		fresh_review_decision_consumption_validated: consumptionValidated,
		fresh_review_decision_eligible_for_retry_save: eligibleForRetrySave,
		raw_content_included: false,
		exposes_raw_content: false,
		exposes_reviewer_ids: false,
		saves_post: Boolean( validation.savesPost ?? validation.saves_post ),
		mutates_post_content: Boolean(
			validation.mutatesPostContent ?? validation.mutates_post_content
		),
		creates_revision: Boolean(
			validation.createsRevision ?? validation.creates_revision
		),
		claims_saved: Boolean(
			validation.claimsSaved ?? validation.claims_saved
		),
	};

	for ( const [ key, value ] of Object.entries( normalized ) ) {
		if (
			value === undefined ||
			value === null ||
			( value === '' &&
				! [
					'candidate_post_content_hash',
					'reviewed_candidate_content_hash',
				].includes( key ) )
		) {
			delete normalized[ key ];
		}
	}

	if (
		! normalized.fresh_review_request_record_id ||
		! normalized.client_base_version ||
		! normalized.server_version ||
		! normalized.proposed_post_content_hash ||
		! normalized.fresh_review_decision_consumption_validated
	) {
		return null;
	}

	return normalized;
}

function normalizeAcceptedReviewApprovalProofForRetrySaveRequest( proof ) {
	if ( ! proof || typeof proof !== 'object' ) {
		return null;
	}

	const normalizedEnvelope =
		normalizeReviewApprovalProofEnvelopeForRetrySaveRequest( proof );

	if ( normalizedEnvelope ) {
		return normalizedEnvelope;
	}

	if ( getReviewApprovalProofEnvelopeType( proof ) ) {
		return null;
	}

	const normalized = {
		type: proof.type,
		status: proof.status ?? proof.proofStatus ?? proof.proof_status,
		post_id: normalizeProofPositiveInteger( proof.postId ?? proof.post_id ),
		post_type: proof.postType ?? proof.post_type ?? undefined,
		reviewer_user_id: normalizeProofPositiveInteger(
			proof.reviewerUserId ?? proof.reviewer_user_id
		),
		low_privileged_saver_user_id: normalizeProofPositiveIntegerOrNull(
			getProofField(
				proof,
				'lowPrivilegedSaverUserId',
				'low_privileged_saver_user_id'
			)
		),
		reviewer_capability:
			proof.reviewerCapability ?? proof.reviewer_capability ?? undefined,
		review_scope: proof.reviewScope ?? proof.review_scope ?? undefined,
		review_status: proof.reviewStatus ?? proof.review_status ?? undefined,
		approval_status:
			proof.approvalStatus ?? proof.approval_status ?? undefined,
		review_action: proof.reviewAction ?? proof.review_action ?? undefined,
		approval_action:
			proof.approvalAction ?? proof.approval_action ?? undefined,
		review_required_capability:
			proof.reviewRequiredCapability ??
			proof.review_required_capability ??
			undefined,
		server_version:
			proof.serverVersion ?? proof.server_version ?? undefined,
		previous_server_version:
			proof.previousServerVersion ??
			proof.previous_server_version ??
			undefined,
		client_base_version:
			proof.clientBaseVersion ?? proof.client_base_version ?? undefined,
		accepted_proof_server_version:
			proof.acceptedProofServerVersion ??
			proof.accepted_proof_server_version ??
			undefined,
		rebased_from_version:
			proof.rebasedFromVersion ?? proof.rebased_from_version ?? undefined,
		proposed_post_content_hash:
			proof.proposedPostContentHash ??
			proof.proposed_post_content_hash ??
			undefined,
		reviewed_proposed_content_hash:
			proof.reviewedProposedContentHash ??
			proof.reviewed_proposed_content_hash ??
			proof.proposedPostContentHash ??
			proof.proposed_post_content_hash ??
			undefined,
		candidate_post_content_hash:
			proof.candidatePostContentHash ??
			proof.candidate_post_content_hash ??
			undefined,
		reviewed_candidate_content_hash:
			proof.reviewedCandidateContentHash ??
			proof.reviewed_candidate_content_hash ??
			proof.candidatePostContentHash ??
			proof.candidate_post_content_hash ??
			undefined,
		candidate_post_content_hash_scope:
			proof.candidatePostContentHashScope ??
			proof.candidate_post_content_hash_scope ??
			undefined,
		requires_unfiltered_html_saver: Boolean(
			proof.requiresUnfilteredHtmlSaver ??
				proof.requires_unfiltered_html_saver
		),
		kses_filtered_proposed_content_hash:
			proof.ksesFilteredProposedContentHash ??
			proof.kses_filtered_proposed_content_hash ??
			undefined,
		kses_filtered_candidate_content_hash:
			proof.ksesFilteredCandidateContentHash ??
			proof.kses_filtered_candidate_content_hash ??
			undefined,
		reviewed_block_items: normalizeReviewedBlockItemsForRequest(
			getProofField(
				proof,
				'reviewedBlockItems',
				'reviewed_block_items'
			),
			{ preserveSignedShape: true }
		),
		reviewed_block_item_count:
			proof.reviewedBlockItemCount ??
			proof.reviewed_block_item_count ??
			undefined,
		block_review_status: getProofField(
			proof,
			'blockReviewStatus',
			'block_review_status'
		),
		proof_signature:
			proof.proofSignature ?? proof.proof_signature ?? undefined,
		issued_at: normalizeProofPositiveInteger(
			proof.issuedAt ?? proof.issued_at
		),
		expires_at: normalizeProofPositiveInteger(
			proof.expiresAt ?? proof.expires_at
		),
		site_id: normalizeProofPositiveInteger( proof.siteId ?? proof.site_id ),
		site_url: proof.siteUrl ?? proof.site_url ?? undefined,
		site_uuid: proof.siteUuid ?? proof.site_uuid ?? undefined,
		raw_content_included: false,
		saves_post: Boolean( proof.savesPost ?? proof.saves_post ),
		mutates_post_content: Boolean(
			proof.mutatesPostContent ?? proof.mutates_post_content
		),
		creates_revision: Boolean(
			proof.createsRevision ?? proof.creates_revision
		),
		claims_saved: Boolean( proof.claimsSaved ?? proof.claims_saved ),
	};

	for ( const [ key, value ] of Object.entries( normalized ) ) {
		if (
			value === undefined ||
			( value === null &&
				! [
					'low_privileged_saver_user_id',
					'block_review_status',
				].includes( key ) ) ||
			( Array.isArray( value ) &&
				value.length === 0 &&
				key !== 'reviewed_block_items' )
		) {
			delete normalized[ key ];
		}
	}

	if ( normalized.reviewed_block_items ) {
		normalized.reviewed_block_item_count =
			normalized.reviewed_block_items.length;
	}

	return normalized;
}

function normalizeReviewApprovalProofEnvelopeForRetrySaveRequest(
	proofOrEnvelope
) {
	const envelopeType = getReviewApprovalProofEnvelopeType( proofOrEnvelope );

	if (
		envelopeType === DISTRIBUTED_EDITING_REVIEW_APPROVAL_PROOF_ENVELOPE_TYPE
	) {
		const proof = normalizeAcceptedReviewApprovalProofForRetrySaveRequest(
			proofOrEnvelope.proof
		);

		return proof
			? {
					proof_envelope_type:
						DISTRIBUTED_EDITING_REVIEW_APPROVAL_PROOF_ENVELOPE_TYPE,
					proof,
			  }
			: null;
	}

	if (
		envelopeType !==
		DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_ENVELOPE_TYPE
	) {
		return null;
	}

	if ( containsRawContentEvidence( proofOrEnvelope ) ) {
		return null;
	}

	const token = normalizeProofString(
		getProofField(
			proofOrEnvelope,
			'token',
			'token',
			getProofField(
				proofOrEnvelope,
				'proofToken',
				'proof_token',
				getProofField(
					proofOrEnvelope,
					'reviewApprovalProofToken',
					'review_approval_proof_token'
				)
			)
		)
	);

	if ( ! token ) {
		return null;
	}

	const normalizedPost = normalizeProofEnvelopePost(
		getProofField( proofOrEnvelope, 'post', 'post', {
			id: getProofField( proofOrEnvelope, 'postId', 'post_id' ),
			type: getProofField( proofOrEnvelope, 'postType', 'post_type' ),
		} )
	);
	const normalized = {
		proof_envelope_type:
			DISTRIBUTED_EDITING_OPAQUE_REVIEW_APPROVAL_PROOF_TOKEN_ENVELOPE_TYPE,
		token,
		token_version: normalizeProofPositiveInteger(
			getProofField( proofOrEnvelope, 'tokenVersion', 'token_version' )
		),
		issued_at: normalizeProofPositiveInteger(
			getProofField( proofOrEnvelope, 'issuedAt', 'issued_at' )
		),
		expires_at: normalizeProofPositiveInteger(
			getProofField( proofOrEnvelope, 'expiresAt', 'expires_at' )
		),
		post: normalizedPost,
	};

	for ( const [ key, value ] of Object.entries( normalized ) ) {
		if (
			value === undefined ||
			value === null ||
			( typeof value === 'object' &&
				! Array.isArray( value ) &&
				Object.keys( value ).length === 0 )
		) {
			delete normalized[ key ];
		}
	}

	return normalized;
}

function getReviewApprovalProofEnvelopeType( proofOrEnvelope ) {
	if ( ! proofOrEnvelope || typeof proofOrEnvelope !== 'object' ) {
		return null;
	}

	return normalizeProofString(
		proofOrEnvelope.proofEnvelopeType ?? proofOrEnvelope.proof_envelope_type
	);
}

function normalizeProofEnvelopePost( post ) {
	if ( ! post || typeof post !== 'object' || Array.isArray( post ) ) {
		return null;
	}

	const id = normalizeProofPositiveInteger( post.id );
	const type = normalizeProofString( post.type );

	if ( ! id && ! type ) {
		return null;
	}

	return {
		...( id ? { id } : {} ),
		...( type ? { type } : {} ),
	};
}

function normalizeProofString( value ) {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function normalizeProofStringList( value ) {
	return Array.isArray( value )
		? value
				.map( normalizeProofString )
				.filter( ( item ) => item !== undefined )
		: undefined;
}

function containsRawContentEvidence( value ) {
	if ( Array.isArray( value ) ) {
		return value.some( containsRawContentEvidence );
	}

	if ( ! value || typeof value !== 'object' ) {
		return false;
	}

	const forbiddenRawContentKeys = new Set( [
		'rawContent',
		'raw_content',
		'postContent',
		'post_content',
		'proposedPostContent',
		'proposed_post_content',
		'reviewedPostContent',
		'reviewed_post_content',
		'candidatePostContent',
		'candidate_post_content',
		'blockContent',
		'block_content',
		'rawBlockContent',
		'raw_block_content',
	] );

	for ( const [ key, nestedValue ] of Object.entries( value ) ) {
		if ( forbiddenRawContentKeys.has( key ) ) {
			return true;
		}

		if (
			[
				'rawContentIncluded',
				'raw_content_included',
				'exposesRawContent',
				'exposes_raw_content',
			].includes( key ) &&
			Boolean( nestedValue )
		) {
			return true;
		}

		if ( containsRawContentEvidence( nestedValue ) ) {
			return true;
		}
	}

	return false;
}

function containsClientIdEvidence( value ) {
	if ( Array.isArray( value ) ) {
		return value.some( containsClientIdEvidence );
	}

	if ( ! value || typeof value !== 'object' ) {
		return false;
	}

	const forbiddenClientIdKeys = new Set( [
		'clientId',
		'client_id',
		'blockClientId',
		'block_client_id',
	] );

	for ( const [ key, nestedValue ] of Object.entries( value ) ) {
		if ( forbiddenClientIdKeys.has( key ) ) {
			return true;
		}

		if ( containsClientIdEvidence( nestedValue ) ) {
			return true;
		}
	}

	return false;
}

function normalizeProofPositiveInteger( value ) {
	const number = Number( value );

	return Number.isInteger( number ) && number > 0 ? number : undefined;
}

function normalizeProofPositiveIntegerOrNull( value ) {
	if ( value === null ) {
		return null;
	}

	return normalizeProofPositiveInteger( value );
}

function normalizeProofNonNegativeInteger( value ) {
	const number = Number( value );

	return Number.isInteger( number ) && number >= 0 ? number : undefined;
}

function normalizeProofNonNegativeIntegerList( value ) {
	return Array.isArray( value ) &&
		value.every(
			( item ) => normalizeProofNonNegativeInteger( item ) !== undefined
		)
		? value.map( normalizeProofNonNegativeInteger )
		: undefined;
}

function getProofField( object, camelKey, snakeKey, fallback = undefined ) {
	const hasOwn = Object.prototype.hasOwnProperty;

	if ( hasOwn.call( object, camelKey ) ) {
		return object[ camelKey ];
	}

	if ( hasOwn.call( object, snakeKey ) ) {
		return object[ snakeKey ];
	}

	return fallback;
}

/**
 * Requests reviewer approval proof for a retry-save review rejection.
 *
 * This low-level helper sends only proof metadata and hash evidence. It does
 * not send raw post content, save, call retry-save, dispatch notices, persist
 * editor state, or change post locks.
 *
 * @param {Object} args                                    Request args.
 * @param {number} args.postId                             Post ID.
 * @param {string} [args.restBase='posts']                 REST base for the edited post type.
 * @param {string} args.clientBaseVersion                  Client sync version being reviewed.
 * @param {string} [args.acceptedProofServerVersion]       Server version reviewed by the approver.
 * @param {number} [args.pendingChangeCount=1]             Pending local change groups.
 * @param {string} [args.reviewAction]                     Review action requested by the server.
 * @param {string} [args.reviewRequiredCapability]         Capability required to review the change.
 * @param {string} [args.reviewerCapability]               Capability held by the reviewer.
 * @param {string} [args.reviewScope]                      Review scope.
 * @param {string} [args.proposedPostContentHash]          Hash of proposed post content.
 * @param {string} [args.reviewedProposedPostContentHash]  Reviewer-approved proposed content hash.
 * @param {string} [args.candidatePostContentHash]         Hash of server candidate post content.
 * @param {string} [args.reviewedCandidatePostContentHash] Reviewer-approved candidate content hash.
 * @param {string} [args.filteredProposedPostContentHash]  Hash of KSES-filtered proposed content.
 * @param {string} [args.filteredCandidatePostContentHash] Hash of KSES-filtered candidate content.
 * @param {Array}  [args.reviewedBlockItems]               Hash-only approved risky block review items.
 * @param {string} [args.reviewApprovalProof]              Opaque reviewer approval proof.
 *
 * @return {Promise<Object>} REST response or error.
 */
export function __experimentalRequestDistributedEditingRetrySaveReviewApprovalProof( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
	clientBaseVersion,
	acceptedProofServerVersion,
	pendingChangeCount = 1,
	reviewAction,
	reviewRequiredCapability,
	reviewerCapability,
	reviewScope,
	proposedPostContentHash,
	reviewedProposedPostContentHash,
	candidatePostContentHash,
	reviewedCandidatePostContentHash,
	filteredProposedPostContentHash,
	filteredCandidatePostContentHash,
	reviewedBlockItems,
	reviewApprovalProof,
} = {} ) {
	const data = {
		client_base_version: clientBaseVersion,
		pending_change_count: pendingChangeCount,
	};

	if ( acceptedProofServerVersion ) {
		data.accepted_proof_server_version = acceptedProofServerVersion;
	}

	if ( reviewAction ) {
		data.review_action = reviewAction;
	}

	if ( reviewRequiredCapability ) {
		data.review_required_capability = reviewRequiredCapability;
	}

	if ( reviewerCapability ) {
		data.reviewer_capability = reviewerCapability;
	}

	if ( reviewScope ) {
		data.review_scope = reviewScope;
	}

	if ( proposedPostContentHash ) {
		data.proposed_post_content_hash = proposedPostContentHash;
		data.reviewed_proposed_content_hash =
			reviewedProposedPostContentHash || proposedPostContentHash;
	}

	if ( candidatePostContentHash ) {
		data.candidate_post_content_hash = candidatePostContentHash;
		data.reviewed_candidate_content_hash =
			reviewedCandidatePostContentHash || candidatePostContentHash;
	}

	if ( filteredProposedPostContentHash ) {
		data.kses_filtered_proposed_content_hash =
			filteredProposedPostContentHash;
	}

	if ( filteredCandidatePostContentHash ) {
		data.kses_filtered_candidate_content_hash =
			filteredCandidatePostContentHash;
	}

	const normalizedReviewedBlockItems =
		normalizeReviewedBlockItemsForRequest( reviewedBlockItems );

	if ( normalizedReviewedBlockItems.length > 0 ) {
		data.reviewed_block_items = normalizedReviewedBlockItems;
	}

	if ( reviewApprovalProof ) {
		data.review_approval_proof = reviewApprovalProof;
	}

	return apiFetch( {
		path: getDistributedEditingRetrySaveReviewApprovalEndpointPath( {
			postId,
			restBase,
		} ),
		method: 'POST',
		data,
	} );
}

/**
 * Requests a fresh admin review for imported local updates that cannot reuse
 * stale or unavailable accepted proof.
 *
 * This low-level helper sends only route, version, status, and hash evidence.
 * It does not send raw post content, proof tokens, proof signatures, reviewed
 * block items, reviewer/saver ids, save, retry-save, dispatch notices, persist
 * editor state, or change post locks.
 *
 * @param {Object} args                                                   Request args.
 * @param {number} args.postId                                            Post ID.
 * @param {string} [args.restBase='posts']                                REST base for the edited post type.
 * @param {string} [args.clientBaseVersion]                               Client sync version from the blocked handoff.
 * @param {string} [args.serverVersion]                                   Server sync version from the blocked handoff.
 * @param {number} [args.pendingChangeCount=1]                            Pending local change groups.
 * @param {string} [args.proposedPostContentHash]                         SHA-256 hash of protected proposed post content.
 * @param {string} [args.localUpdatesImportStatus]                        Current import status.
 * @param {string} [args.localUpdatesImportReason]                        Current import blocker reason.
 * @param {string} [args.freshReviewRequestStatus]                        Current fresh-review request status.
 * @param {string} [args.freshReviewRequestAction='request_admin_review'] Fresh-review action requested.
 *
 * @return {Promise<Object>} REST response or error.
 */
export function __experimentalRequestDistributedEditingFreshReviewForImportedLocalUpdates( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
	clientBaseVersion,
	serverVersion,
	pendingChangeCount = 1,
	proposedPostContentHash,
	localUpdatesImportStatus,
	localUpdatesImportReason,
	freshReviewRequestStatus,
	freshReviewRequestAction = 'request_admin_review',
} = {} ) {
	const data = {
		pending_change_count: pendingChangeCount,
		fresh_review_request_action: freshReviewRequestAction,
	};

	if ( clientBaseVersion ) {
		data.client_base_version = clientBaseVersion;
	}

	if ( serverVersion ) {
		data.server_version = serverVersion;
	}

	if ( proposedPostContentHash ) {
		data.proposed_post_content_hash = proposedPostContentHash;
	}

	if ( localUpdatesImportStatus ) {
		data.local_updates_import_status = localUpdatesImportStatus;
	}

	if ( localUpdatesImportReason ) {
		data.local_updates_import_reason = localUpdatesImportReason;
	}

	if ( freshReviewRequestStatus ) {
		data.fresh_review_request_status = freshReviewRequestStatus;
	}

	return apiFetch( {
		path: getDistributedEditingFreshReviewRequestEndpointPath( {
			postId,
			restBase,
		} ),
		method: 'POST',
		data,
	} );
}

/**
 * Requests a server-backed fresh-review decision using hash-only evidence.
 *
 * This low-level helper does not save, retry-save, submit raw content,
 * dispatch notices, persist editor state, or change post locks.
 *
 * @param {Object} args                                  Request args.
 * @param {number} args.postId                           Post ID.
 * @param {string} [args.restBase='posts']               REST base for the edited post type.
 * @param {string} args.freshReviewRequestRecordId       Opaque fresh-review request record ID.
 * @param {string} args.clientBaseVersion                Client base version from the request.
 * @param {string} args.serverVersion                    Current server sync version.
 * @param {string} [args.freshReviewDecision='approved'] Reviewer decision.
 * @param {string} args.proposedPostContentHash          Hash of proposed post content.
 * @param {string} [args.reviewedProposedContentHash]    Reviewer-confirmed proposed content hash.
 * @param {string} [args.candidatePostContentHash]       Optional candidate hash.
 * @param {string} [args.reviewedCandidateContentHash]   Optional reviewer-confirmed candidate hash.
 * @param {Array}  [args.reviewedBlockItems]             Hash-only reviewed block items.
 *
 * @return {Promise<Object>} REST response or error.
 */
export function __experimentalRequestDistributedEditingFreshReviewDecision( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
	freshReviewRequestRecordId,
	clientBaseVersion,
	serverVersion,
	freshReviewDecision = 'approved',
	proposedPostContentHash,
	reviewedProposedContentHash,
	candidatePostContentHash,
	reviewedCandidateContentHash,
	reviewedBlockItems = [],
} = {} ) {
	const data = {
		fresh_review_decision: freshReviewDecision,
		reviewed_block_items:
			normalizeReviewedBlockItemsForRequest( reviewedBlockItems ),
	};

	if ( freshReviewRequestRecordId ) {
		data.fresh_review_request_record_id = freshReviewRequestRecordId;
	}

	if ( clientBaseVersion ) {
		data.client_base_version = clientBaseVersion;
	}

	if ( serverVersion ) {
		data.server_version = serverVersion;
	}

	if ( proposedPostContentHash ) {
		data.proposed_post_content_hash = proposedPostContentHash;
		data.reviewed_proposed_content_hash =
			reviewedProposedContentHash || proposedPostContentHash;
	}

	if ( candidatePostContentHash ) {
		data.candidate_post_content_hash = candidatePostContentHash;
		data.reviewed_candidate_content_hash =
			reviewedCandidateContentHash || candidatePostContentHash;
	}

	return apiFetch( {
		path: getDistributedEditingFreshReviewDecisionEndpointPath( {
			postId,
			restBase,
		} ),
		method: 'POST',
		data,
	} );
}

/**
 * Validates a recorded fresh-review decision for a future retry-save handoff.
 *
 * This low-level helper sends only hash and version evidence. It does not send
 * raw post content, save, retry-save, dispatch notices, persist editor state,
 * resolve proof tokens, or change post locks.
 *
 * @param {Object} args                                Request args.
 * @param {number} args.postId                         Post ID.
 * @param {string} [args.restBase='posts']             REST base for the edited post type.
 * @param {string} args.freshReviewRequestRecordId     Opaque fresh-review request record ID.
 * @param {string} args.clientBaseVersion              Client base version from the recorded decision.
 * @param {string} args.serverVersion                  Current server sync version.
 * @param {string} args.proposedPostContentHash        Hash of proposed post content.
 * @param {string} [args.reviewedProposedContentHash]  Reviewer-confirmed proposed content hash.
 * @param {string} [args.candidatePostContentHash]     Optional candidate hash.
 * @param {string} [args.reviewedCandidateContentHash] Optional reviewer-confirmed candidate hash.
 *
 * @return {Promise<Object>} REST response or error.
 */
export function __experimentalRequestDistributedEditingFreshReviewRetrySaveHandoffValidation( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
	freshReviewRequestRecordId,
	clientBaseVersion,
	serverVersion,
	proposedPostContentHash,
	reviewedProposedContentHash,
	candidatePostContentHash,
	reviewedCandidateContentHash,
} = {} ) {
	const data = {};

	if ( freshReviewRequestRecordId ) {
		data.fresh_review_request_record_id = freshReviewRequestRecordId;
	}

	if ( clientBaseVersion ) {
		data.client_base_version = clientBaseVersion;
	}

	if ( serverVersion ) {
		data.server_version = serverVersion;
	}

	if ( proposedPostContentHash ) {
		data.proposed_post_content_hash = proposedPostContentHash;
		data.reviewed_proposed_content_hash =
			reviewedProposedContentHash || proposedPostContentHash;
	}

	if ( candidatePostContentHash ) {
		data.candidate_post_content_hash = candidatePostContentHash;
		data.reviewed_candidate_content_hash =
			reviewedCandidateContentHash || candidatePostContentHash;
	}

	return apiFetch( {
		path: getDistributedEditingFreshReviewConsumeEndpointPath( {
			postId,
			restBase,
		} ),
		method: 'POST',
		data,
	} );
}

function normalizeReviewedBlockItemsForRequest(
	reviewedBlockItems,
	{ preserveSignedShape = false } = {}
) {
	if ( ! Array.isArray( reviewedBlockItems ) ) {
		return [];
	}

	return reviewedBlockItems
		.map( ( item ) =>
			normalizeReviewedBlockItemForRequest( item, {
				preserveSignedShape,
			} )
		)
		.filter( ( item ) => item.id );
}

function normalizeReviewedBlockItemForRequest(
	item = {},
	{ preserveSignedShape = false } = {}
) {
	const hasOwn = Object.prototype.hasOwnProperty;
	const hasBaseContentHash =
		hasOwn.call( item, 'baseContentHash' ) ||
		hasOwn.call( item, 'base_content_hash' );
	const hasKsesFilteredContentHash =
		hasOwn.call( item, 'ksesFilteredContentHash' ) ||
		hasOwn.call( item, 'kses_filtered_content_hash' );
	const proposedContentHash = getProofField(
		item,
		'proposedContentHash',
		'proposed_content_hash',
		null
	);
	const reviewedProposedContentHash =
		getProofField(
			item,
			'reviewedProposedContentHash',
			'reviewed_proposed_content_hash'
		) ?? proposedContentHash;
	const blockPath = getProofField( item, 'blockPath', 'block_path' );
	const blockClientId = getNormalizedBlockItemStringField(
		item,
		'blockClientId',
		'block_client_id',
		preserveSignedShape
	);
	const blockName = getNormalizedBlockItemStringField(
		item,
		'blockName',
		'block_name',
		preserveSignedShape
	);
	const blockLabel = getNormalizedBlockItemStringField(
		item,
		'blockLabel',
		'block_label',
		preserveSignedShape
	);
	const changeKind = getNormalizedBlockItemStringField(
		item,
		'changeKind',
		'change_kind',
		preserveSignedShape
	);
	const riskReason = getNormalizedBlockItemStringField(
		item,
		'riskReason',
		'risk_reason',
		preserveSignedShape
	);
	let normalizedBlockPath;
	if ( Array.isArray( blockPath ) ) {
		normalizedBlockPath = blockPath;
	} else if ( preserveSignedShape ) {
		normalizedBlockPath = [];
	}

	let baseContentHash;
	if ( preserveSignedShape ) {
		baseContentHash = getProofField(
			item,
			'baseContentHash',
			'base_content_hash',
			null
		);
	} else if ( hasBaseContentHash ) {
		baseContentHash = getProofField(
			item,
			'baseContentHash',
			'base_content_hash'
		);
	}

	let ksesFilteredContentHash;
	if ( preserveSignedShape ) {
		ksesFilteredContentHash = getProofField(
			item,
			'ksesFilteredContentHash',
			'kses_filtered_content_hash',
			null
		);
	} else if ( hasKsesFilteredContentHash ) {
		ksesFilteredContentHash = getProofField(
			item,
			'ksesFilteredContentHash',
			'kses_filtered_content_hash'
		);
	}
	const normalized = {
		id: item.id ?? null,
		block_client_id: blockClientId,
		block_name: blockName,
		block_label: blockLabel,
		block_path: normalizedBlockPath,
		change_kind: changeKind,
		risk_reason: riskReason,
		base_content_hash: baseContentHash,
		proposed_content_hash: proposedContentHash,
		reviewed_proposed_content_hash: reviewedProposedContentHash,
		kses_filtered_content_hash: ksesFilteredContentHash,
		review_status:
			getProofField( item, 'reviewStatus', 'review_status' ) ??
			'approved_for_retry_save',
		review_evidence_type:
			getProofField(
				item,
				'reviewEvidenceType',
				'review_evidence_type'
			) ?? 'kses_block_hash_only_change',
		content_review_policy:
			getProofField(
				item,
				'contentReviewPolicy',
				'content_review_policy'
			) ?? 'kses',
		raw_content_included: false,
		exposes_raw_content: false,
	};

	for ( const [ key, value ] of Object.entries( normalized ) ) {
		if (
			value === undefined ||
			( ! preserveSignedShape &&
				value === null &&
				key !== 'base_content_hash' &&
				key !== 'kses_filtered_content_hash' )
		) {
			delete normalized[ key ];
		}
	}

	return normalized;
}

function getNormalizedBlockItemStringField(
	item,
	camelKey,
	snakeKey,
	preserveSignedShape
) {
	const value = getProofField( item, camelKey, snakeKey );

	return preserveSignedShape ? value ?? '' : value;
}

/**
 * Refetches the current DE-RTC post snapshot for a stale-base session.
 *
 * This helper reads the post only. It does not save, apply the response to the
 * editor entity, rebase local edits, retry a submit, or change post locks.
 *
 * @param {Object} args                    Request args.
 * @param {number} args.postId             Post ID.
 * @param {string} [args.restBase='posts'] REST base for the edited post type.
 * @param {string} [args.stateHash]        Opaque snapshot validator from the last server response.
 *
 * @return {Promise<Object>} REST response.
 */
export async function __experimentalRequestDistributedEditingServerStateRefetch( {
	postId,
	restBase = DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
	stateHash,
} = {} ) {
	const headers = {};
	const normalizedStateHash =
		typeof stateHash === 'string' ? stateHash.trim() : '';

	if ( normalizedStateHash ) {
		headers[ 'If-None-Match' ] = `"${ normalizedStateHash }"`;
	}

	let response;

	try {
		response = await apiFetch( {
			path: `${ getDistributedEditingServerStateEndpointPath( {
				postId,
				restBase,
			} ) }?_envelope=1`,
			method: 'GET',
			headers,
			parse: false,
		} );
	} catch ( error ) {
		if ( error?.status === 304 && typeof error?.json === 'function' ) {
			response = error;
		} else {
			throw error;
		}
	}

	return normalizeDistributedEditingPostSnapshotResponse(
		response,
		normalizedStateHash
	);
}

async function normalizeDistributedEditingPostSnapshotResponse(
	response,
	requestedStateHash
) {
	if ( isDistributedEditingRestEnvelope( response ) ) {
		return normalizeDistributedEditingPostSnapshotEnvelope(
			response,
			requestedStateHash
		);
	}

	if (
		! response ||
		typeof response.status !== 'number' ||
		typeof response.json !== 'function'
	) {
		return response;
	}

	const responseStateHash =
		getDistributedEditingStateHashFromResponseHeaders( response ) ||
		requestedStateHash;

	if ( response.status === 304 ) {
		return {
			result: 'distributed_editing_post_not_modified',
			not_modified: true,
			state_hash: responseStateHash,
		};
	}

	const data = await response.json();

	if ( isDistributedEditingRestEnvelope( data ) ) {
		return normalizeDistributedEditingPostSnapshotEnvelope(
			data,
			requestedStateHash,
			responseStateHash
		);
	}

	if ( data && typeof data === 'object' && ! Array.isArray( data ) ) {
		return {
			...data,
			state_hash: data.state_hash || responseStateHash,
		};
	}

	return data;
}

function normalizeDistributedEditingPostSnapshotEnvelope(
	envelope,
	requestedStateHash,
	responseStateHash = ''
) {
	const envelopeBody = envelope.body;
	const envelopeStateHash =
		getDistributedEditingStateHashFromHeaderMap( envelope.headers ) ||
		getDistributedEditingStateHashFromSnapshotData( envelopeBody ) ||
		responseStateHash ||
		requestedStateHash;

	if ( envelope.status === 304 ) {
		return {
			result: 'distributed_editing_post_not_modified',
			not_modified: true,
			state_hash: envelopeStateHash,
		};
	}

	if ( envelope.status < 200 || envelope.status >= 300 ) {
		if (
			envelopeBody &&
			typeof envelopeBody === 'object' &&
			! Array.isArray( envelopeBody )
		) {
			throw envelopeBody;
		}

		throw {
			code: 'distributed_editing_enveloped_response_error',
			message: 'Distributed Editing server-state request failed.',
			data: {
				status: envelope.status,
			},
		};
	}

	if (
		envelopeBody &&
		typeof envelopeBody === 'object' &&
		! Array.isArray( envelopeBody )
	) {
		return {
			...envelopeBody,
			state_hash:
				getDistributedEditingStateHashFromSnapshotData(
					envelopeBody
				) || envelopeStateHash,
		};
	}

	return envelopeBody;
}

function isDistributedEditingRestEnvelope( value ) {
	return Boolean(
		value &&
			typeof value === 'object' &&
			! Array.isArray( value ) &&
			typeof value.status === 'number' &&
			Object.prototype.hasOwnProperty.call( value, 'body' ) &&
			Object.prototype.hasOwnProperty.call( value, 'headers' )
	);
}

function getDistributedEditingStateHashFromResponseHeaders( response ) {
	const rawHeader = response?.headers?.get?.( 'ETag' );

	return normalizeDistributedEditingStateHashHeader( rawHeader );
}

function getDistributedEditingStateHashFromHeaderMap( headers ) {
	if ( ! headers || typeof headers !== 'object' ) {
		return '';
	}

	const rawHeader = headers.ETag || headers.Etag || headers.etag;

	return normalizeDistributedEditingStateHashHeader( rawHeader );
}

function normalizeDistributedEditingStateHashHeader( rawHeader ) {
	if ( typeof rawHeader !== 'string' ) {
		return '';
	}

	return rawHeader.replace( /^W\//i, '' ).trim().replace( /^"|"$/g, '' );
}

function getDistributedEditingStateHashFromSnapshotData( data ) {
	if ( ! data || typeof data !== 'object' || Array.isArray( data ) ) {
		return '';
	}

	return (
		data.state_hash ||
		data.data?.state_hash ||
		data.distributed_editing?.state_hash ||
		data.data?.distributed_editing?.state_hash ||
		''
	);
}
