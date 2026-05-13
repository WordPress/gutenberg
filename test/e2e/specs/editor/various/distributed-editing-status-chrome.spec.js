/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const BASE_CONTENT =
	'<!-- wp:paragraph --><p>Original client base</p><!-- /wp:paragraph -->';
const SERVER_CONTENT =
	'<!-- wp:paragraph --><p>Server changed copy</p><!-- /wp:paragraph -->';
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
			canExportLocalUpdates: state.canExportLocalUpdates,
		};
	} );
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

test.describe( 'Distributed Editing status chrome', () => {
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
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
} );
