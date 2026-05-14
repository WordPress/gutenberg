/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import deprecated from '@wordpress/deprecated';
import {
	parse,
	synchronizeBlocksWithTemplate,
	__unstableSerializeAndClean,
} from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	applyFilters,
	applyFiltersAsync,
	doActionAsync,
} from '@wordpress/hooks';
import { store as preferencesStore } from '@wordpress/preferences';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { localAutosaveSet } from './local-autosave';
import {
	__experimentalRequestDistributedEditingRecoveryDryRun as requestDistributedEditingRecoveryDryRun,
	__experimentalRequestDistributedEditingRetrySave as requestDistributedEditingRetrySave,
	__experimentalRequestDistributedEditingRetrySaveReviewApprovalProof as requestDistributedEditingRetrySaveReviewApprovalProof,
	__experimentalRequestDistributedEditingRetrySubmitProbe as requestDistributedEditingRetrySubmitProbe,
	__experimentalRequestDistributedEditingServerStateRefetch as requestDistributedEditingServerStateRefetch,
	__experimentalRequestDistributedEditingStaleBaseRejection as requestDistributedEditingStaleBaseRejection,
	DISTRIBUTED_EDITING_RECOVERY_REST_BASE,
} from './distributed-editing-api';
import {
	getDistributedEditingSessionStateForRecoveryDryRunResult,
	getDistributedEditingSessionStateForRetrySaveHandoff,
	getDistributedEditingSessionStateForRetrySaveReviewApprovalProofResult,
	getDistributedEditingSessionStateForRetrySaveRequest,
	getDistributedEditingSessionStateForRetrySaveResult,
	getDistributedEditingSessionStateForRiskyBlockReviewItemResolution,
	getDistributedEditingSessionStateForRetrySubmitHandoff,
	getDistributedEditingSessionStateForRetrySubmitProofResult,
	getDistributedEditingSessionStateForRetrySubmitSavePreparation,
	getDistributedEditingRetrySavePolicyForSessionState,
	DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS,
	getDistributedEditingStaleBaseLocalRebaseResult,
	getDistributedEditingSessionStateForStaleBaseLocalRebasePlan,
	getDistributedEditingSessionStateForStaleBaseRejectionResult,
	getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult,
	hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState,
} from './distributed-editing';
import {
	getNotificationArgumentsForSaveSuccess,
	getNotificationArgumentsForSaveFail,
	getNotificationArgumentsForTrashFail,
} from './utils/notice-builder';
import { unlock } from '../lock-unlock';
/**
 * Returns an action generator used in signalling that editor has initialized with
 * the specified post object and editor settings.
 *
 * @param {Object} post       Post object.
 * @param {Object} edits      Initial edited attributes object.
 * @param {Array}  [template] Block Template.
 */
export const setupEditor =
	( post, edits, template ) =>
	( { dispatch } ) => {
		dispatch.setEditedPost( post.type, post.id );
		// Apply a template for new posts only, if exists.
		const isNewPost = post.status === 'auto-draft';
		if ( isNewPost && template ) {
			// In order to ensure maximum of a single parse during setup, edits are
			// included as part of editor setup action. Assume edited content as
			// canonical if provided, falling back to post.
			let content;
			if ( 'content' in edits ) {
				content = edits.content;
			} else {
				content = post.content.raw;
			}
			let blocks = parse( content );
			blocks = synchronizeBlocksWithTemplate( blocks, template );
			dispatch.resetEditorBlocks( blocks, {
				__unstableShouldCreateUndoLevel: false,
			} );
		}
		if (
			edits &&
			Object.entries( edits ).some(
				( [ key, edit ] ) =>
					edit !== ( post[ key ]?.raw ?? post[ key ] )
			)
		) {
			dispatch.editPost( edits );
		}
	};

/**
 * Returns an action object signalling that the editor is being destroyed and
 * that any necessary state or side-effect cleanup should occur.
 *
 * @deprecated
 *
 * @return {Object} Action object.
 */
export function __experimentalTearDownEditor() {
	deprecated(
		"wp.data.dispatch( 'core/editor' ).__experimentalTearDownEditor",
		{
			since: '6.5',
		}
	);
	return { type: 'DO_NOTHING' };
}

/**
 * Returns an action object used in signalling that the latest version of the
 * post has been received, either by initialization or save.
 *
 * @deprecated Since WordPress 6.0.
 */
export function resetPost() {
	deprecated( "wp.data.dispatch( 'core/editor' ).resetPost", {
		since: '6.0',
		version: '6.3',
		alternative: 'Initialize the editor with the setupEditorState action',
	} );
	return { type: 'DO_NOTHING' };
}

/**
 * Returns an action object used in signalling that a patch of updates for the
 * latest version of the post have been received.
 *
 * @return {Object} Action object.
 * @deprecated since Gutenberg 9.7.0.
 */
export function updatePost() {
	deprecated( "wp.data.dispatch( 'core/editor' ).updatePost", {
		since: '5.7',
		alternative: 'Use the core entities store instead',
	} );
	return {
		type: 'DO_NOTHING',
	};
}

/**
 * Setup the editor state.
 *
 * @deprecated
 *
 * @param {Object} post Post object.
 */
export function setupEditorState( post ) {
	deprecated( "wp.data.dispatch( 'core/editor' ).setupEditorState", {
		since: '6.5',
		alternative: "wp.data.dispatch( 'core/editor' ).setEditedPost",
	} );
	return setEditedPost( post.type, post.id );
}

/**
 * Returns an action that sets the current post Type and post ID.
 *
 * @param {string} postType Post Type.
 * @param {string} postId   Post ID.
 *
 * @return {Object} Action object.
 */
export function setEditedPost( postType, postId ) {
	return {
		type: 'SET_EDITED_POST',
		postType,
		postId,
	};
}

/**
 * Returns an action object used in signalling that the distributed editing
 * session state should be replaced.
 *
 * @param {Object} sessionState Distributed editing session state.
 *
 * @return {Object} Action object.
 */
export function setDistributedEditingSessionState( sessionState = {} ) {
	return {
		type: 'SET_DISTRIBUTED_EDITING_SESSION_STATE',
		sessionState,
	};
}

/**
 * Returns an action object used in signalling that the distributed editing
 * session state should be partially updated.
 *
 * @param {Object} sessionState Partial distributed editing session state.
 *
 * @return {Object} Action object.
 */
export function updateDistributedEditingSessionState( sessionState = {} ) {
	return {
		type: 'UPDATE_DISTRIBUTED_EDITING_SESSION_STATE',
		sessionState,
	};
}

/**
 * Returns an action object used in signalling that the distributed editing
 * session state should be reset for the current editor.
 *
 * @return {Object} Action object.
 */
export function resetDistributedEditingSessionState() {
	return {
		type: 'RESET_DISTRIBUTED_EDITING_SESSION_STATE',
	};
}

