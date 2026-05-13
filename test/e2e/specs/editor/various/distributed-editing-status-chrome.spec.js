/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const BASE_CONTENT =
	'<!-- wp:paragraph --><p>Original client base</p><!-- /wp:paragraph -->';
const SERVER_CONTENT =
	'<!-- wp:paragraph --><p>Server changed copy</p><!-- /wp:paragraph -->';
const REFETCHED_CONTENT =
	'<!-- wp:paragraph --><p>Refetched server copy</p><!-- /wp:paragraph -->';
const LOCAL_PENDING_CONTENT =
	'<!-- wp:paragraph --><p>Local pending browser copy</p><!-- /wp:paragraph -->';
const BOARD_DEMO_BASE_CONTENT =
	'<!-- wp:paragraph --><p>Board demo server base</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Board demo local base</p><!-- /wp:paragraph -->';
const BOARD_DEMO_SERVER_CONTENT =
	'<!-- wp:paragraph --><p>Board demo server update</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Board demo local base</p><!-- /wp:paragraph -->';
const BOARD_DEMO_LOCAL_CONTENT =
	'<!-- wp:paragraph --><p>Board demo server base</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Board demo local update</p><!-- /wp:paragraph -->';
const BOARD_DEMO_REBASED_CONTENT =
	'<!-- wp:paragraph --><p>Board demo server update</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>Board demo local update</p><!-- /wp:paragraph -->';
const PRODUCTION_STATUS_CHROME_SELECTOR =
	'[data-distributed-editing-placement="editor-interface-notices"][role="region"][aria-label="Distributed editing status"]';
const INTERNAL_INSPECTOR_SELECTOR =
	'[data-distributed-editing-placement="internal-inspector"]';

function getStatusChrome( page ) {
	return page.locator( PRODUCTION_STATUS_CHROME_SELECTOR );
}

function getActionStatus( statusChrome ) {
	return statusChrome.locator(
		'[data-distributed-editing-action-status][role="status"]'
	);
}

async function getDistributedEditingState( page ) {
	return page.evaluate( () => {
		const state = window.wp.data
			.select( 'core/editor' )
			.getDistributedEditingSessionState();

		return {
			disposition: state.disposition,
			readyToRetrySubmit: state.readyToRetrySubmit,
			retrySubmitHandoffStatus: state.retrySubmitHandoffStatus,
			retrySubmitPrepared: state.retrySubmitPrepared,
			retrySubmitProofStatus: state.retrySubmitProofStatus,
			retrySubmitAccepted: state.retrySubmitAccepted,
			retrySubmitSavePathRequired: state.retrySubmitSavePathRequired,
			retrySubmitSaveStatus: state.retrySubmitSaveStatus,
			retrySubmitSavePrepared: state.retrySubmitSavePrepared,
			retrySubmitSaveReady: state.retrySubmitSaveReady,
			retrySubmitSavesPost: state.retrySubmitSavesPost,
			retrySubmitMutatesPostContent: state.retrySubmitMutatesPostContent,
			retrySubmitCreatesRevision: state.retrySubmitCreatesRevision,
			retrySubmitClaimsSaved: state.retrySubmitClaimsSaved,
			retrySaveStatus: state.retrySaveStatus,
			retrySaveAccepted: state.retrySaveAccepted,
			retrySaveServerVersion: state.retrySaveServerVersion,
			retrySavePreviousServerVersion:
				state.retrySavePreviousServerVersion,
			retrySaveSavesPost: state.retrySaveSavesPost,
			retrySaveMutatesPostContent: state.retrySaveMutatesPostContent,
			retrySaveCreatesRevision: state.retrySaveCreatesRevision,
			retrySaveClaimsSaved: state.retrySaveClaimsSaved,
			retrySaveRevisionCreated: state.retrySaveRevisionCreated,
			retrySaveCreatedRevisionIds: state.retrySaveCreatedRevisionIds,
			canExportLocalUpdates: state.canExportLocalUpdates,
			hasPendingChanges: state.hasPendingChanges,
			isAwaitingServerConfirmation: state.isAwaitingServerConfirmation,
			mustOfferLocalCopy: state.mustOfferLocalCopy,
			requiresServerStateRefetch: state.requiresServerStateRefetch,
			refetchedServerContent: state.refetchedServerContent,
			refetchedServerState: state.refetchedServerState,
			retrySaveStatus: state.retrySaveStatus,
			retrySaveHandoffStatus: state.retrySaveHandoffStatus,
			retrySaveHandoffReason: state.retrySaveHandoffReason,
			retrySaveHandoffBlocksNormalSave:
				state.retrySaveHandoffBlocksNormalSave,
		};
	} );
}

function isStaleBaseRequest( url ) {
	return (
		decodeURIComponent( url.href ).includes( '/wp/v2/posts/' ) &&
		decodeURIComponent( url.href ).includes(
			'/distributed-editing/stale-base'
		)
	);
}

function isRetrySubmitProofRequest( url ) {
	return (
		decodeURIComponent( url.href ).includes( '/wp/v2/posts/' ) &&
		decodeURIComponent( url.href ).includes(
			'/distributed-editing/retry-submit'
		)
	);
}

