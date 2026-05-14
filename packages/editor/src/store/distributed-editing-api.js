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
 * @param {Object}  [args.acceptedReviewApprovalProof]           Hash-only review approval proof.
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

	return apiFetch( {
		path: getDistributedEditingRetrySaveEndpointPath( {
			postId,
			restBase,
		} ),
		method: 'POST',
		data,
	} );
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
 * @param {Object} args                                          Request args.
 * @param {number} args.postId                                   Post ID.
 * @param {string} [args.restBase='posts']                       REST base for the edited post type.
 * @param {string} [args.clientBaseVersion]                      Client sync version from the blocked handoff.
 * @param {string} [args.serverVersion]                          Server sync version from the blocked handoff.
 * @param {number} [args.pendingChangeCount=1]                   Pending local change groups.
 * @param {string} [args.proposedPostContentHash]                SHA-256 hash of protected proposed post content.
 * @param {string} [args.localUpdatesImportStatus]               Current import status.
 * @param {string} [args.localUpdatesImportReason]               Current import blocker reason.
 * @param {string} [args.freshReviewRequestStatus]               Current fresh-review request status.
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
 * @param {Object} args                                      Request args.
 * @param {number} args.postId                               Post ID.
 * @param {string} [args.restBase='posts']                   REST base for the edited post type.
 * @param {string} args.freshReviewRequestRecordId           Opaque fresh-review request record ID.
 * @param {string} args.clientBaseVersion                    Client base version from the request.
 * @param {string} args.serverVersion                        Current server sync version.
 * @param {string} [args.freshReviewDecision='approved']     Reviewer decision.
 * @param {string} args.proposedPostContentHash              Hash of proposed post content.
 * @param {string} [args.reviewedProposedContentHash]        Reviewer-confirmed proposed content hash.
 * @param {string} [args.candidatePostContentHash]           Optional candidate hash.
 * @param {string} [args.reviewedCandidateContentHash]       Optional reviewer-confirmed candidate hash.
 * @param {Array}  [args.reviewedBlockItems]                 Hash-only reviewed block items.
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