/**
 * Opens the pre-publish review surface when DE-RTC risky-block policy requires
 * human review. This is a UI handoff only: it does not save, retry-save,
 * dispatch notices, mutate content, or change post locks.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalOpenDistributedEditingRiskyBlockReview =
	() =>
	( { select, dispatch } ) => {
		const savePolicy =
			select.getDistributedEditingSavePolicyState?.() || {};
		const shouldOpenPrePublishReview =
			savePolicy.opensPrePublishReview ||
			savePolicy.clickAction ===
				DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW;

		if ( ! shouldOpenPrePublishReview ) {
			return {
				status: 'pre_publish_review_not_required',
				opensPublishSidebar: false,
				focusesReviewPanel: false,
				savesPost: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			};
		}

		dispatch.openPublishSidebar();

		return {
			status: 'pre_publish_review_opened',
			opensPublishSidebar: true,
			focusesReviewPanel: true,
			reviewPanel: 'distributed_editing_risky_block_review',
			savesPost: false,
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
		};
	};

/**
 * Focuses the editor block represented by a DE-RTC risky-block review item.
 * Selecting a block is allowed for review ergonomics, but this action must not
 * edit block content, save, retry-save, dispatch notices, or change post locks.
 *
 * @param {string} reviewItemId Risky-block review item id.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalFocusDistributedEditingRiskyBlockReviewItem =
	( reviewItemId ) =>
	( { select, registry } ) => {
		const reviewState =
			select.getDistributedEditingRiskyBlockReviewState?.() || {};
		const reviewItem = Array.isArray( reviewState.reviewItems )
			? reviewState.reviewItems.find(
					( item ) => item.id === reviewItemId
			  )
			: null;

		if ( ! reviewItem ) {
			return {
				status: 'review_item_not_found',
				reviewItemId,
				selectsBlock: false,
				savesPost: false,
				mutatesEditorContent: false,
				changesPostLock: false,
				claimsSaved: false,
			};
		}

		if ( reviewItem.blockClientId ) {
			registry
				.dispatch( blockEditorStore )
				.selectBlock( reviewItem.blockClientId );
		}

		return {
			status: reviewItem.blockClientId
				? 'review_item_block_focused'
				: 'review_item_has_no_block_client_id',
			reviewItemId,
			blockClientId: reviewItem.blockClientId,
			selectsBlock: Boolean( reviewItem.blockClientId ),
			savesPost: false,
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
		};
	};

/**
 * Records a hash-only reviewer decision for one risky-block item. This updates
 * only local DE-RTC session state for a future guarded save handoff.
 *
 * @param {Object} resolution Review decision data.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalResolveDistributedEditingRiskyBlockReviewItem =
	( resolution = {} ) =>
	( { select, dispatch } ) => {
		const reviewItemId = resolution.reviewItemId || resolution.id;
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const currentItems = Array.isArray(
			currentSessionState.riskyBlockReviewItems
		)
			? currentSessionState.riskyBlockReviewItems
			: [];
		const currentItem = currentItems.find(
			( item ) => item.id === reviewItemId
		);

		if ( ! currentItem ) {
			return {
				status: 'review_item_not_found',
				reviewItemId,
				decision: resolution.decision || 'approved',
				savesPost: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			};
		}

		const sessionState =
			getDistributedEditingSessionStateForRiskyBlockReviewItemResolution(
				currentSessionState,
				resolution
			);
		const resolvedItem = sessionState.riskyBlockReviewItems.find(
			( item ) => item.id === reviewItemId
		);

		dispatch.setDistributedEditingSessionState( sessionState );

		return {
			status: 'review_item_resolved',
			reviewItemId,
			decision: resolution.decision || 'approved',
			reviewStatus: resolvedItem?.reviewStatus,
			pendingReviewItemCount: sessionState.riskyBlockReviewPendingCount,
			approvedReviewItemCount: sessionState.riskyBlockReviewApprovedCount,
			rejectedReviewItemCount: sessionState.riskyBlockReviewRejectedCount,
			saveClickAction: sessionState.riskyBlockReviewSaveClickAction,
			savesPost: false,
			callsNormalSavePost: false,
			callsRetrySaveEndpoint: false,
			dispatchesNotice: false,
			mutatesEditorContent: false,
			mutatesPersistedPostContent: false,
			changesPostLock: false,
			claimsSaved: false,
			sessionState,
		};
	};

/**
 * Routes a normal Save attempt into the risky-block review surface when DE-RTC
 * policy says unresolved HTML review must happen first. This is the Save-path
 * handoff only: it does not save, retry-save, call REST, dispatch notices,
 * mutate editor content, or change post locks.
 *
 * @param {Object} [options] Save options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalMaybeRouteSavePostToDistributedEditingRiskyBlockReview =

		( options = {} ) =>
		async ( { select, dispatch } ) => {
			const savePolicy =
				select.getDistributedEditingSavePolicyState?.() || {};
			const shouldUseRiskyBlockReview =
				select.shouldUseDistributedEditingRiskyBlockReviewForSavePost?.(
					options
				);

			if ( ! shouldUseRiskyBlockReview ) {
				return {
					status: 'normal_save_fallback',
					reason: null,
					policy: savePolicy,
					allowsNormalSaveFallback: true,
					blocksNormalSavePost: false,
					opensPrePublishReview: false,
					requiresServerStateRefetch: false,
					callsNormalSavePost: false,
					callsRetrySaveEndpoint: false,
					dispatchesNotice: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
				};
			}

			if (
				savePolicy.clickAction ===
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.REFETCH_SERVER_STATE ||
				savePolicy.requiresServerStateRefetch
			) {
				return {
					status: 'risky_block_review_refetch_required',
					reason: savePolicy.reason || 'risky_block_review_stale',
					policy: savePolicy,
					allowsNormalSaveFallback: false,
					blocksNormalSavePost: true,
					opensPrePublishReview: false,
					requiresServerStateRefetch: true,
					callsNormalSavePost: false,
					callsRetrySaveEndpoint: false,
					dispatchesNotice: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
				};
			}

			if (
				savePolicy.opensPrePublishReview ||
				savePolicy.clickAction ===
					DISTRIBUTED_EDITING_SAVE_POLICY_ACTIONS.OPEN_PRE_PUBLISH_REVIEW
			) {
				const openResult =
					await dispatch.__experimentalOpenDistributedEditingRiskyBlockReview();

				return {
					...openResult,
					status: openResult.status || 'pre_publish_review_opened',
					reason: savePolicy.reason || 'risky_block_review_required',
					policy: savePolicy,
					allowsNormalSaveFallback: false,
					blocksNormalSavePost: true,
					opensPrePublishReview: true,
					requiresServerStateRefetch: false,
					callsNormalSavePost: false,
					callsRetrySaveEndpoint: false,
					dispatchesNotice: false,
					mutatesEditorContent: false,
					mutatesPersistedPostContent: false,
					changesPostLock: false,
					claimsSaved: false,
				};
			}

			return {
				status: 'normal_save_fallback',
				reason: null,
				policy: savePolicy,
				allowsNormalSaveFallback: true,
				blocksNormalSavePost: false,
				opensPrePublishReview: false,
				requiresServerStateRefetch: false,
				callsNormalSavePost: false,
				callsRetrySaveEndpoint: false,
				dispatchesNotice: false,
				mutatesEditorContent: false,
				mutatesPersistedPostContent: false,
				changesPostLock: false,
				claimsSaved: false,
			};
		};

/**
 * Requests a Distributed Editing recovery dry run and stores inert status.
 *
 * The action does not save, apply recovery, replace post locks, dispatch
 * notices, or persist editor state. API errors are reflected into DE-RTC state
 * before being rethrown for callers that need command-level handling.
 *
 * @param {Object} [options] Request options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalRefreshDistributedEditingRecoveryDryRun =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;

		try {
			const response = await requestDistributedEditingRecoveryDryRun( {
				postId,
				restBase,
				candidatePostContentHash: options.candidatePostContentHash,
			} );

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForRecoveryDryRunResult(
					response
				)
			);

			return response;
		} catch ( error ) {
			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForRecoveryDryRunResult(
					error
				)
			);

			throw error;
		}
	};

/**
 * Requests a Distributed Editing stale-base rejection contract and stores state.
 *
 * The action does not save, apply recovery, refetch, rebase, retry, dispatch
 * notices, or persist editor state. The current REST contract is intentionally
 * an error response; the error is reflected into DE-RTC state before being
 * rethrown for callers that need command-level handling.
 *
 * @param {Object} [options]                   Request options.
 * @param {string} [options.clientBaseContent] Serialized content at the client base version.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalRefreshDistributedEditingStaleBaseRejection =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
		const requestArgs = {
			postId,
			restBase,
			clientBaseVersion: options.clientBaseVersion,
			serverVersion: options.serverVersion,
			pendingChangeCount: options.pendingChangeCount,
			remoteChangeCount: options.remoteChangeCount,
			canAttemptLocalRebase: options.canAttemptLocalRebase,
		};

		try {
			const response =
				await requestDistributedEditingStaleBaseRejection(
					requestArgs
				);

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForStaleBaseRejectionResult( {
					...response,
					clientBaseContent: options.clientBaseContent,
				} )
			);

			return response;
		} catch ( error ) {
			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForStaleBaseRejectionResult( {
					...error,
					clientBaseContent: options.clientBaseContent,
				} )
			);

			throw error;
		}
	};

/**
 * Refetches server state after a stale-base rejection and stores inert status.
 *
 * The action reads the latest post representation but does not apply it to the
 * editor, clear local changes, rebase, retry, save, dispatch notices, persist
 * editor state, or change post locks.
 *
 * @param {Object} [options] Request options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalRefreshDistributedEditingServerStateAfterStaleBase =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const response = await requestDistributedEditingServerStateRefetch( {
			postId,
			restBase,
		} );

		dispatch.setDistributedEditingSessionState(
			getDistributedEditingSessionStateForStaleBaseServerStateRefetchResult(
				response,
				currentSessionState
			)
		);

		return response;
	};

/**
 * Plans a local rebase after a stale-base server-state refetch.
 *
 * The action only records whether a later rebase attempt is locally possible.
 * It does not refetch, apply server content, modify blocks, retry a submit,
 * save, dispatch notices, persist editor state, or change post locks.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalPlanDistributedEditingLocalRebaseAfterStaleBase =
	() =>
	( { select, dispatch } ) => {
		const plannedSessionState =
			getDistributedEditingSessionStateForStaleBaseLocalRebasePlan(
				select.getDistributedEditingSessionState?.() || {}
			);

		dispatch.setDistributedEditingSessionState( plannedSessionState );

		return plannedSessionState;
	};

/**
 * Rebases local stale-base edits over refetched server content.
 *
 * The action computes a conservative serialized-block merge and applies the
 * merged candidate to the editor only when the merge is safe. It does not
 * refetch, retry a submit, save, dispatch notices, persist editor state, or
 * change post locks.
 *
 * @param {Object} options                   Rebase options.
 * @param {string} options.clientBaseContent Serialized content at the client base version.
 * @param {string} options.serverContent     Serialized content from the refetched server version.
 * @param {string} [options.localContent]    Serialized local editor content override.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalRebaseDistributedEditingLocalUpdatesAfterStaleBase =
	( options = {} ) =>
	( { select, dispatch } ) => {
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const result = getDistributedEditingStaleBaseLocalRebaseResult( {
			currentSessionState,
			clientBaseContent:
				options.clientBaseContent ??
				currentSessionState.clientBaseContent,
			serverContent:
				options.serverContent ??
				currentSessionState.refetchedServerContent,
			localContent:
				options.localContent ?? select.getEditedPostContent?.(),
		} );

		if ( result.hasCandidatePostContent ) {
			dispatch.editPost(
				{ content: result.candidatePostContent },
				{ undoIgnore: true }
			);
		}

		dispatch.setDistributedEditingSessionState( result.sessionState );

		return result;
	};

/**
 * Prepares the retry-submit handoff after a successful local rebase.
 *
 * The action consumes the inert `readyToRetrySubmit` flag and records that a
 * future save-path consumer may use the rebased editor content. It does not
 * submit to the server, call REST, save, dispatch notices, persist editor
 * state, or change post locks.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalPrepareDistributedEditingRetrySubmitAfterLocalRebase =
	() => {
		return ( { select, dispatch } ) => {
			const currentSessionState =
				select.getDistributedEditingSessionState?.() || {};
			const sessionState =
				getDistributedEditingSessionStateForRetrySubmitHandoff(
					currentSessionState
				);

			dispatch.setDistributedEditingSessionState( sessionState );

			return {
				status: sessionState.retrySubmitHandoffStatus,
				reason: sessionState.retrySubmitHandoffReason,
				consumesReadyToRetrySubmit:
					Boolean( currentSessionState.readyToRetrySubmit ) &&
					sessionState.retrySubmitPrepared,
				submitsToServer: false,
				savesPost: false,
				mutatesPersistedPostContent: false,
				claimsSaved: false,
				sessionState,
			};
		};
	};

/**
 * Requests the retry-submit proof endpoint and stores inert retry state.
 *
 * The action only records whether the prepared retry is still accepted for a
 * future save path. It does not save, dispatch notices, persist editor state,
 * mutate post content, create revisions, claim saved, or change post locks.
 *
 * @param {Object} [options] Request options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalRefreshDistributedEditingRetrySubmitProof =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const requestArgs = {
			postId,
			restBase,
			clientBaseVersion:
				options.clientBaseVersion ??
				currentSessionState.serverVersion ??
				currentSessionState.clientBaseVersion,
			rebasedFromVersion:
				options.rebasedFromVersion ??
				currentSessionState.clientBaseVersion,
			pendingChangeCount:
				options.pendingChangeCount ??
				currentSessionState.pendingChangeCount,
			proposedPostContentHash: options.proposedPostContentHash,
		};

		try {
			const response =
				await requestDistributedEditingRetrySubmitProbe( requestArgs );

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForRetrySubmitProofResult(
					response,
					currentSessionState
				)
			);

			return response;
		} catch ( error ) {
			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForRetrySubmitProofResult(
					error,
					currentSessionState
				)
			);

			throw error;
		}
	};

/**
 * Prepares accepted retry-submit proof for a future guarded save path.
 *
 * The action consumes no server resources and performs no persistence. It only
 * records whether the current accepted proof can be handed to a later save-path
 * consumer.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalPrepareDistributedEditingRetrySubmitSaveAfterProof =
	() =>
	( { select, dispatch } ) => {
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const sessionState =
			getDistributedEditingSessionStateForRetrySubmitSavePreparation(
				currentSessionState
			);

		dispatch.setDistributedEditingSessionState( sessionState );

		return {
			status: sessionState.retrySubmitSaveStatus,
			reason: sessionState.retrySubmitSaveReason,
			consumesAcceptedProof:
				Boolean( currentSessionState.retrySubmitAccepted ) &&
				sessionState.retrySubmitSaveReady,
			submitsToServer: false,
			savesPost: false,
			mutatesPersistedPostContent: false,
			claimsSaved: false,
			sessionState,
		};
	};

/**
 * Requests retry-save reviewer approval proof and stores inert proof state.
 *
 * The action sends only version, capability, scope, and hash evidence. It does
 * not call normal save, call retry-save, mutate editor content, dispatch
 * notices, persist editor state, create revisions, claim saved, or change post
 * locks.
 *
 * @param {Object} [options] Request options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalRefreshDistributedEditingRetrySaveReviewApprovalProof =

		( options = {} ) =>
		async ( { select, dispatch, registry } ) => {
			const currentPost = select.getCurrentPost?.() || {};
			const postType = options.postType || currentPost.type;
			const postId = options.postId ?? currentPost.id;
			const postTypeRecord = postType
				? registry.select( coreStore ).getPostType( postType )
				: null;
			const restBase =
				options.restBase ||
				postTypeRecord?.rest_base ||
				DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
			const currentSessionState =
				select.getDistributedEditingSessionState?.() || {};
			const requestArgs = {
				postId,
				restBase,
				clientBaseVersion:
					options.clientBaseVersion ??
					currentSessionState.serverVersion ??
					currentSessionState.clientBaseVersion,
				acceptedProofServerVersion:
					options.acceptedProofServerVersion ??
					options.reviewedServerVersion ??
					currentSessionState.retrySaveServerVersion ??
					currentSessionState.serverVersion,
				pendingChangeCount:
					options.pendingChangeCount ??
					currentSessionState.pendingChangeCount,
				reviewAction:
					options.reviewAction ??
					currentSessionState.retrySaveReviewAction,
				reviewRequiredCapability:
					options.reviewRequiredCapability ??
					currentSessionState.retrySaveReviewRequiredCapability,
				reviewerCapability:
					options.reviewerCapability ??
					currentSessionState.retrySaveReviewerCapability,
				reviewScope:
					options.reviewScope ??
					currentSessionState.retrySaveReviewScope,
				proposedPostContentHash:
					options.proposedPostContentHash ??
					currentSessionState.retrySaveReviewProposedContentHash,
				reviewedProposedPostContentHash:
					options.reviewedProposedPostContentHash ??
					options.proposedPostContentHash ??
					currentSessionState.retrySaveReviewProposedContentHash,
				candidatePostContentHash:
					options.candidatePostContentHash ??
					currentSessionState.retrySaveReviewCandidateContentHash,
				reviewedCandidatePostContentHash:
					options.reviewedCandidatePostContentHash ??
					options.candidatePostContentHash ??
					currentSessionState.retrySaveReviewCandidateContentHash,
				filteredProposedPostContentHash:
					options.filteredProposedPostContentHash ??
					currentSessionState.retrySaveReviewFilteredProposedContentHash,
				filteredCandidatePostContentHash:
					options.filteredCandidatePostContentHash ??
					currentSessionState.retrySaveReviewFilteredCandidateContentHash,
				reviewApprovalProof: options.reviewApprovalProof,
			};

			try {
				const response =
					await requestDistributedEditingRetrySaveReviewApprovalProof(
						requestArgs
					);

				dispatch.setDistributedEditingSessionState(
					getDistributedEditingSessionStateForRetrySaveReviewApprovalProofResult(
						response,
						currentSessionState
					)
				);

				return response;
			} catch ( error ) {
				dispatch.setDistributedEditingSessionState(
					getDistributedEditingSessionStateForRetrySaveReviewApprovalProofResult(
						error,
						currentSessionState
					)
				);

				throw error;
			}
		};

/**
 * Requests the guarded retry-save endpoint and stores the normalized result.
 *
 * This action is still separate from `savePost()`. It submits the explicit
 * retry-save proof request, records success or rejection in DE-RTC state, and
 * preserves pending/export protection unless the server confirms persistence.
 *
 * @param {Object} [options] Request options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalSaveDistributedEditingRetryAfterProof =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const pendingChangeCount =
			options.pendingChangeCount ??
			currentSessionState.pendingChangeCount;
		const savingSessionState =
			getDistributedEditingSessionStateForRetrySaveRequest(
				currentSessionState,
				{ pendingChangeCount }
			);
		const requestArgs = {
			postId,
			restBase,
			clientBaseVersion:
				options.clientBaseVersion ??
				currentSessionState.serverVersion ??
				currentSessionState.clientBaseVersion,
			acceptedProofServerVersion:
				options.acceptedProofServerVersion ??
				currentSessionState.serverVersion,
			rebasedFromVersion:
				options.rebasedFromVersion ??
				currentSessionState.clientBaseVersion,
			pendingChangeCount:
				pendingChangeCount ?? savingSessionState.pendingChangeCount,
			proposedPostContent:
				options.proposedPostContent ?? select.getEditedPostContent?.(),
			proposedPostContentHash: options.proposedPostContentHash,
			acceptedProofSavesPost:
				options.acceptedProofSavesPost ??
				currentSessionState.retrySubmitSavesPost,
			acceptedProofMutatesPostContent:
				options.acceptedProofMutatesPostContent ??
				currentSessionState.retrySubmitMutatesPostContent,
			acceptedProofCreatesRevision:
				options.acceptedProofCreatesRevision ??
				currentSessionState.retrySubmitCreatesRevision,
			acceptedProofClaimsSaved:
				options.acceptedProofClaimsSaved ??
				currentSessionState.retrySubmitClaimsSaved,
		};

		dispatch.setDistributedEditingSessionState( savingSessionState );

		try {
			const response =
				await requestDistributedEditingRetrySave( requestArgs );

			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForRetrySaveResult(
					response,
					savingSessionState
				)
			);

			return response;
		} catch ( error ) {
			dispatch.setDistributedEditingSessionState(
				getDistributedEditingSessionStateForRetrySaveResult(
					error,
					savingSessionState
				)
			);

			throw error;
		}
	};

/**
 * Consults the DE-RTC retry-save policy and performs the guarded retry-save
 * handoff only when the policy is ready.
 *
 * This is the first explicit bridge between save-flow code and the guarded
 * retry-save endpoint. It still does not call normal save itself. Callers may
 * continue to normal save only when the returned status is
 * `normal_save_fallback`.
 *
 * @param {Object} [options] Request and policy options.
 *
 * @return {Function} Action thunk.
 */