function isGuardedRetrySaveRequest( url ) {
	return (
		decodeURIComponent( url.href ).includes( '/wp/v2/posts/' ) &&
		decodeURIComponent( url.href ).includes(
			'/distributed-editing/retry-save'
		)
	);
}

function isPostEditRefetchRequest( url ) {
	const decodedUrl = decodeURIComponent( url.href );

	return (
		decodedUrl.includes( '/wp/v2/posts/' ) &&
		decodedUrl.includes( 'context=edit' ) &&
		! decodedUrl.includes( '/distributed-editing/' )
	);
}

function isPostRestRequest( url ) {
	const decodedUrl = decodeURIComponent( url.href );

	return (
		decodedUrl.includes( '/wp/v2/posts/' ) &&
		! decodedUrl.includes( '/distributed-editing/' )
	);
}

async function enableDistributedEditingRetrySaveHandoff( page ) {
	await page.evaluate( () => {
		window.wp.data.dispatch( 'core/editor' ).updateEditorSettings( {
			distributedEditing: {
				enabled: true,
				retrySaveHandoff: true,
			},
		} );
	} );
}

async function requestBoardDemoStaleBaseRejection( page ) {
	return await page.evaluate(
		async ( { clientBaseContent } ) => {
			try {
				await window.wp.data
					.dispatch( 'core/editor' )
					.__experimentalRefreshDistributedEditingStaleBaseRejection(
						{
							clientBaseVersion: '4',
							serverVersion: '6',
							pendingChangeCount: 2,
							remoteChangeCount: 1,
							canAttemptLocalRebase: false,
							clientBaseContent,
						}
					);
			} catch ( error ) {
				return {
					code: error?.code,
					status: error?.data?.status,
				};
			}

			return {
				code: null,
				status: null,
			};
		},
		{
			clientBaseContent: BOARD_DEMO_BASE_CONTENT,
		}
	);
}

async function seedPostRebaseState( page ) {
	await page.evaluate(
		( { baseContent, serverContent } ) => {
			window.wp.data
				.dispatch( 'core/editor' )
				.setDistributedEditingSessionState( {
					disposition: 'rejected_stale_base_version',
					reasonCode: 'stale_base_version_rejected',
					clientBaseVersion: '4',
					serverVersion: '7',
					clientBaseContent: baseContent,
					refetchedServerContent: serverContent,
					pendingChangeCount: 2,
					remoteChangeCount: 1,
					refetchedServerState: true,
					canExportLocalUpdates: true,
					localRebasePlanStatus: 'ready',
					localRebaseResultStatus: 'rebased',
					readyToRetrySubmit: true,
				} );
		},
		{
			baseContent: BASE_CONTENT,
			serverContent: SERVER_CONTENT,
		}
	);
}

async function seedBlockedRetrySaveRefetchState( page ) {
	await page.evaluate(
		( { baseContent } ) => {
			window.wp.data
				.dispatch( 'core/editor' )
				.setDistributedEditingSessionState( {
					disposition: 'rejected_stale_base_version',
					reasonCode: 'stale_base_version_rejected',
					clientBaseVersion: '4',
					serverVersion: '7',
					clientBaseContent: baseContent,
					pendingChangeCount: 1,
					remoteChangeCount: 1,
					hasPendingChanges: true,
					requiresServerStateRefetch: true,
					canExportLocalUpdates: true,
					retrySaveHandoffStatus: 'retry_save_blocked',
					retrySaveHandoffReason: 'server_state_refetch_required',
					retrySaveHandoffBlocksNormalSave: true,
				} );
		},
		{
			baseContent: BASE_CONTENT,
		}
	);
}

async function seedRetrySaveInProgressState( page ) {
	await page.evaluate(
		( { baseContent } ) => {
			window.wp.data.dispatch( 'core/editor' ).updateEditorSettings( {
				distributedEditing: {
					enabled: true,
					retrySaveHandoff: true,
				},
			} );
			window.wp.data
				.dispatch( 'core/editor' )
				.setDistributedEditingSessionState( {
					disposition: 'idle',
					clientBaseVersion: '4',
					serverVersion: '7',
					clientBaseContent: baseContent,
					pendingChangeCount: 1,
					hasPendingChanges: true,
					canExportLocalUpdates: true,
					retrySubmitProofStatus: 'accepted_for_future_save',
					retrySubmitAccepted: true,
					retrySubmitSavePathRequired: true,
					retrySubmitSaveStatus: 'ready',
					retrySubmitSavePrepared: true,
					retrySubmitSaveReady: true,
					retrySaveStatus: 'saving',
				} );
		},
		{
			baseContent: BASE_CONTENT,
		}
	);
}

async function editPostContent( page, editor, content ) {
	await page.evaluate( ( nextContent ) => {
		window.wp.data
			.dispatch( 'core/editor' )
			.editPost( { content: nextContent } );
	}, content );
	await expect.poll( editor.getEditedPostContent ).toBe( content );
}

