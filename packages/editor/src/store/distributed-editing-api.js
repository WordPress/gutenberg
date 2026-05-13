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