export const __experimentalMaybeSavePostWithDistributedEditingRetryPolicy =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		const currentPost = select.getCurrentPost?.() || {};
		const postType = options.postType || currentPost.type;
		const postId = options.postId ?? currentPost.id;
		const postTypeRecord = postType
			? registry.select( coreStore ).getPostType( postType )
			: null;
		const restBase =
			options.restBase ||
			postTypeRecord?.rest_base ||
			DISTRIBUTED_EDITING_RECOVERY_REST_BASE;
		const currentSessionState =
			select.getDistributedEditingSessionState?.() || {};
		const proposedPostContent =
			options.proposedPostContent ?? select.getEditedPostContent?.();
		const policy = getDistributedEditingRetrySavePolicyForSessionState(
			currentSessionState,
			{
				postId,
				restBase,
				proposedPostContent,
				clientBaseVersion: options.clientBaseVersion,
				acceptedProofServerVersion: options.acceptedProofServerVersion,
				rebasedFromVersion: options.rebasedFromVersion,
				pendingChangeCount: options.pendingChangeCount,
			}
		);

		if ( ! policy.canRetrySave ) {
			const allowsNormalSaveFallback = ! policy.protectsLocalChanges;
			const handoff = {
				status: allowsNormalSaveFallback
					? 'normal_save_fallback'
					: 'retry_save_blocked',
				reason: policy.reason,
				policy,
				allowsNormalSaveFallback,
				blocksNormalSavePost: ! allowsNormalSaveFallback,
				callsRetrySaveAction: false,
				callsNormalSavePost: false,
				response: null,
			};

			if ( ! allowsNormalSaveFallback ) {
				dispatch.setDistributedEditingSessionState(
					getDistributedEditingSessionStateForRetrySaveHandoff(
						currentSessionState,
						handoff
					)
				);
			}

			return handoff;
		}

		const response =
			await dispatch.__experimentalSaveDistributedEditingRetryAfterProof(
				{
					...policy.request,
					proposedPostContent,
					proposedPostContentHash: options.proposedPostContentHash,
					acceptedProofSavesPost: options.acceptedProofSavesPost,
					acceptedProofMutatesPostContent:
						options.acceptedProofMutatesPostContent,
					acceptedProofCreatesRevision:
						options.acceptedProofCreatesRevision,
					acceptedProofClaimsSaved: options.acceptedProofClaimsSaved,
				}
			);
		const sessionState = select.getDistributedEditingSessionState?.() || {};
		const hasSavedStateEvidence =
			hasDistributedEditingRetrySaveSavedStateEvidenceForSessionState(
				sessionState
			);

		return {
			status: 'retry_save_submitted',
			reason: null,
			policy,
			allowsNormalSaveFallback: false,
			callsRetrySaveAction: true,
			callsNormalSavePost: false,
			claimsSaved: hasSavedStateEvidence,
			hasRetrySaveSavedStateEvidence: hasSavedStateEvidence,
			sessionState,
			response,
		};
	};