test.describe( 'Distributed Editing status chrome', () => {
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'completes the board-demo success sequence through guarded retry-save confirmation', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost( {
			title: 'DE-RTC board demo success',
		} );
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toBeFocused();
		await enableDistributedEditingRetrySaveHandoff( page );

		let staleBaseRequestCount = 0;
		let refetchRequestCount = 0;
		let proofRequestCount = 0;
		let guardedRetrySaveRequestCount = 0;
		let postWriteRequestCount = 0;
		let guardedRetrySaveRequestBody = null;

		await page.route( isStaleBaseRequest, async ( route ) => {
			const request = route.request();

			if ( request.method() !== 'POST' ) {
				await route.continue();
				return;
			}

			staleBaseRequestCount += 1;
			const body = request.postDataJSON();

			expect( body ).toMatchObject( {
				client_base_version: '4',
				server_version: '6',
				pending_change_count: 2,
				remote_change_count: 1,
				can_attempt_local_rebase: false,
			} );
			expect( body.content ).toBeUndefined();

			await route.fulfill( {
				status: 409,
				contentType: 'application/json',
				body: JSON.stringify( {
					code: 'stale_base_version_rejected',
					message:
						'The client base version is stale for this board-demo flow.',
					data: {
						status: 409,
						result: 'stale_base_rejected',
						client_base_version: '4',
						server_version: '6',
						pending_change_count: 2,
						remote_change_count: 1,
						can_attempt_local_rebase: false,
					},
				} ),
			} );
		} );
		await page.route( isRetrySubmitProofRequest, async ( route ) => {
			const request = route.request();

			if ( request.method() !== 'POST' ) {
				await route.continue();
				return;
			}

			proofRequestCount += 1;
			const body = request.postDataJSON();

			expect( body ).toMatchObject( {
				client_base_version: '7',
				rebased_from_version: '4',
				pending_change_count: 2,
			} );
			expect( body.content ).toBeUndefined();
			expect( body.proposed_post_content ).toBeUndefined();

			await route.fulfill( {
				contentType: 'application/json',
				body: JSON.stringify( {
					result: 'retry_submit_accepted_for_future_save',
					retry_submit_accepted: true,
					save_path_required: true,
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
					pending_change_count: 2,
				} ),
			} );
		} );
		await page.route( isGuardedRetrySaveRequest, async ( route ) => {
			const request = route.request();

			if ( request.method() !== 'POST' ) {
				await route.continue();
				return;
			}

			guardedRetrySaveRequestCount += 1;
			guardedRetrySaveRequestBody = request.postDataJSON();

			expect( guardedRetrySaveRequestBody ).toMatchObject( {
				client_base_version: '7',
				accepted_proof_server_version: '7',
				rebased_from_version: '4',
				pending_change_count: 2,
				proposed_post_content: BOARD_DEMO_REBASED_CONTENT,
				accepted_proof_saves_post: false,
				accepted_proof_mutates_post_content: false,
				accepted_proof_creates_revision: false,
				accepted_proof_claims_saved: false,
			} );

			await route.fulfill( {
				contentType: 'application/json',
				body: JSON.stringify( {
					result: 'retry_save_applied',
					retry_save_accepted: true,
					previous_server_version: '7',
					server_version: '8',
					pending_change_count: 2,
					saves_post: true,
					mutates_post_content: true,
					creates_revision: true,
					claims_saved: true,
					revision_created: true,
					created_revision_ids: [ 7002 ],
				} ),
			} );
		} );
		await page.route( isPostRestRequest, async ( route ) => {
			const request = route.request();
			const requestUrl = new URL( request.url() );

			if (
				request.method() === 'GET' &&
				isPostEditRefetchRequest( requestUrl )
			) {
				refetchRequestCount += 1;
				const postIdMatch = requestUrl.pathname.match(
					/\/wp\/v2\/posts\/(\d+)/
				);

				await route.fulfill( {
					contentType: 'application/json',
					body: JSON.stringify( {
						id: Number( postIdMatch?.[ 1 ] || 1 ),
						modified_gmt: '2026-05-13T00:00:00',
						content: {
							raw: BOARD_DEMO_SERVER_CONTENT,
						},
						distributed_editing: {
							server_version: '7',
						},
					} ),
				} );
				return;
			}

			if ( request.method() !== 'GET' ) {
				postWriteRequestCount += 1;

				await route.fulfill( {
					status: 500,
					contentType: 'application/json',
					body: JSON.stringify( {
						code: 'unexpected_post_write_request',
						message:
							'The board-demo status chrome flow should not fall back to a normal post write.',
					} ),
				} );
				return;
			}

			await route.continue();
		} );

		await page.evaluate(
			( { localContent } ) => {
				window.wp.data
					.dispatch( 'core/editor' )
					.editPost( { content: localContent } );
			},
			{
				localContent: BOARD_DEMO_LOCAL_CONTENT,
			}
		);
		await expect
			.poll( editor.getEditedPostContent )
			.toBe( BOARD_DEMO_LOCAL_CONTENT );

		const staleBaseResult =
			await requestBoardDemoStaleBaseRejection( page );
		expect( staleBaseResult ).toEqual( {
			code: 'stale_base_version_rejected',
			status: 409,
		} );

		const statusChrome = getStatusChrome( page );
		await expect(
			page.locator( INTERNAL_INSPECTOR_SELECTOR )
		).toBeHidden();
		await expect( statusChrome ).toBeVisible();
		await expect(
			statusChrome.getByText( 'Server version changed' )
		).toBeVisible();
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Refresh server version',
			} )
		).toBeVisible();
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Retry local changes',
			} )
		).toBeHidden();

		await statusChrome
			.getByRole( 'button', { name: 'Refresh server version' } )
			.click();
		await expect(
			statusChrome.getByText(
				'Server version refreshed. Local changes remain protected and exportable while you review before retrying.'
			)
		).toBeVisible();
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Retry local changes',
			} )
		).toBeVisible();
		await expect
			.poll( editor.getEditedPostContent )
			.toBe( BOARD_DEMO_LOCAL_CONTENT );

		await statusChrome
			.getByRole( 'button', { name: 'Retry local changes' } )
			.click();
		await expect(
			statusChrome.getByText(
				'Local changes retried over the refreshed server version.'
			)
		).toBeVisible();
		await expect
			.poll( editor.getEditedPostContent )
			.toBe( BOARD_DEMO_REBASED_CONTENT );
		await expect(
			statusChrome.getByText( 'Local changes rebased' )
		).toBeVisible();
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Prepare retry submit',
			} )
		).toBeVisible();

		await statusChrome
			.getByRole( 'button', { name: 'Prepare retry submit' } )
			.click();
		await expect(
			statusChrome.getByText(
				'Retry submit prepared. Request server proof when ready.'
			)
		).toBeVisible();
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Refresh retry proof',
			} )
		).toBeVisible();

		await statusChrome
			.getByRole( 'button', { name: 'Refresh retry proof' } )
			.click();
		await expect(
			statusChrome.getByText(
				'Retry submit proof refreshed. Save again to continue through the guarded retry path.'
			)
		).toBeVisible();
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Prepare guarded save',
			} )
		).toBeVisible();

		await statusChrome
			.getByRole( 'button', { name: 'Prepare guarded save' } )
			.click();
		await expect(
			statusChrome.getByText(
				'Guarded save path prepared. Save again to submit through the retry path.'
			)
		).toBeVisible();
		await expect(
			statusChrome.getByText(
				'Retry submit is ready for the guarded save path. Local changes remain pending until that save finishes.'
			)
		).toBeVisible();
		await expect
			.poll( () => getDistributedEditingState( page ) )
			.toMatchObject( {
				retrySubmitSaveStatus: 'ready',
				retrySubmitSavePrepared: true,
				retrySubmitSaveReady: true,
				retrySaveStatus: 'none',
				canExportLocalUpdates: true,
			} );

		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data
						.select( 'core/editor' )
						.isEditedPostSaveable()
				)
			)
			.toBe( true );
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save draft' } )
			.click();

		await expect(
			statusChrome.getByText( 'Retry save confirmed' )
		).toBeVisible();
		await expect(
			statusChrome.getByText(
				'The server saved the rebased changes and cleared the local pending-change warning.'
			)
		).toBeVisible();
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Export local changes',
			} )
		).toBeHidden();
		await expect
			.poll( () => getDistributedEditingState( page ) )
			.toMatchObject( {
				disposition: 'idle',
				retrySubmitSaveStatus: 'none',
				retrySubmitSavePrepared: false,
				retrySubmitSaveReady: false,
				retrySaveStatus: 'saved',
				retrySaveAccepted: true,
				retrySaveServerVersion: '8',
				retrySavePreviousServerVersion: '7',
				retrySaveSavesPost: true,
				retrySaveMutatesPostContent: true,
				retrySaveCreatesRevision: true,
				retrySaveClaimsSaved: true,
				retrySaveRevisionCreated: true,
				retrySaveCreatedRevisionIds: [ 7002 ],
				canExportLocalUpdates: false,
			} );
		await expect
			.poll( editor.getEditedPostContent )
			.toBe( BOARD_DEMO_REBASED_CONTENT );

		expect( staleBaseRequestCount ).toBe( 1 );
		expect( refetchRequestCount ).toBe( 1 );
		expect( proofRequestCount ).toBe( 1 );
		expect( guardedRetrySaveRequestCount ).toBe( 1 );
		expect( postWriteRequestCount ).toBe( 0 );
		expect( guardedRetrySaveRequestBody ).toMatchObject( {
			proposed_post_content: BOARD_DEMO_REBASED_CONTENT,
		} );
	} );

	test( 'prepares the guarded retry-save path from a locally rebased state', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toBeFocused();

		let proofRequestCount = 0;
		let guardedRetrySaveRequestCount = 0;
		await page.route( isRetrySubmitProofRequest, async ( route ) => {
			const request = route.request();

			if ( request.method() !== 'POST' ) {
				await route.continue();
				return;
			}

			proofRequestCount += 1;
			const body = request.postDataJSON();

			expect( body ).toMatchObject( {
				client_base_version: '7',
				rebased_from_version: '4',
				pending_change_count: 2,
			} );
			expect( body.content ).toBeUndefined();

			await route.fulfill( {
				contentType: 'application/json',
				body: JSON.stringify( {
					result: 'retry_submit_accepted_for_future_save',
					retry_submit_accepted: true,
					save_path_required: true,
					saves_post: false,
					mutates_post_content: false,
					creates_revision: false,
					claims_saved: false,
					pending_change_count: 2,
				} ),
			} );
		} );
		await page.route( isGuardedRetrySaveRequest, async ( route ) => {
			guardedRetrySaveRequestCount += 1;

			await route.fulfill( {
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify( {
					code: 'unexpected_retry_save_request',
					message:
						'The status chrome spec should not call guarded retry-save.',
				} ),
			} );
		} );

		// There is no public editor workflow yet that can create the stale-base
		// local-rebase handoff. Seed that state, then drive the production chrome.
		await seedPostRebaseState( page );

		const statusChrome = getStatusChrome( page );
		await expect(
			page.locator( INTERNAL_INSPECTOR_SELECTOR )
		).toBeHidden();
		await expect( statusChrome ).toBeVisible();
		await expect(
			statusChrome.getByText( 'Local changes rebased' )
		).toBeVisible();
		await expect(
			statusChrome.getByText(
				'Local changes were merged with the server version and are ready for the next submit.'
			)
		).toBeVisible();
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Export local changes',
			} )
		).toBeVisible();
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Refresh server version',
			} )
		).toBeVisible();
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Prepare retry submit',
			} )
		).toBeVisible();
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Refresh retry proof',
			} )
		).toBeHidden();
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Prepare guarded save',
			} )
		).toBeHidden();

		await statusChrome
			.getByRole( 'button', { name: 'Prepare retry submit' } )
			.click();
		await expect( getActionStatus( statusChrome ) ).toHaveAttribute(
			'data-distributed-editing-action-status',
			'info'
		);
		await expect(
			statusChrome.getByText(
				'Retry submit prepared. Request server proof when ready.'
			)
		).toBeVisible();
		await expect(
			statusChrome.getByText(
				'Local changes are staged for the future retry path. No save has been sent yet.'
			)
		).toBeVisible();
		await expect
			.poll( () => getDistributedEditingState( page ) )
			.toMatchObject( {
				disposition: 'rejected_stale_base_version',
				retrySubmitHandoffStatus: 'prepared',
				retrySubmitPrepared: true,
				readyToRetrySubmit: false,
				canExportLocalUpdates: true,
			} );
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Refresh retry proof',
			} )
		).toBeVisible();

		await statusChrome
			.getByRole( 'button', { name: 'Refresh retry proof' } )
			.click();
		await expect( getActionStatus( statusChrome ) ).toHaveAttribute(
			'data-distributed-editing-action-status',
			'info'
		);
		await expect(
			statusChrome.getByText(
				'Retry submit proof refreshed. Save again to continue through the guarded retry path.'
			)
		).toBeVisible();
		await expect(
			statusChrome.getByText(
				'Retry submit accepted the rebased changes for a future save. Local changes are still awaiting confirmation.'
			)
		).toBeVisible();
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Refresh retry proof',
			} )
		).toBeHidden();
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Prepare guarded save',
			} )
		).toBeVisible();
		await expect
			.poll( () => getDistributedEditingState( page ) )
			.toMatchObject( {
				disposition: 'idle',
				retrySubmitProofStatus: 'accepted_for_future_save',
				retrySubmitAccepted: true,
				retrySubmitSavePathRequired: true,
				retrySubmitSaveStatus: 'none',
				retrySubmitSavesPost: false,
				retrySubmitMutatesPostContent: false,
				retrySubmitCreatesRevision: false,
				retrySubmitClaimsSaved: false,
				canExportLocalUpdates: true,
			} );

		await statusChrome
			.getByRole( 'button', { name: 'Prepare guarded save' } )
			.click();
		await expect( getActionStatus( statusChrome ) ).toHaveAttribute(
			'data-distributed-editing-action-status',
			'info'
		);
		await expect(
			statusChrome.getByText(
				'Guarded save path prepared. Save again to submit through the retry path.'
			)
		).toBeVisible();
		await expect(
			statusChrome.getByText(
				'Retry submit is ready for the guarded save path. Local changes remain pending until that save finishes.'
			)
		).toBeVisible();

		await expect
			.poll( () => getDistributedEditingState( page ) )
			.toMatchObject( {
				retrySubmitSaveStatus: 'ready',
				retrySubmitSavePrepared: true,
				retrySubmitSaveReady: true,
				retrySubmitSavesPost: false,
				retrySubmitMutatesPostContent: false,
				retrySubmitCreatesRevision: false,
				retrySubmitClaimsSaved: false,
			} );
		expect( proofRequestCount ).toBe( 1 );
		expect( guardedRetrySaveRequestCount ).toBe( 0 );
	} );

	test( 'reports unavailable clipboard from blocked retry-save status without writing', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toBeFocused();

		let guardedRetrySaveRequestCount = 0;
		let postWriteRequestCount = 0;

		await page.route( isGuardedRetrySaveRequest, async ( route ) => {
			guardedRetrySaveRequestCount += 1;

			await route.fulfill( {
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify( {
					code: 'unexpected_retry_save_request',
					message:
						'Exporting blocked status chrome changes should not call guarded retry-save.',
				} ),
			} );
		} );
		await page.route( isPostRestRequest, async ( route ) => {
			const request = route.request();

			if ( request.method() !== 'GET' ) {
				postWriteRequestCount += 1;

				await route.fulfill( {
					status: 500,
					contentType: 'application/json',
					body: JSON.stringify( {
						code: 'unexpected_post_write_request',
						message:
							'Exporting blocked status chrome changes should not save post content.',
					} ),
				} );
				return;
			}

			await route.continue();
		} );

		await editPostContent( page, editor, LOCAL_PENDING_CONTENT );
		await seedBlockedRetrySaveRefetchState( page );
		await page.evaluate( () => {
			Object.defineProperty( window.navigator, 'clipboard', {
				configurable: true,
				value: undefined,
			} );
		} );

		const statusChrome = getStatusChrome( page );
		await expect(
			page.locator( INTERNAL_INSPECTOR_SELECTOR )
		).toBeHidden();
		await expect( statusChrome ).toBeVisible();
		await expect(
			statusChrome.getByText( 'Retry save needs server refresh' )
		).toBeVisible();

		await statusChrome
			.getByRole( 'button', { name: 'Export local changes' } )
			.first()
			.click();

		await expect( getActionStatus( statusChrome ) ).toHaveAttribute(
			'data-distributed-editing-action-status',
			'warning'
		);
		await expect(
			statusChrome.getByText(
				'Clipboard unavailable. Local changes remain protected in this editor session; keep this tab open and try exporting again after clipboard access is available.'
			)
		).toBeVisible();
		await expect(
			statusChrome
				.getByRole( 'button', {
					name: 'Export local changes',
				} )
				.first()
		).toBeVisible();
		await expect
			.poll( editor.getEditedPostContent )
			.toBe( LOCAL_PENDING_CONTENT );
		await expect
			.poll( () => getDistributedEditingState( page ) )
			.toMatchObject( {
				canExportLocalUpdates: true,
				hasPendingChanges: true,
				mustOfferLocalCopy: true,
				retrySaveHandoffStatus: 'retry_save_blocked',
				retrySaveHandoffReason: 'server_state_refetch_required',
				retrySaveHandoffBlocksNormalSave: true,
			} );
		expect( guardedRetrySaveRequestCount ).toBe( 0 );
		expect( postWriteRequestCount ).toBe( 0 );
	} );

	test( 'reports refetch failure from blocked retry-save status without save side effects', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toBeFocused();

		let refetchRequestCount = 0;
		let guardedRetrySaveRequestCount = 0;
		let postWriteRequestCount = 0;

		await page.route( isGuardedRetrySaveRequest, async ( route ) => {
			guardedRetrySaveRequestCount += 1;

			await route.fulfill( {
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify( {
					code: 'unexpected_retry_save_request',
					message:
						'Failing status chrome server refetch should not call guarded retry-save.',
				} ),
			} );
		} );
		await page.route( isPostRestRequest, async ( route ) => {
			const request = route.request();
			const requestUrl = new URL( request.url() );

			if (
				request.method() === 'GET' &&
				isPostEditRefetchRequest( requestUrl )
			) {
				refetchRequestCount += 1;

				await route.fulfill( {
					status: 503,
					contentType: 'application/json',
					body: JSON.stringify( {
						code: 'de_rtc_refetch_unavailable',
						message: 'The server version could not be refreshed.',
					} ),
				} );
				return;
			}

			if ( request.method() !== 'GET' ) {
				postWriteRequestCount += 1;

				await route.fulfill( {
					status: 500,
					contentType: 'application/json',
					body: JSON.stringify( {
						code: 'unexpected_post_write_request',
						message:
							'Failing status chrome server refetch should not save post content.',
					} ),
				} );
				return;
			}

			await route.continue();
		} );

		await editPostContent( page, editor, LOCAL_PENDING_CONTENT );
		await seedBlockedRetrySaveRefetchState( page );

		const statusChrome = getStatusChrome( page );
		await expect(
			page.locator( INTERNAL_INSPECTOR_SELECTOR )
		).toBeHidden();
		await expect( statusChrome ).toBeVisible();
		await expect(
			statusChrome.getByText( 'Retry save needs server refresh' )
		).toBeVisible();

		await statusChrome
			.getByRole( 'button', { name: 'Refresh server version' } )
			.first()
			.click();

		await expect( getActionStatus( statusChrome ) ).toHaveAttribute(
			'data-distributed-editing-action-status',
			'error'
		);
		await expect(
			statusChrome.getByText(
				'Server version could not be refreshed. Local changes remain protected and exportable in this editor session; keep this tab open before trying again.'
			)
		).toBeVisible();
		await expect(
			statusChrome
				.getByRole( 'button', {
					name: 'Export local changes',
				} )
				.first()
		).toBeVisible();
		await expect(
			statusChrome
				.getByRole( 'button', {
					name: 'Refresh server version',
				} )
				.first()
		).toBeVisible();
		await expect
			.poll( () => getDistributedEditingState( page ) )
			.toMatchObject( {
				refetchedServerContent: null,
				refetchedServerState: false,
				requiresServerStateRefetch: true,
				canExportLocalUpdates: true,
				retrySaveHandoffStatus: 'retry_save_blocked',
				retrySaveHandoffReason: 'server_state_refetch_required',
				retrySaveHandoffBlocksNormalSave: true,
			} );
		await expect
			.poll( editor.getEditedPostContent )
			.toBe( LOCAL_PENDING_CONTENT );
		expect( refetchRequestCount ).toBe( 1 );
		expect( guardedRetrySaveRequestCount ).toBe( 0 );
		expect( postWriteRequestCount ).toBe( 0 );
	} );

	test( 'refreshes server state from a blocked retry-save status without saving', async ( {
		admin,
		context,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toBeFocused();
		await context.grantPermissions( [
			'clipboard-read',
			'clipboard-write',
		] );

		let refetchRequestCount = 0;
		let guardedRetrySaveRequestCount = 0;
		let postWriteRequestCount = 0;

		await page.route( isGuardedRetrySaveRequest, async ( route ) => {
			guardedRetrySaveRequestCount += 1;

			await route.fulfill( {
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify( {
					code: 'unexpected_retry_save_request',
					message:
						'Refreshing status chrome server state should not call guarded retry-save.',
				} ),
			} );
		} );
		await page.route( isPostRestRequest, async ( route ) => {
			const request = route.request();
			const requestUrl = new URL( request.url() );

			if (
				request.method() === 'GET' &&
				isPostEditRefetchRequest( requestUrl )
			) {
				refetchRequestCount += 1;
				const postIdMatch = requestUrl.pathname.match(
					/\/wp\/v2\/posts\/(\d+)/
				);

				await route.fulfill( {
					contentType: 'application/json',
					body: JSON.stringify( {
						id: Number( postIdMatch?.[ 1 ] || 1 ),
						modified_gmt: '2026-05-13T00:00:00',
						content: {
							raw: REFETCHED_CONTENT,
						},
						distributed_editing: {
							server_version: '8',
						},
					} ),
				} );
				return;
			}

			if ( request.method() !== 'GET' ) {
				postWriteRequestCount += 1;

				await route.fulfill( {
					status: 500,
					contentType: 'application/json',
					body: JSON.stringify( {
						code: 'unexpected_post_write_request',
						message:
							'Refreshing status chrome server state should not save post content.',
					} ),
				} );
				return;
			}

			await route.continue();
		} );
		await page.evaluate(
			( { localContent } ) => {
				window.wp.data
					.dispatch( 'core/editor' )
					.editPost( { content: localContent } );
			},
			{
				localContent: LOCAL_PENDING_CONTENT,
			}
		);
		await expect
			.poll( editor.getEditedPostContent )
			.toBe( LOCAL_PENDING_CONTENT );

		await seedBlockedRetrySaveRefetchState( page );

		const statusChrome = getStatusChrome( page );
		await expect(
			page.locator( INTERNAL_INSPECTOR_SELECTOR )
		).toBeHidden();
		await expect( statusChrome ).toBeVisible();
		await expect(
			statusChrome.getByText( 'Retry save needs server refresh' )
		).toBeVisible();
		await expect(
			statusChrome.getByText(
				'The server state must be refreshed before retry-save can continue. Local changes are still protected; refresh the server version before trying again.'
			)
		).toBeVisible();
		await expect(
			statusChrome
				.getByRole( 'button', {
					name: 'Export local changes',
				} )
				.first()
		).toBeVisible();
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Export local changes',
			} )
		).toHaveCount( 2 );
		await expect(
			statusChrome.getByRole( 'button', {
				name: 'Refresh server version',
			} )
		).toHaveCount( 2 );

		await statusChrome
			.getByRole( 'button', { name: 'Export local changes' } )
			.first()
			.click();
		await expect(
			statusChrome.getByText(
				'Local changes copied. Keep this data until the server confirms your update.'
			)
		).toBeVisible();

		const clipboardPayload = JSON.parse(
			await page.evaluate( async () => {
				return await window.navigator.clipboard.readText();
			} )
		);
		expect( clipboardPayload ).toMatchObject( {
			version: 1,
			format: 'wp/de-rtc-local-updates',
			post: {
				id: expect.any( Number ),
				type: 'post',
			},
			postContent: LOCAL_PENDING_CONTENT,
			distributedEditingSessionState: {
				pendingChangeCount: 1,
				requiresServerStateRefetch: true,
				canExportLocalUpdates: true,
				retrySaveHandoffStatus: 'retry_save_blocked',
				retrySaveHandoffReason: 'server_state_refetch_required',
			},
		} );

		await statusChrome
			.getByRole( 'button', { name: 'Refresh server version' } )
			.first()
			.click();
		await expect(
			statusChrome.getByText(
				'Server version refreshed. Local changes remain protected and exportable while you review before retrying.'
			)
		).toBeVisible();

		await expect
			.poll( () =>
				page.evaluate( () => {
					const state = window.wp.data
						.select( 'core/editor' )
						.getDistributedEditingSessionState();

					return {
						serverVersion: state.serverVersion,
						refetchedServerContent: state.refetchedServerContent,
						refetchedServerState: state.refetchedServerState,
						requiresServerStateRefetch:
							state.requiresServerStateRefetch,
						canExportLocalUpdates: state.canExportLocalUpdates,
						retrySaveHandoffStatus: state.retrySaveHandoffStatus,
						retrySaveHandoffReason: state.retrySaveHandoffReason,
					};
				} )
			)
			.toEqual( {
				serverVersion: '8',
				refetchedServerContent: REFETCHED_CONTENT,
				refetchedServerState: true,
				requiresServerStateRefetch: false,
				canExportLocalUpdates: true,
				retrySaveHandoffStatus: 'retry_save_blocked',
				retrySaveHandoffReason: 'server_state_refetch_required',
			} );
		await expect
			.poll( editor.getEditedPostContent )
			.toBe( LOCAL_PENDING_CONTENT );
		expect( refetchRequestCount ).toBe( 1 );
		expect( guardedRetrySaveRequestCount ).toBe( 0 );
		expect( postWriteRequestCount ).toBe( 0 );
	} );

	test( 'blocks normal save while retry-save is already in progress', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await expect(
			editor.canvas.getByRole( 'textbox', { name: 'Add title' } )
		).toBeFocused();

		let guardedRetrySaveRequestCount = 0;
		let postWriteRequestCount = 0;

		await page.route( isGuardedRetrySaveRequest, async ( route ) => {
			guardedRetrySaveRequestCount += 1;

			await route.fulfill( {
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify( {
					code: 'unexpected_retry_save_request',
					message:
						'Blocked in-flight retry-save state should not submit another guarded retry-save.',
				} ),
			} );
		} );
		await page.route( isPostRestRequest, async ( route ) => {
			const request = route.request();

			if ( request.method() !== 'GET' ) {
				postWriteRequestCount += 1;

				await route.fulfill( {
					status: 500,
					contentType: 'application/json',
					body: JSON.stringify( {
						code: 'unexpected_post_write_request',
						message:
							'Blocked in-flight retry-save state should not fall back to normal post save.',
					} ),
				} );
				return;
			}

			await route.continue();
		} );

		await editPostContent( page, editor, LOCAL_PENDING_CONTENT );
		await seedRetrySaveInProgressState( page );

		const statusChrome = getStatusChrome( page );
		await expect(
			page.locator( INTERNAL_INSPECTOR_SELECTOR )
		).toBeHidden();
		await expect( statusChrome ).toBeVisible();
		await expect(
			statusChrome.getByText( 'Retry save in progress' )
		).toBeVisible();
		await expect(
			statusChrome.getByText(
				'The editor is sending rebased changes through the guarded retry-save path. Keep this tab open until the server confirms the save.'
			)
		).toBeVisible();

		const saveResult = await page.evaluate( async () => {
			return await window.wp.data.dispatch( 'core/editor' ).savePost();
		} );

		expect( saveResult ).toMatchObject( {
			status: 'retry_save_blocked',
			reason: 'retry_save_in_progress',
			allowsNormalSaveFallback: false,
			blocksNormalSavePost: true,
			callsRetrySaveAction: false,
			callsNormalSavePost: false,
		} );
		await expect(
			statusChrome.getByText( 'Retry save already in progress' )
		).toBeVisible();
		await expect(
			statusChrome.getByText(
				'A retry save is already waiting for server confirmation. Local changes are still protected; keep this tab open until it finishes.'
			)
		).toBeVisible();
		await expect
			.poll( () => getDistributedEditingState( page ) )
			.toMatchObject( {
				hasPendingChanges: true,
				isAwaitingServerConfirmation: true,
				mustOfferLocalCopy: true,
				canExportLocalUpdates: true,
				retrySubmitSaveStatus: 'ready',
				retrySubmitSavePrepared: true,
				retrySaveStatus: 'saving',
				retrySaveHandoffStatus: 'retry_save_blocked',
				retrySaveHandoffReason: 'retry_save_in_progress',
				retrySaveHandoffBlocksNormalSave: true,
			} );
		await expect
			.poll( editor.getEditedPostContent )
			.toBe( LOCAL_PENDING_CONTENT );
		expect( guardedRetrySaveRequestCount ).toBe( 0 );
		expect( postWriteRequestCount ).toBe( 0 );
	} );
} );