/**
 * Returns an action object used in signalling that attributes of the post have
 * been edited.
 *
 * @param {Object} edits     Post attributes to edit.
 * @param {Object} [options] Options for the edit.
 *
 * @example
 * ```js
 * // Update the post title
 * wp.data.dispatch( 'core/editor' ).editPost( { title: `${ newTitle }` } );
 * ```
 *
 * @return {Object} Action object
 */
export const editPost =
	( edits, options ) =>
	( { select, registry } ) => {
		const { id, type } = select.getCurrentPost();
		registry
			.dispatch( coreStore )
			.editEntityRecord( 'postType', type, id, edits, options );
	};

/**
 * Action for saving the current post in the editor.
 *
 * @param {Object} [options]
 */
export const savePost =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
		if ( ! select.isEditedPostSaveable() ) {
			return;
		}

		const riskyBlockReviewRouting =
			await dispatch.__experimentalMaybeRouteSavePostToDistributedEditingRiskyBlockReview(
				options
			);

		if ( ! riskyBlockReviewRouting.allowsNormalSaveFallback ) {
			return riskyBlockReviewRouting;
		}

		const content = select.getEditedPostContent();
		dispatch.editPost( { content }, { undoIgnore: true } );

		if (
			select.shouldUseDistributedEditingRetrySaveForSavePost( options )
		) {
			const retrySaveHandoff =
				await dispatch.__experimentalMaybeSavePostWithDistributedEditingRetryPolicy(
					{
						...options,
						proposedPostContent: content,
					}
				);

			if ( ! retrySaveHandoff.allowsNormalSaveFallback ) {
				return retrySaveHandoff;
			}
		}

		const previousRecord = select.getCurrentPost();
		let edits = {
			id: previousRecord.id,
			...registry
				.select( coreStore )
				.getEntityRecordNonTransientEdits(
					'postType',
					previousRecord.type,
					previousRecord.id
				),
			content,
		};
		dispatch( { type: 'REQUEST_POST_UPDATE_START', options } );

		let error = false;
		try {
			edits = await applyFiltersAsync(
				'editor.preSavePost',
				edits,
				options
			);
		} catch ( err ) {
			error = err;
		}

		if ( ! error ) {
			try {
				await registry
					.dispatch( coreStore )
					.saveEntityRecord(
						'postType',
						previousRecord.type,
						edits,
						options
					);
			} catch ( err ) {
				error =
					err.message && err.code !== 'unknown_error'
						? err.message
						: __( 'An error occurred while updating.' );
			}
		}

		if ( ! error ) {
			error = registry
				.select( coreStore )
				.getLastEntitySaveError(
					'postType',
					previousRecord.type,
					previousRecord.id
				);
		}

		// Run the hook with legacy unstable name for backward compatibility
		if ( ! error ) {
			try {
				await applyFilters(
					'editor.__unstableSavePost',
					Promise.resolve(),
					options
				);
			} catch ( err ) {
				error = err;
			}
		}

		if ( ! error ) {
			try {
				await doActionAsync(
					'editor.savePost',
					{ id: previousRecord.id, type: previousRecord.type },
					options
				);
			} catch ( err ) {
				error = err;
			}
		}
		dispatch( { type: 'REQUEST_POST_UPDATE_FINISH', options } );

		if (
			typeof window !== 'undefined' &&
			window.__experimentalTemplateActivate &&
			! options.isAutosave &&
			previousRecord.type === 'wp_template' &&
			( typeof previousRecord.id === 'number' ||
				/^\d+$/.test( previousRecord.id ) )
		) {
			templateActivationNotice( { select, dispatch, registry } );
		}

		if ( error ) {
			const args = getNotificationArgumentsForSaveFail( {
				post: previousRecord,
				edits,
				error,
			} );
			if ( args.length ) {
				registry.dispatch( noticesStore ).createErrorNotice( ...args );
			}
		} else {
			const updatedRecord = select.getCurrentPost();
			const args = getNotificationArgumentsForSaveSuccess( {
				previousPost: previousRecord,
				post: updatedRecord,
				postType: await registry
					.resolveSelect( coreStore )
					.getPostType( updatedRecord.type ),
				options,
			} );
			if ( args.length ) {
				registry
					.dispatch( noticesStore )
					.createSuccessNotice( ...args );
			}
			// Make sure that any edits after saving create an undo level and are
			// considered for change detection.
			if ( ! options.isAutosave ) {
				registry
					.dispatch( blockEditorStore )
					.__unstableMarkLastChangeAsPersistent();
			}
		}
	};

async function templateActivationNotice( { select, registry } ) {
	const editorSettings = select.getEditorSettings();

	// Don't open for focused entity.
	if ( editorSettings.onNavigateToPreviousEntityRecord ) {
		return;
	}

	const { id, slug } = select.getCurrentPost();
	const site = await registry
		.select( coreStore )
		.getEntityRecord( 'root', 'site' );

	// Already active.
	if ( site.active_templates[ slug ] === id ) {
		return;
	}

	const currentTheme = await registry
		.resolveSelect( coreStore )
		.getCurrentTheme();
	const templateType = currentTheme?.default_template_types.find(
		( type ) => type.slug === slug
	);

	await registry.dispatch( noticesStore ).createNotice(
		'info',
		sprintf(
			// translators: %s: The name (or slug) of the type of template.
			__( 'Do you want to activate this "%s" template?' ),
			templateType?.title ?? slug
		),
		{
			id: 'template-activate-notice',
			actions: [
				{
					label: __( 'Activate' ),
					onClick: async () => {
						await registry
							.dispatch( noticesStore )
							.createNotice(
								'info',
								__( 'Activating template…' ),
								{ id: 'template-activate-notice' }
							);
						try {
							const currentSite = await registry
								.select( coreStore )
								.getEntityRecord( 'root', 'site' );
							await registry
								.dispatch( coreStore )
								.saveEntityRecord(
									'root',
									'site',
									{
										active_templates: {
											...currentSite.active_templates,
											[ slug ]: id,
										},
									},
									{ throwOnError: true }
								);
							await registry
								.dispatch( noticesStore )
								.createSuccessNotice(
									__( 'Template activated.' ),
									{ id: 'template-activate-notice' }
								);
						} catch ( error ) {
							await registry
								.dispatch( noticesStore )
								.createErrorNotice(
									__( 'Template activation failed.' ),
									{ id: 'template-activate-notice' }
								);
							// Rethrow for debugging.
							throw error;
						}
					},
				},
			],
		}
	);
}

/**
 * Action for refreshing the current post.
 *
 * @deprecated Since WordPress 6.0.
 */
export function refreshPost() {
	deprecated( "wp.data.dispatch( 'core/editor' ).refreshPost", {
		since: '6.0',
		version: '6.3',
		alternative: 'Use the core entities store instead',
	} );
	return { type: 'DO_NOTHING' };
}

/**
 * Action for trashing the current post in the editor.
 */
export const trashPost =
	() =>
	async ( { select, dispatch, registry } ) => {
		const postTypeSlug = select.getCurrentPostType();
		const postType = await registry
			.resolveSelect( coreStore )
			.getPostType( postTypeSlug );
		const { rest_base: restBase, rest_namespace: restNamespace = 'wp/v2' } =
			postType;
		dispatch( { type: 'REQUEST_POST_DELETE_START' } );
		try {
			const post = select.getCurrentPost();
			await apiFetch( {
				path: `/${ restNamespace }/${ restBase }/${ post.id }`,
				method: 'DELETE',
			} );

			await dispatch.savePost();
		} catch ( error ) {
			registry
				.dispatch( noticesStore )
				.createErrorNotice(
					...getNotificationArgumentsForTrashFail( { error } )
				);
		}
		dispatch( { type: 'REQUEST_POST_DELETE_FINISH' } );
	};

/**
 * Action that autosaves the current post.  This
 * includes server-side autosaving (default) and client-side (a.k.a. local)
 * autosaving (e.g. on the Web, the post might be committed to Session
 * Storage).
 *
 * @param {Object}  [options]       Extra flags to identify the autosave.
 * @param {boolean} [options.local] Whether to perform a local autosave.
 */
export const autosave =
	( { local = false, ...options } = {} ) =>
	async ( { select, dispatch } ) => {
		const post = select.getCurrentPost();

		if ( local ) {
			const isPostNew = select.isEditedPostNew();
			const title = select.getEditedPostAttribute( 'title' );
			const content = select.getEditedPostAttribute( 'content' );
			const excerpt = select.getEditedPostAttribute( 'excerpt' );
			localAutosaveSet( post.id, isPostNew, title, content, excerpt );
		} else {
			await dispatch.savePost( { isAutosave: true, ...options } );
		}
	};

/**
 * Save for preview.
 *
 * @param {Object}  options                     Options object.
 * @param {boolean} options.forceIsAutosaveable Whether to force the post to be autosaveable.
 *
 * @return {Function} Thunk that saves for preview and returns the preview link.
 */
export const __unstableSaveForPreview =
	( { forceIsAutosaveable } = {} ) =>
	async ( { select, dispatch } ) => {
		if (
			( forceIsAutosaveable || select.isEditedPostAutosaveable() ) &&
			! select.isPostLocked()
		) {
			const isDraft = [ 'draft', 'auto-draft' ].includes(
				select.getEditedPostAttribute( 'status' )
			);
			if ( isDraft ) {
				await dispatch.savePost( { isPreview: true } );
			} else {
				await dispatch.autosave( { isPreview: true } );
			}
		}

		return select.getEditedPostPreviewLink();
	};

/**
 * Action that restores last popped state in undo history.
 */
export const redo =
	() =>
	( { registry } ) => {
		registry.dispatch( coreStore ).redo();
	};

/**
 * Action that pops a record from undo history and undoes the edit.
 */
export const undo =
	() =>
	( { registry } ) => {
		registry.dispatch( coreStore ).undo();
	};

/**
 * Action that creates an undo history record.
 *
 * @deprecated Since WordPress 6.0
 */
export function createUndoLevel() {
	deprecated( "wp.data.dispatch( 'core/editor' ).createUndoLevel", {
		since: '6.0',
		version: '6.3',
		alternative: 'Use the core entities store instead',
	} );
	return { type: 'DO_NOTHING' };
}

/**
 * Action that locks the editor.
 *
 * @param {Object} lock Details about the post lock status, user, and nonce.
 * @return {Object} Action object.
 */
export function updatePostLock( lock ) {
	return {
		type: 'UPDATE_POST_LOCK',
		lock,
	};
}

/**
 * Enable the publish sidebar.
 */
export const enablePublishSidebar =
	() =>
	( { registry } ) => {
		registry
			.dispatch( preferencesStore )
			.set( 'core', 'isPublishSidebarEnabled', true );
	};

/**
 * Disables the publish sidebar.
 */
export const disablePublishSidebar =
	() =>
	( { registry } ) => {
		registry
			.dispatch( preferencesStore )
			.set( 'core', 'isPublishSidebarEnabled', false );
	};

/**
 * Action that locks post saving.
 *
 * @param {string} lockName The lock name.
 *
 * @example
 * ```
 * const { subscribe } = wp.data;
 *
 * const initialPostStatus = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'status' );
 *
 * // Only allow publishing posts that are set to a future date.
 * if ( 'publish' !== initialPostStatus ) {
 *
 * 	// Track locking.
 * 	let locked = false;
 *
 * 	// Watch for the publish event.
 * 	let unssubscribe = subscribe( () => {
 * 		const currentPostStatus = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'status' );
 * 		if ( 'publish' !== currentPostStatus ) {
 *
 * 			// Compare the post date to the current date, lock the post if the date isn't in the future.
 * 			const postDate = new Date( wp.data.select( 'core/editor' ).getEditedPostAttribute( 'date' ) );
 * 			const currentDate = new Date();
 * 			if ( postDate.getTime() <= currentDate.getTime() ) {
 * 				if ( ! locked ) {
 * 					locked = true;
 * 					wp.data.dispatch( 'core/editor' ).lockPostSaving( 'futurelock' );
 * 				}
 * 			} else {
 * 				if ( locked ) {
 * 					locked = false;
 * 					wp.data.dispatch( 'core/editor' ).unlockPostSaving( 'futurelock' );
 * 				}
 * 			}
 * 		}
 * 	} );
 * }
 * ```
 *
 * @return {Object} Action object
 */
export function lockPostSaving( lockName ) {
	return {
		type: 'LOCK_POST_SAVING',
		lockName,
	};
}

/**
 * Action that unlocks post saving.
 *
 * @param {string} lockName The lock name.
 *
 * @example
 * ```
 * // Unlock post saving with the lock key `mylock`:
 * wp.data.dispatch( 'core/editor' ).unlockPostSaving( 'mylock' );
 * ```
 *
 * @return {Object} Action object
 */
export function unlockPostSaving( lockName ) {
	return {
		type: 'UNLOCK_POST_SAVING',
		lockName,
	};
}

/**
 * Action that locks post autosaving.
 *
 * @param {string} lockName The lock name.
 *
 * @example
 * ```
 * // Lock post autosaving with the lock key `mylock`:
 * wp.data.dispatch( 'core/editor' ).lockPostAutosaving( 'mylock' );
 * ```
 *
 * @return {Object} Action object
 */
export function lockPostAutosaving( lockName ) {
	return {
		type: 'LOCK_POST_AUTOSAVING',
		lockName,
	};
}

/**
 * Action that unlocks post autosaving.
 *
 * @param {string} lockName The lock name.
 *
 * @example
 * ```
 * // Unlock post saving with the lock key `mylock`:
 * wp.data.dispatch( 'core/editor' ).unlockPostAutosaving( 'mylock' );
 * ```
 *
 * @return {Object} Action object
 */
export function unlockPostAutosaving( lockName ) {
	return {
		type: 'UNLOCK_POST_AUTOSAVING',
		lockName,
	};
}

/**
 * Returns an action object used to signal that the blocks have been updated.
 *
 * @param {Array}  blocks    Block Array.
 * @param {Object} [options] Optional options.
 */
export const resetEditorBlocks =
	( blocks, options = {} ) =>
	( { select, dispatch, registry } ) => {
		const { __unstableShouldCreateUndoLevel, selection } = options;
		const edits = { blocks, selection };

		if ( __unstableShouldCreateUndoLevel !== false ) {
			const { id, type } = select.getCurrentPost();
			const noChange =
				registry
					.select( coreStore )
					.getEditedEntityRecord( 'postType', type, id ).blocks ===
				edits.blocks;
			if ( noChange ) {
				registry
					.dispatch( coreStore )
					.__unstableCreateUndoLevel( 'postType', type, id );
				return;
			}

			// We create a new function here on every persistent edit
			// to make sure the edit makes the post dirty and creates
			// a new undo level.
			edits.content = ( { blocks: blocksForSerialization = [] } ) =>
				__unstableSerializeAndClean( blocksForSerialization );
		}

		dispatch.editPost( edits );
	};

/*
 * Returns an action object used in signalling that the post editor settings have been updated.
 *
 * @param {Object} settings Updated settings
 *
 * @return {Object} Action object
 */
export function updateEditorSettings( settings ) {
	return {
		type: 'UPDATE_EDITOR_SETTINGS',
		settings,
	};
}

/**
 * Returns an action used to set the rendering mode of the post editor. We support multiple rendering modes:
 *
 * -   `post-only`: This mode extracts the post blocks from the template and renders only those. The idea is to allow the user to edit the post/page in isolation without the wrapping template.
 * -   `template-locked`: This mode renders both the template and the post blocks but the template blocks are locked and can't be edited. The post blocks are editable.
 *
 * @param {string} mode Mode (one of 'post-only' or 'template-locked').
 */
export const setRenderingMode =
	( mode ) =>
	( { dispatch, registry, select } ) => {
		if (
			select.__unstableIsEditorReady() &&
			! select.getEditorSettings().isPreviewMode
		) {
			registry.dispatch( blockEditorStore ).clearSelectedBlock();
		}

		dispatch( {
			type: 'SET_RENDERING_MODE',
			mode,
		} );
	};

/**
 * Action that changes the width of the editing canvas.
 *
 * @param {string} deviceType
 *
 * @return {Object} Action object.
 */
export function setDeviceType( deviceType ) {
	return {
		type: 'SET_DEVICE_TYPE',
		deviceType,
	};
}

/**
 * Returns an action object used to enable or disable a panel in the editor.
 *
 * @param {string} panelName A string that identifies the panel to enable or disable.
 *
 * @return {Object} Action object.
 */
export const toggleEditorPanelEnabled =
	( panelName ) =>
	( { registry } ) => {
		const inactivePanels =
			registry
				.select( preferencesStore )
				.get( 'core', 'inactivePanels' ) ?? [];

		const isPanelInactive = !! inactivePanels?.includes( panelName );

		// If the panel is inactive, remove it to enable it, else add it to
		// make it inactive.
		let updatedInactivePanels;
		if ( isPanelInactive ) {
			updatedInactivePanels = inactivePanels.filter(
				( invactivePanelName ) => invactivePanelName !== panelName
			);
		} else {
			updatedInactivePanels = [ ...inactivePanels, panelName ];
		}

		registry
			.dispatch( preferencesStore )
			.set( 'core', 'inactivePanels', updatedInactivePanels );
	};

/**
 * Opens a closed panel and closes an open panel.
 *
 * @param {string} panelName A string that identifies the panel to open or close.
 */
export const toggleEditorPanelOpened =
	( panelName ) =>
	( { registry } ) => {
		const openPanels =
			registry.select( preferencesStore ).get( 'core', 'openPanels' ) ??
			[];

		const isPanelOpen = !! openPanels?.includes( panelName );

		// If the panel is open, remove it to close it, else add it to
		// make it open.
		let updatedOpenPanels;
		if ( isPanelOpen ) {
			updatedOpenPanels = openPanels.filter(
				( openPanelName ) => openPanelName !== panelName
			);
		} else {
			updatedOpenPanels = [ ...openPanels, panelName ];
		}

		registry
			.dispatch( preferencesStore )
			.set( 'core', 'openPanels', updatedOpenPanels );
	};

/**
 * Returns an action object used to remove a panel from the editor.
 *
 * @param {string} panelName A string that identifies the panel to remove.
 *
 * @return {Object} Action object.
 */
export function removeEditorPanel( panelName ) {
	return {
		type: 'REMOVE_PANEL',
		panelName,
	};
}

/**
 * Returns an action object used to open/close the inserter.
 *
 * @param {boolean|Object} value                Whether the inserter should be
 *                                              opened (true) or closed (false).
 *                                              To specify an insertion point,
 *                                              use an object.
 * @param {string}         value.rootClientId   The root client ID to insert at.
 * @param {number}         value.insertionIndex The index to insert at.
 * @param {string}         value.filterValue    A query to filter the inserter results.
 * @param {Function}       value.onSelect       A callback when an item is selected.
 * @param {string}         value.tab            The tab to open in the inserter.
 * @param {string}         value.category       The category to initialize in the inserter.
 *
 * @return {Object} Action object.
 */
export const setIsInserterOpened =
	( value ) =>
	( { dispatch, registry } ) => {
		if (
			typeof value === 'object' &&
			value.hasOwnProperty( 'rootClientId' ) &&
			value.hasOwnProperty( 'insertionIndex' )
		) {
			unlock( registry.dispatch( blockEditorStore ) ).setInsertionPoint( {
				rootClientId: value.rootClientId,
				index: value.insertionIndex,
			} );
		}

		dispatch( {
			type: 'SET_IS_INSERTER_OPENED',
			value,
		} );
	};

/**
 * Returns an action object used to open/close the list view.
 *
 * @param {boolean} isOpen A boolean representing whether the list view should be opened or closed.
 * @return {Object} Action object.
 */
export function setIsListViewOpened( isOpen ) {
	return {
		type: 'SET_IS_LIST_VIEW_OPENED',
		isOpen,
	};
}

/**
 * Action that toggles Distraction free mode.
 * Distraction free mode expects there are no sidebars, as due to the
 * z-index values set, you can't close sidebars.
 *
 * @param {Object}  [options={}]                Optional configuration object
 * @param {boolean} [options.createNotice=true] Whether to create a notice
 */
export const toggleDistractionFree =
	( { createNotice = true } = {} ) =>
	( { dispatch, registry } ) => {
		const isDistractionFree = registry
			.select( preferencesStore )
			.get( 'core', 'distractionFree' );
		if ( isDistractionFree ) {
			registry
				.dispatch( preferencesStore )
				.set( 'core', 'fixedToolbar', false );
		}
		if ( ! isDistractionFree ) {
			registry.batch( () => {
				registry
					.dispatch( preferencesStore )
					.set( 'core', 'fixedToolbar', true );
				dispatch.setIsInserterOpened( false );
				dispatch.setIsListViewOpened( false );
				unlock(
					registry.dispatch( blockEditorStore )
				).resetZoomLevel();
			} );
		}
		registry.batch( () => {
			registry
				.dispatch( preferencesStore )
				.set( 'core', 'distractionFree', ! isDistractionFree );

			if ( createNotice ) {
				registry
					.dispatch( noticesStore )
					.createInfoNotice(
						isDistractionFree
							? __( 'Distraction free mode deactivated.' )
							: __( 'Distraction free mode activated.' ),
						{
							id: 'core/editor/distraction-free-mode/notice',
							type: 'snackbar',
							actions: [
								{
									label: __( 'Undo' ),
									onClick: () => {
										registry.batch( () => {
											registry
												.dispatch( preferencesStore )
												.set(
													'core',
													'fixedToolbar',
													isDistractionFree
												);
											registry
												.dispatch( preferencesStore )
												.toggle(
													'core',
													'distractionFree'
												);
										} );
									},
								},
							],
						}
					);
			}
		} );
	};

/**
 * Action that toggles the Spotlight Mode view option.
 */
export const toggleSpotlightMode =
	() =>
	( { registry } ) => {
		registry.dispatch( preferencesStore ).toggle( 'core', 'focusMode' );

		const isFocusMode = registry
			.select( preferencesStore )
			.get( 'core', 'focusMode' );

		registry
			.dispatch( noticesStore )
			.createInfoNotice(
				isFocusMode
					? __( 'Spotlight mode activated.' )
					: __( 'Spotlight mode deactivated.' ),
				{
					id: 'core/editor/toggle-spotlight-mode/notice',
					type: 'snackbar',
					actions: [
						{
							label: __( 'Undo' ),
							onClick: () => {
								registry
									.dispatch( preferencesStore )
									.toggle( 'core', 'focusMode' );
							},
						},
					],
				}
			);
	};

/**
 * Action that toggles the Top Toolbar view option.
 */
export const toggleTopToolbar =
	() =>
	( { registry } ) => {
		registry.dispatch( preferencesStore ).toggle( 'core', 'fixedToolbar' );

		const isTopToolbar = registry
			.select( preferencesStore )
			.get( 'core', 'fixedToolbar' );

		registry
			.dispatch( noticesStore )
			.createInfoNotice(
				isTopToolbar
					? __( 'Top toolbar activated.' )
					: __( 'Top toolbar deactivated.' ),
				{
					id: 'core/editor/toggle-top-toolbar/notice',
					type: 'snackbar',
					actions: [
						{
							label: __( 'Undo' ),

							onClick: () => {
								registry
									.dispatch( preferencesStore )
									.toggle( 'core', 'fixedToolbar' );
							},
						},
					],
				}
			);
	};

/**
 * Triggers an action used to switch editor mode.
 *
 * @param {string} mode The editor mode.
 */
export const switchEditorMode =
	( mode ) =>
	( { dispatch, registry } ) => {
		registry.dispatch( preferencesStore ).set( 'core', 'editorMode', mode );

		if ( mode !== 'visual' ) {
			// Unselect blocks when we switch to a non visual mode.
			registry.dispatch( blockEditorStore ).clearSelectedBlock();
			// Exit zoom out state when switching to a non visual mode.
			unlock( registry.dispatch( blockEditorStore ) ).resetZoomLevel();
		}

		if ( mode === 'visual' ) {
			speak( __( 'Visual editor selected' ), 'assertive' );
		} else if ( mode === 'text' ) {
			const isDistractionFree = registry
				.select( preferencesStore )
				.get( 'core', 'distractionFree' );
			if ( isDistractionFree ) {
				dispatch.toggleDistractionFree();
			}
			speak( __( 'Code editor selected' ), 'assertive' );
		}
	};

/**
 * Returns an action object used in signalling that the user opened the publish
 * sidebar.
 *
 * @return {Object} Action object
 */
export function openPublishSidebar() {
	return {
		type: 'OPEN_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user closed the
 * publish sidebar.
 *
 * @return {Object} Action object.
 */
export function closePublishSidebar() {
	return {
		type: 'CLOSE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user toggles the publish sidebar.
 *
 * @return {Object} Action object
 */
export function togglePublishSidebar() {
	return {
		type: 'TOGGLE_PUBLISH_SIDEBAR',
	};
}

/**
 * Backward compatibility
 */

const getBlockEditorAction =
	( name ) =>
	( ...args ) =>
	( { registry } ) => {
		deprecated( "`wp.data.dispatch( 'core/editor' )." + name + '`', {
			since: '5.3',
			alternative:
				"`wp.data.dispatch( 'core/block-editor' )." + name + '`',
			version: '6.2',
		} );
		registry.dispatch( blockEditorStore )[ name ]( ...args );
	};

/**
 * @see resetBlocks in core/block-editor store.
 */
export const resetBlocks = getBlockEditorAction( 'resetBlocks' );

/**
 * @see receiveBlocks in core/block-editor store.
 */
export const receiveBlocks = getBlockEditorAction( 'receiveBlocks' );

/**
 * @see updateBlock in core/block-editor store.
 */
export const updateBlock = getBlockEditorAction( 'updateBlock' );

/**
 * @see updateBlockAttributes in core/block-editor store.
 */
export const updateBlockAttributes = getBlockEditorAction(
	'updateBlockAttributes'
);

/**
 * @see selectBlock in core/block-editor store.
 */
export const selectBlock = getBlockEditorAction( 'selectBlock' );

/**
 * @see startMultiSelect in core/block-editor store.
 */
export const startMultiSelect = getBlockEditorAction( 'startMultiSelect' );

/**
 * @see stopMultiSelect in core/block-editor store.
 */
export const stopMultiSelect = getBlockEditorAction( 'stopMultiSelect' );

/**
 * @see multiSelect in core/block-editor store.
 */
export const multiSelect = getBlockEditorAction( 'multiSelect' );

/**
 * @see clearSelectedBlock in core/block-editor store.
 */
export const clearSelectedBlock = getBlockEditorAction( 'clearSelectedBlock' );

/**
 * @see toggleSelection in core/block-editor store.
 */
export const toggleSelection = getBlockEditorAction( 'toggleSelection' );

/**
 * @see replaceBlocks in core/block-editor store.
 */
export const replaceBlocks = getBlockEditorAction( 'replaceBlocks' );

/**
 * @see replaceBlock in core/block-editor store.
 */
export const replaceBlock = getBlockEditorAction( 'replaceBlock' );

/**
 * @see moveBlocksDown in core/block-editor store.
 */
export const moveBlocksDown = getBlockEditorAction( 'moveBlocksDown' );

/**
 * @see moveBlocksUp in core/block-editor store.
 */
export const moveBlocksUp = getBlockEditorAction( 'moveBlocksUp' );

/**
 * @see moveBlockToPosition in core/block-editor store.
 */
export const moveBlockToPosition = getBlockEditorAction(
	'moveBlockToPosition'
);

/**
 * @see insertBlock in core/block-editor store.
 */
export const insertBlock = getBlockEditorAction( 'insertBlock' );

/**
 * @see insertBlocks in core/block-editor store.
 */
export const insertBlocks = getBlockEditorAction( 'insertBlocks' );

/**
 * @see showInsertionPoint in core/block-editor store.
 */
export const showInsertionPoint = getBlockEditorAction( 'showInsertionPoint' );

/**
 * @see hideInsertionPoint in core/block-editor store.
 */
export const hideInsertionPoint = getBlockEditorAction( 'hideInsertionPoint' );

/**
 * @see setTemplateValidity in core/block-editor store.
 */
export const setTemplateValidity = getBlockEditorAction(
	'setTemplateValidity'
);

/**
 * @see synchronizeTemplate in core/block-editor store.
 */
export const synchronizeTemplate = getBlockEditorAction(
	'synchronizeTemplate'
);

/**
 * @see mergeBlocks in core/block-editor store.
 */
export const mergeBlocks = getBlockEditorAction( 'mergeBlocks' );

/**
 * @see removeBlocks in core/block-editor store.
 */
export const removeBlocks = getBlockEditorAction( 'removeBlocks' );

/**
 * @see removeBlock in core/block-editor store.
 */
export const removeBlock = getBlockEditorAction( 'removeBlock' );

/**
 * @see toggleBlockMode in core/block-editor store.
 */
export const toggleBlockMode = getBlockEditorAction( 'toggleBlockMode' );

/**
 * @see startTyping in core/block-editor store.
 */
export const startTyping = getBlockEditorAction( 'startTyping' );

/**
 * @see stopTyping in core/block-editor store.
 */
export const stopTyping = getBlockEditorAction( 'stopTyping' );

/**
 * @see enterFormattedText in core/block-editor store.
 */
export const enterFormattedText = getBlockEditorAction( 'enterFormattedText' );

/**
 * @see exitFormattedText in core/block-editor store.
 */
export const exitFormattedText = getBlockEditorAction( 'exitFormattedText' );

/**
 * @see insertDefaultBlock in core/block-editor store.
 */
export const insertDefaultBlock = getBlockEditorAction( 'insertDefaultBlock' );

/**
 * @see updateBlockListSettings in core/block-editor store.
 */
export const updateBlockListSettings = getBlockEditorAction(
	'updateBlockListSettings'
);
