/**
 * External dependencies
 */
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { PostPublishButton } from '../';

jest.mock( '../../distributed-editing-server-sync-button', () => () => (
	<button data-distributed-editing-server-sync-button>Sync</button>
) );

describe( 'PostPublishButton', () => {
	describe( 'aria-disabled', () => {
		it( 'should be true if post is currently saving', () => {
			render( <PostPublishButton isPublishable isSaveable isSaving /> );

			expect(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			).toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'should be true if post is not publishable and not forceIsDirty', () => {
			render(
				<PostPublishButton
					isSaveable
					isPublishable={ false }
					forceIsDirty={ false }
				/>
			);

			expect(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			).toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'should be true if post is not saveable', () => {
			render( <PostPublishButton isPublishable isSaveable={ false } /> );

			expect(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			).toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'should remain clickable if Distributed Editing owns the save action', () => {
			render(
				<PostPublishButton
					isPublishable
					isSaveable={ false }
					distributedEditingSaveButtonState={ {
						status: 'workflow_action_required',
						source: 'stale_base_recovery',
						label: 'Apply local changes',
						statusText:
							'Apply protected local changes before Save can update the post.',
						clickAction: 'apply_local_changes',
					} }
				/>
			);

			expect(
				screen.getByRole( 'button', { name: 'Apply local changes' } )
			).toHaveAttribute( 'aria-disabled', 'false' );
		} );

		it( 'should be true if post saving is locked', () => {
			render(
				<PostPublishButton
					isPublishable
					isSaveable
					isPostSavingLocked
				/>
			);

			expect(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			).toHaveAttribute( 'aria-disabled', 'true' );
		} );

		it( 'should be false if post is saveable but not publishable and forceIsDirty is true', () => {
			render(
				<PostPublishButton
					isSaveable
					isPublishable={ false }
					forceIsDirty
				/>
			);

			expect(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			).toHaveAttribute( 'aria-disabled', 'false' );
		} );

		it( 'should be false if Distributed Editing has pending local changes', () => {
			render(
				<PostPublishButton
					isSaveable
					isPublishable={ false }
					forceIsDirty={ false }
					hasPendingDistributedEditingLocalChanges
				/>
			);

			expect(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			).toHaveAttribute( 'aria-disabled', 'false' );
		} );

		it( 'should be false if post is publishave and saveable', () => {
			render( <PostPublishButton isPublishable isSaveable /> );

			expect(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			).toHaveAttribute( 'aria-disabled', 'false' );
		} );
	} );

	describe( 'publish status', () => {
		it( 'should be pending for contributor', async () => {
			const user = userEvent.setup();
			const savePostStatus = jest.fn();
			render(
				<PostPublishButton
					hasPublishAction={ false }
					savePostStatus={ savePostStatus }
					isSaveable
					isPublishable
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			);

			expect( savePostStatus ).toHaveBeenCalledWith( 'pending' );
		} );

		it( 'should be future for scheduled post', async () => {
			const user = userEvent.setup();
			const savePostStatus = jest.fn();
			render(
				<PostPublishButton
					hasPublishAction
					savePostStatus={ savePostStatus }
					isBeingScheduled
					isSaveable
					isPublishable
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			);

			expect( savePostStatus ).toHaveBeenCalledWith( 'future' );
		} );

		it( 'should be private for private visibility', async () => {
			const user = userEvent.setup();
			const savePostStatus = jest.fn();
			render(
				<PostPublishButton
					hasPublishAction
					savePostStatus={ savePostStatus }
					visibility="private"
					isSaveable
					isPublishable
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			);

			expect( savePostStatus ).toHaveBeenCalledWith( 'private' );
		} );

		it( 'should be publish otherwise', async () => {
			const user = userEvent.setup();
			const savePostStatus = jest.fn();
			render(
				<PostPublishButton
					hasPublishAction
					savePostStatus={ savePostStatus }
					isSaveable
					isPublishable
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			);

			expect( savePostStatus ).toHaveBeenCalledWith( 'publish' );
		} );
	} );

	describe( 'click', () => {
		it( 'should save with status', async () => {
			const user = userEvent.setup();
			const savePostStatus = jest.fn();
			render(
				<PostPublishButton
					hasPublishAction
					savePostStatus={ savePostStatus }
					isSaveable
					isPublishable
				/>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Submit for Review' } )
			);

			expect( savePostStatus ).toHaveBeenCalledWith( 'publish' );
		} );
	} );

	it( 'should have save modifier class', () => {
		render( <PostPublishButton isSaving isPublished /> );

		expect(
			screen.getByRole( 'button', { name: 'Submit for Review' } )
		).toHaveClass( 'is-busy' );
	} );

	it( 'should show a Distributed Editing Sync button beside the published Save control', () => {
		render(
			<PostPublishButton
				hasPublishAction
				isPublished
				isPublishable
				isSaveable
				distributedEditingSaveButtonState={ {
					status: 'accepted_but_unconsumed',
					label: 'Save',
					statusText: 'These changes are ready for Save.',
					clickAction: 'continue_guarded_retry_save',
				} }
			/>
		);

		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeVisible();
		expect(
			screen.getByRole( 'button', { name: 'Sync' } )
		).toHaveAttribute( 'data-distributed-editing-server-sync-button' );
	} );

	it( 'should not show the Sync button beside Publish or Submit for Review', () => {
		const { rerender } = render(
			<PostPublishButton hasPublishAction isPublishable isSaveable />
		);

		expect(
			screen.getByRole( 'button', { name: 'Submit for Review' } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Sync' } )
		).not.toBeInTheDocument();

		rerender(
			<PostPublishButton hasPublishAction isPublishable isSaveable />
		);

		expect(
			screen.getByRole( 'button', { name: 'Submit for Review' } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Sync' } )
		).not.toBeInTheDocument();
	} );

	it( 'should route active Distributed Editing Save actions before non-post entity prompts', async () => {
		const user = userEvent.setup();
		const onSubmit = jest.fn();
		const savePostStatus = jest.fn();
		const setEntitiesSavedStatesCallback = jest.fn();

		render(
			<PostPublishButton
				hasNonPostEntityChanges
				hasPublishAction
				isSaveable
				isPublishable
				onSubmit={ onSubmit }
				savePostStatus={ savePostStatus }
				setEntitiesSavedStatesCallback={
					setEntitiesSavedStatesCallback
				}
				distributedEditingSaveButtonState={ {
					status: 'accepted_but_unconsumed',
					label: 'Save',
					statusText: 'These changes are ready for Save.',
					clickAction: 'continue_guarded_retry_save',
					disabled: false,
				} }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		expect( setEntitiesSavedStatesCallback ).not.toHaveBeenCalled();
		expect( onSubmit ).not.toHaveBeenCalled();
		expect( savePostStatus ).toHaveBeenCalledWith( 'publish' );
	} );

	it( 'should route Distributed Editing review actions before non-post entity prompts', async () => {
		const user = userEvent.setup();
		const onSubmit = jest.fn();
		const savePostStatus = jest.fn();
		const setEntitiesSavedStatesCallback = jest.fn();

		render(
			<PostPublishButton
				hasNonPostEntityChanges
				hasPublishAction
				isSaveable
				isPublishable
				onSubmit={ onSubmit }
				savePostStatus={ savePostStatus }
				setEntitiesSavedStatesCallback={
					setEntitiesSavedStatesCallback
				}
				distributedEditingSaveButtonState={ {
					status: 'review_blocked',
					source: 'risky_block_review',
					label: 'Review changes',
					statusText:
						'Review changes before WordPress updates the post.',
					clickAction: 'open_pre_publish_review',
					disabled: false,
				} }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Review changes' } )
		);

		expect( setEntitiesSavedStatesCallback ).not.toHaveBeenCalled();
		expect( onSubmit ).not.toHaveBeenCalled();
		expect( savePostStatus ).toHaveBeenCalledWith( 'publish' );
	} );

	it( 'should show active Distributed Editing save descriptor text', () => {
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				distributedEditingSaveButtonState={ {
					status: 'accepted_but_unconsumed',
					reason: 'accepted_retry_submit_proof_unconsumed',
					source: 'retry_submit',
					label: 'Save',
					statusText: 'These changes are ready for Save.',
					clickAction: 'continue_guarded_retry_save',
					authorityState: 'ready_for_guarded_update',
					localChangesState: 'protected_local_changes_exportable',
					reviewCheckpointState: 'review_accepted',
					authoritativePostState: 'ready_for_guarded_update',
					saveStateSummaryText:
						'Reviewed local changes are ready for Save; the post in WordPress is not updated yet.',
					authoritativePostUpdated: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Save',
		} );
		expect( button ).toHaveAttribute(
			'title',
			'These changes are ready for Save.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-status',
			'accepted_but_unconsumed'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-source',
			'retry_submit'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-click-action',
			'continue_guarded_retry_save'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-reason',
			'accepted_retry_submit_proof_unconsumed'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-authority-state',
			'ready_for_guarded_update'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-local-changes-state',
			'protected_local_changes_exportable'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-review-checkpoint-state',
			'review_accepted'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-authoritative-post-state',
			'ready_for_guarded_update'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-state-summary',
			'Reviewed local changes are ready for Save; the post in WordPress is not updated yet.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-authoritative-post-updated',
			'false'
		);
	} );

	it( 'should show mid-flow Distributed Editing recovery as the publish Save button action', () => {
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				distributedEditingSaveButtonState={ {
					status: 'workflow_action_required',
					reason: 'local_changes_not_applied_before_save',
					source: 'stale_base_recovery',
					label: 'Apply local changes',
					statusText:
						'Apply protected local changes before Save can update the post.',
					clickAction: 'apply_local_changes',
					authorityState: 'review_required_before_update',
					localChangesState: 'protected_local_changes_exportable',
					reviewCheckpointState: 'review_required',
					authoritativePostState: 'review_required_before_update',
					saveStateSummaryText:
						'Protected local changes need the next recovery step before WordPress can update the post.',
					authoritativePostUpdated: false,
				} }
				distributedEditingSaveJourneyState={ {
					shouldExposeInSaveControls: true,
					step: 'local_changes_protected',
					action: 'apply_local_changes',
					title: 'Apply local edits',
					summary: 'Apply local edits in this editor before saving.',
					actionHint: 'Apply local changes',
					requiresActionBeforeSave: true,
					statusChromeSummary:
						'Protected local changes need the next recovery step before WordPress can update the post.',
					statusChromeAuthorityState: 'review_required_before_update',
					statusChromeAuthorityText:
						'Finish the recovery step before WordPress can update the post.',
					claimsSavedWithoutEvidence: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Apply local changes',
		} );
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-status',
			'workflow_action_required'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-source',
			'stale_base_recovery'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-click-action',
			'apply_local_changes'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-reason',
			'local_changes_not_applied_before_save'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action',
			'apply_local_changes'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-hint',
			'Apply local changes'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'true'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-state-summary',
			'Protected local changes need the next recovery step before WordPress can update the post.'
		);
	} );

	it( 'should expose Distributed Editing Save journey data on the real publish Save control without changing the click path', async () => {
		const user = userEvent.setup();
		const savePostStatus = jest.fn();
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				savePostStatus={ savePostStatus }
				distributedEditingSaveJourneyState={ {
					shouldExposeInSaveControls: true,
					step: 'ready_to_edit',
					action: 'edit',
					title: 'Save is available',
					summary:
						'Use Save when you are ready for WordPress to update this post.',
					statusChromeSummary:
						'Save can update the post in WordPress.',
					statusChromeAuthorityState:
						'ready_to_update_authoritative_post',
					statusChromeAuthorityText:
						'Save can update the post in WordPress.',
					claimsSavedWithoutEvidence: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Submit for Review',
		} );
		expect( button ).toHaveAttribute(
			'title',
			'Use Save when you are ready for WordPress to update this post. Save can update the post in WordPress.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-step',
			'ready_to_edit'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action',
			'edit'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-descriptor-only',
			'true'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-normal-save',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-rest',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-retry-save',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-changes-post-lock',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-claims-saved-without-evidence',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-exposes-proof-internals',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-exposes-raw-content',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-mutates-editor-content',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-mutates-persisted-post-content',
			'false'
		);
		const cueLabel = screen.getByText( 'Save is available' );
		const cue = screen.getByLabelText(
			'Use Save when you are ready for WordPress to update this post. Save can update the post in WordPress.'
		);
		expect( cueLabel ).toBeVisible();
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-visual-cue',
			'true'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-compact-affordance',
			'available'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-step',
			'ready_to_edit'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action',
			'edit'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'false'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-title',
			'Save is available'
		);
		expect( cue ).toHaveAttribute(
			'title',
			'Use Save when you are ready for WordPress to update this post. Save can update the post in WordPress.'
		);
		expect( cue ).toHaveAttribute(
			'aria-label',
			'Use Save when you are ready for WordPress to update this post. Save can update the post in WordPress.'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-status-summary',
			'Save can update the post in WordPress.'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-authority-state',
			'ready_to_update_authoritative_post'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-authority-summary',
			'Save can update the post in WordPress.'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-normal-save',
			'false'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-retry-save',
			'false'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-mutates-editor-content',
			'false'
		);

		await user.click( button );

		expect( savePostStatus ).toHaveBeenCalledWith( 'pending' );
	} );

	it( 'should explain dirty Distributed Editing edits before visible Save checks with WordPress', async () => {
		const user = userEvent.setup();
		const savePostStatus = jest.fn();
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				savePostStatus={ savePostStatus }
				distributedEditingSaveJourneyState={ {
					shouldExposeInSaveControls: true,
					step: 'local_changes_protected',
					action: 'dirty_save_preflight',
					title: 'Save checks with WordPress',
					summary:
						'Save will check the latest post before WordPress updates it. Keep this tab open until WordPress confirms.',
					statusChromeSummary:
						'Local edits will be checked with WordPress before the post updates.',
					statusChromeAuthorityState:
						'ready_to_update_authoritative_post',
					statusChromeAuthorityText:
						'Save checks the latest post before WordPress updates it.',
					dirtyEditorPreflight: true,
					claimsSavedWithoutEvidence: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Submit for Review',
		} );
		expect( button ).toHaveAttribute(
			'title',
			'Save will check the latest post before WordPress updates it. Keep this tab open until WordPress confirms. Local edits will be checked with WordPress before the post updates.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-step',
			'local_changes_protected'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action',
			'dirty_save_preflight'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-dirty-preflight',
			'true'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-status-summary',
			'Local edits will be checked with WordPress before the post updates.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-authority-summary',
			'Save checks the latest post before WordPress updates it.'
		);
		expect(
			screen.getByText( 'Save checks with WordPress' )
		).toBeVisible();

		await user.click( button );

		expect( savePostStatus ).toHaveBeenCalledWith( 'pending' );
	} );

	it( 'should show the refetch action hint on the Save journey cue without changing the click path', async () => {
		const user = userEvent.setup();
		const savePostStatus = jest.fn();
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				savePostStatus={ savePostStatus }
				distributedEditingSaveButtonState={ {
					status: 'refetch_required',
					source: 'retry_save',
					label: 'Get latest post',
					statusText:
						'Load the latest post before Save can continue.',
					clickAction: 'refetch_server_state',
					authorityState: 'server_refresh_required_before_update',
					localChangesState: 'protected_local_changes_exportable',
					reviewCheckpointState: 'server_refresh_required',
					authoritativePostState:
						'server_refresh_required_before_update',
					saveStateSummaryText:
						'Getting the latest post only refreshes server state; protected local changes stay in this editor until a later Save is confirmed.',
					authoritativePostUpdated: false,
				} }
				distributedEditingSaveJourneyState={ {
					shouldExposeInSaveControls: true,
					step: 'get_latest_post',
					action: 'get_latest_post',
					title: 'Load latest version',
					summary: 'Load the latest post before saving again.',
					actionHint: 'Get latest first',
					requiresActionBeforeSave: true,
					statusChromeSummary:
						'Getting the latest post only refreshes server state; protected local changes stay in this editor until a later Save is confirmed.',
					statusChromeAuthorityState:
						'server_refresh_required_before_update',
					statusChromeAuthorityText:
						'Get the latest post before WordPress can update it.',
					claimsSavedWithoutEvidence: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Get latest post',
		} );
		expect( button ).toHaveAttribute(
			'title',
			'Get latest first. Load the latest post before saving again. Getting the latest post only refreshes server state; protected local changes stay in this editor until a later Save is confirmed.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-step',
			'get_latest_post'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action',
			'get_latest_post'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-hint',
			'Get latest first'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'true'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-status',
			'refetch_required'
		);
		const cueLabel = screen.getByText( 'Load latest version' );
		const cueActionHint = screen.getByText( 'Get latest first' );
		const cue = screen.getByLabelText(
			'Get latest first. Load the latest post before saving again. Getting the latest post only refreshes server state; protected local changes stay in this editor until a later Save is confirmed.'
		);
		expect( cueLabel ).toBeVisible();
		expect( cueActionHint ).toBeVisible();
		expect( cue ).toHaveTextContent(
			/^Get latest first.*Load latest version/
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-visual-cue',
			'true'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-hint',
			'Get latest first'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'true'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-status-summary',
			'Getting the latest post only refreshes server state; protected local changes stay in this editor until a later Save is confirmed.'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-normal-save',
			'false'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-retry-save',
			'false'
		);

		await user.click( button );

		expect( savePostStatus ).toHaveBeenCalledWith( 'pending' );
	} );

	it( 'should prefer Save journey title text while keeping the active Distributed Editing label', () => {
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				distributedEditingSaveButtonState={ {
					status: 'review_blocked',
					reason: 'fresh_review_required',
					source: 'fresh_review',
					label: 'Review changes',
					statusText:
						'Review changes before WordPress updates the post.',
					clickAction: 'open_pre_publish_review',
					authorityState: 'review_required_before_update',
					localChangesState: 'protected_local_changes_exportable',
					reviewCheckpointState: 'review_required',
					authoritativePostState: 'review_required_before_update',
					saveStateSummaryText:
						'Protected local changes need review before WordPress can update the post.',
					authoritativePostUpdated: false,
				} }
				distributedEditingSaveJourneyState={ {
					shouldExposeInSaveControls: true,
					step: 'review_changes',
					action: 'review_changes',
					title: 'Review changes',
					summary: 'Review changes before saving.',
					actionHint: 'Review before update',
					requiresActionBeforeSave: true,
					statusChromeSummary:
						'Protected local changes need review before WordPress can update the post.',
					statusChromeAuthorityState: 'review_required_before_update',
					statusChromeAuthorityText:
						'WordPress cannot update the post until risky changes are approved or removed.',
					claimsSavedWithoutEvidence: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Review changes',
		} );
		expect( button ).toHaveAttribute(
			'title',
			'Review before update. Review changes before saving. Protected local changes need review before WordPress can update the post.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-status',
			'review_blocked'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-step',
			'review_changes'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action',
			'review_changes'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-hint',
			'Review before update'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'true'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-normal-save',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-retry-save',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-claims-saved-without-evidence',
			'false'
		);
		const cue = screen.getByLabelText(
			'Review before update. Review changes before saving. Protected local changes need review before WordPress can update the post.'
		);
		const cueLabel = within( cue ).getByText( 'Review changes' );
		const cueActionHint = within( cue ).getByText( 'Review before update' );
		expect( cueLabel ).toBeVisible();
		expect( cueActionHint ).toBeVisible();
		expect( cue ).toHaveTextContent(
			/^Review before update.*Review changes/
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-visual-cue',
			'true'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-compact-affordance',
			'available'
		);
		expect( cue ).toHaveAttribute(
			'title',
			'Review before update. Review changes before saving. Protected local changes need review before WordPress can update the post.'
		);
		expect( cue ).toHaveAttribute(
			'aria-label',
			'Review before update. Review changes before saving. Protected local changes need review before WordPress can update the post.'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-hint',
			'Review before update'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'true'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-status-summary',
			'Protected local changes need review before WordPress can update the post.'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-authority-state',
			'review_required_before_update'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-authority-summary',
			'WordPress cannot update the post until risky changes are approved or removed.'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-step',
			'review_changes'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-normal-save',
			'false'
		);
	} );

	it( 'should show the WordPress Save action hint without requiring pre-Save action', async () => {
		const user = userEvent.setup();
		const savePostStatus = jest.fn();
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				savePostStatus={ savePostStatus }
				distributedEditingSaveButtonState={ {
					status: 'accepted_but_unconsumed',
					reason: 'accepted_retry_submit_proof_unconsumed',
					source: 'retry_submit',
					label: 'Save',
					statusText: 'These changes are ready for Save.',
					clickAction: 'continue_guarded_retry_save',
					authorityState: 'ready_for_guarded_update',
					localChangesState: 'protected_local_changes_exportable',
					reviewCheckpointState: 'review_accepted',
					authoritativePostState: 'ready_for_guarded_update',
					saveStateSummaryText:
						'Reviewed local changes are ready for Save; the post in WordPress is not updated yet.',
					authoritativePostUpdated: false,
				} }
				distributedEditingSaveJourneyState={ {
					shouldExposeInSaveControls: true,
					step: 'ready_to_save',
					action: 'save',
					title: 'Ready to Save',
					summary: 'Use Save to update the post.',
					actionHint: 'Send to WordPress',
					requiresActionBeforeSave: false,
					statusChromeSummary:
						'Reviewed local changes are ready for Save; the post in WordPress is not updated yet.',
					statusChromeAuthorityState: 'ready_for_guarded_update',
					statusChromeAuthorityText:
						'Reviewed changes are ready for WordPress to update the post.',
					claimsSavedWithoutEvidence: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Save',
		} );
		expect( button ).toHaveAttribute(
			'title',
			'Send to WordPress. Use Save to update the post. Reviewed local changes are ready for Save; the post in WordPress is not updated yet.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-step',
			'ready_to_save'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action',
			'save'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-hint',
			'Send to WordPress'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-status',
			'accepted_but_unconsumed'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-claims-saved-without-evidence',
			'false'
		);
		const cueLabel = screen.getByText( 'Ready to Save' );
		const cueActionHint = screen.getByText( 'Send to WordPress' );
		const cue = screen.getByLabelText(
			'Send to WordPress. Use Save to update the post. Reviewed local changes are ready for Save; the post in WordPress is not updated yet.'
		);
		expect( cueLabel ).toBeVisible();
		expect( cueActionHint ).toBeVisible();
		expect( cue ).toHaveTextContent( /^Send to WordPress.*Ready to Save/ );
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-visual-cue',
			'true'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-hint',
			'Send to WordPress'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'false'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-authority-state',
			'ready_for_guarded_update'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-normal-save',
			'false'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-retry-save',
			'false'
		);

		await user.click( button );

		expect( savePostStatus ).toHaveBeenCalledWith( 'pending' );
	} );

	it( 'should not expose Distributed Editing save descriptor data for the default state', () => {
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				distributedEditingSaveButtonState={ {
					status: 'update_ready',
					source: 'default',
					label: 'Update',
					statusText: 'Ready to update',
					clickAction: 'continue_save',
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Submit for Review',
		} );
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-button-status'
		);
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-button-source'
		);
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-button-click-action'
		);
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-button-reason'
		);
	} );

	it( 'should expose Distributed Editing save descriptor data on toggle buttons', () => {
		render(
			<PostPublishButton
				hasPublishAction
				isSaveable
				isPublishable
				isToggle
				distributedEditingSaveButtonState={ {
					status: 'retry_save_confirmed',
					source: 'retry_save',
					label: 'Retry save confirmed',
					statusText: 'Distributed Editing retry save confirmed.',
					disabled: true,
					authorityState: 'authoritative_update_confirmed',
					localChangesState: 'authoritative_update_confirmed',
					reviewCheckpointState: 'review_consumed',
					authoritativePostState: 'authoritative_update_confirmed',
					saveStateSummaryText: 'WordPress accepted the update.',
					authoritativePostUpdated: true,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Retry save confirmed',
		} );
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-status',
			'retry_save_confirmed'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-source',
			'retry_save'
		);
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-button-click-action'
		);
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-button-reason'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-authority-state',
			'authoritative_update_confirmed'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-local-changes-state',
			'authoritative_update_confirmed'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-review-checkpoint-state',
			'review_consumed'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-authoritative-post-state',
			'authoritative_update_confirmed'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-state-summary',
			'WordPress accepted the update.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-authoritative-post-updated',
			'true'
		);
	} );

	it( 'should route actionable Distributed Editing toggle clicks through the save handler', async () => {
		const user = userEvent.setup();
		const onToggle = jest.fn();
		const savePostStatus = jest.fn();
		render(
			<PostPublishButton
				hasPublishAction
				isSaveable
				isPublishable
				isToggle
				onToggle={ onToggle }
				savePostStatus={ savePostStatus }
				distributedEditingSaveButtonState={ {
					status: 'accepted_but_unconsumed',
					source: 'review_approval',
					label: 'Save',
					statusText: 'These changes are ready for Save.',
					clickAction: 'continue_guarded_retry_save',
					disabled: false,
				} }
			/>
		);

		await user.click(
			screen.getByRole( 'button', {
				name: 'Save',
			} )
		);

		expect( savePostStatus ).toHaveBeenCalledWith( 'publish' );
		expect( onToggle ).not.toHaveBeenCalled();
	} );

	it( 'should keep Distributed Editing review-required toggle clicks on the review panel path', async () => {
		const user = userEvent.setup();
		const onToggle = jest.fn();
		const savePostStatus = jest.fn();
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				isToggle
				onToggle={ onToggle }
				savePostStatus={ savePostStatus }
				distributedEditingSaveButtonState={ {
					status: 'review_blocked',
					source: 'risky_block_review',
					label: 'Review changes',
					statusText:
						'Review changes before WordPress updates the post.',
					clickAction: 'open_pre_publish_review',
					disabled: false,
				} }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Review changes' } )
		);

		expect( onToggle ).toHaveBeenCalledTimes( 1 );
		expect( savePostStatus ).not.toHaveBeenCalled();
	} );

	it( 'should expose Distributed Editing in-flight save state without clicking through', async () => {
		const user = userEvent.setup();
		const savePostStatus = jest.fn();
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				savePostStatus={ savePostStatus }
				distributedEditingSaveButtonState={ {
					status: 'fresh_review_validating',
					label: 'Checking review...',
					statusText:
						'Review is being checked before WordPress updates the post.',
					disabled: true,
					busy: true,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Checking review...',
		} );
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( button ).toHaveClass( 'is-busy' );

		await user.click( button );

		expect( savePostStatus ).not.toHaveBeenCalled();
	} );

	it( 'should show the waiting action hint without claiming the guarded update is saved', async () => {
		const user = userEvent.setup();
		const savePostStatus = jest.fn();
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				savePostStatus={ savePostStatus }
				distributedEditingSaveButtonState={ {
					status: 'retry_save_in_progress',
					source: 'retry_save',
					label: 'Saving',
					statusText: 'WordPress is saving your changes.',
					disabled: true,
					busy: true,
					authorityState: 'awaiting_server_confirmation',
					localChangesState:
						'protected_local_changes_awaiting_server_confirmation',
					reviewCheckpointState: 'review_accepted',
					authoritativePostState: 'awaiting_server_confirmation',
					saveStateSummaryText:
						'Reviewed local changes are waiting for WordPress confirmation before the post updates.',
					authoritativePostUpdated: false,
				} }
				distributedEditingSaveJourneyState={ {
					shouldExposeInSaveControls: true,
					step: 'waiting_for_wordpress',
					action: 'keep_tab_open',
					title: 'Saving',
					summary: 'WordPress is saving your changes.',
					actionHint: null,
					requiresActionBeforeSave: false,
					statusChromeSummary:
						'Reviewed local changes are waiting for WordPress confirmation before the post updates.',
					statusChromeAuthorityState: 'awaiting_server_confirmation',
					statusChromeAuthorityText:
						'WordPress has not confirmed these protected changes yet.',
					claimsSavedWithoutEvidence: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Saving',
		} );
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( button ).toHaveClass( 'is-busy' );
		expect( button ).toHaveAttribute(
			'title',
			'WordPress is saving your changes. Reviewed local changes are waiting for WordPress confirmation before the post updates.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-step',
			'waiting_for_wordpress'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action',
			'keep_tab_open'
		);
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-hint'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-claims-saved-without-evidence',
			'false'
		);
		const cue = screen.getByLabelText(
			'WordPress is saving your changes. Reviewed local changes are waiting for WordPress confirmation before the post updates.'
		);
		const cueLabel = within( cue ).getByText( 'Saving' );
		expect( cueLabel ).toBeVisible();
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-visual-cue',
			'true'
		);
		expect( cue ).not.toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-hint'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'false'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-authority-state',
			'awaiting_server_confirmation'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-normal-save',
			'false'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-retry-save',
			'false'
		);

		await user.click( button );

		expect( savePostStatus ).not.toHaveBeenCalled();
	} );

	it( 'should keep the in-flight Distributed Editing Save affordance visible without busy hiding', async () => {
		const user = userEvent.setup();
		const savePostStatus = jest.fn();
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				savePostStatus={ savePostStatus }
				distributedEditingSaveButtonState={ {
					status: 'retry_save_in_progress',
					reason: 'distributed_editing_save_button_click_in_flight',
					source: 'save_button',
					label: 'Save',
					statusText: 'Saving.',
					disabled: true,
					busy: false,
					authorityState: 'awaiting_server_confirmation',
					localChangesState:
						'protected_local_changes_awaiting_server_confirmation',
					reviewCheckpointState: 'review_accepted',
					authoritativePostState: 'awaiting_server_confirmation',
					saveStateSummaryText:
						'Reviewed local changes are waiting for WordPress confirmation before the post updates.',
					authoritativePostUpdated: false,
				} }
				distributedEditingSaveJourneyState={ {
					shouldExposeInSaveControls: true,
					step: 'waiting_for_wordpress',
					action: 'keep_tab_open',
					title: 'Saving',
					summary: 'WordPress is saving your changes.',
					actionHint: null,
					requiresActionBeforeSave: false,
					statusChromeSummary:
						'Reviewed local changes are waiting for WordPress confirmation before the post updates.',
					statusChromeAuthorityState: 'awaiting_server_confirmation',
					statusChromeAuthorityText:
						'WordPress has not confirmed these protected changes yet.',
					claimsSavedWithoutEvidence: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', { name: 'Save' } );
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( button ).not.toHaveClass( 'is-busy' );
		expect( button ).toHaveTextContent( /^Save$/ );
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-reason',
			'distributed_editing_save_button_click_in_flight'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-status',
			'retry_save_in_progress'
		);
		expect( button ).toHaveAttribute(
			'title',
			'WordPress is saving your changes. Reviewed local changes are waiting for WordPress confirmation before the post updates.'
		);

		const cue = screen.getByLabelText(
			'WordPress is saving your changes. Reviewed local changes are waiting for WordPress confirmation before the post updates.'
		);
		const cueLabel = within( cue ).getByText( 'Saving' );
		expect( cueLabel ).toBeVisible();
		expect( screen.queryByText( 'Keep tab open' ) ).not.toBeInTheDocument();
		expect( cue ).toHaveTextContent( /^Saving$/ );
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-visual-cue',
			'true'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'false'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-normal-save',
			'false'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-retry-save',
			'false'
		);

		await user.click( button );

		expect( savePostStatus ).not.toHaveBeenCalled();
	} );

	it( 'should show the confirmed action hint without obscuring saved-state evidence', async () => {
		const user = userEvent.setup();
		const savePostStatus = jest.fn();
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				savePostStatus={ savePostStatus }
				distributedEditingSaveButtonState={ {
					status: 'retry_save_confirmed',
					source: 'retry_save',
					label: 'Saved',
					statusText: 'WordPress saved your changes.',
					disabled: true,
					authorityState: 'authoritative_update_confirmed',
					localChangesState: 'authoritative_update_confirmed',
					reviewCheckpointState: 'review_consumed',
					authoritativePostState: 'authoritative_update_confirmed',
					saveStateSummaryText: 'Ready for new edits.',
					authoritativePostUpdated: true,
					hasRetrySaveSavedStateEvidence: true,
					hasProtectedLocalChanges: false,
				} }
				distributedEditingSaveJourneyState={ {
					shouldExposeInSaveControls: true,
					step: 'save_confirmed',
					action: 'none',
					title: 'Saved',
					summary: 'Ready for new edits.',
					actionHint: null,
					requiresActionBeforeSave: false,
					statusChromeSummary: 'Ready for new edits.',
					statusChromeAuthorityState:
						'authoritative_update_confirmed',
					statusChromeAuthorityText: 'WordPress accepted this Save.',
					claimsSavedWithoutEvidence: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', { name: 'Saved' } );
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( button ).toHaveAttribute( 'title', 'Ready for new edits.' );
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-step',
			'save_confirmed'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action',
			'none'
		);
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-hint'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-authority-state',
			'authoritative_update_confirmed'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-claims-saved-without-evidence',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-normal-save',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-retry-save',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-authoritative-post-updated',
			'true'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-confirmed-save-button-evidence-retained',
			'true'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-confirmed-save-button-quieted',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-confirmed-save-button-original-status',
			'retry_save_confirmed'
		);
		const cue = screen.getByLabelText( 'Ready for new edits.' );
		expect( cue ).toHaveTextContent( /^Saved$/ );
		expect(
			screen.queryByText( 'WordPress confirmed' )
		).not.toBeInTheDocument();
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-visual-cue',
			'true'
		);
		expect( cue ).not.toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-hint'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'false'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-authority-state',
			'authoritative_update_confirmed'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-normal-save',
			'false'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-calls-retry-save',
			'false'
		);

		await user.click( button );

		expect( savePostStatus ).not.toHaveBeenCalled();
	} );

	it( 'should let unsaved editor changes replace an idle confirmed Distributed Editing Save button', async () => {
		const user = userEvent.setup();
		const savePostStatus = jest.fn();
		render(
			<PostPublishButton
				isSaveable
				isPublishable={ false }
				hasUnsavedEditorChanges
				savePostStatus={ savePostStatus }
				distributedEditingSaveButtonState={ {
					status: 'retry_save_confirmed',
					source: 'retry_save',
					label: 'Saved',
					statusText: 'WordPress saved your changes.',
					disabled: true,
					authorityState: 'authoritative_update_confirmed',
					localChangesState: 'authoritative_update_confirmed',
					reviewCheckpointState: 'review_consumed',
					authoritativePostState: 'authoritative_update_confirmed',
					saveStateSummaryText: 'Ready for new edits.',
					authoritativePostUpdated: true,
					hasRetrySaveSavedStateEvidence: true,
					hasProtectedLocalChanges: false,
				} }
				distributedEditingSaveJourneyState={ {
					shouldExposeInSaveControls: false,
					step: 'local_changes_protected',
					action: 'dirty_save_preflight',
					title: 'Unsaved changes',
					summary: 'Use Save when you are ready.',
					actionHint: null,
					requiresActionBeforeSave: false,
					statusChromeSummary: 'Use Save when you are ready.',
					statusChromeAuthorityState:
						'ready_to_update_authoritative_post',
					statusChromeAuthorityText: 'Save can update the post.',
					claimsSavedWithoutEvidence: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Submit for Review',
		} );
		expect( button ).toHaveAttribute( 'aria-disabled', 'false' );
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-button-status'
		);
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-confirmed-save-button-evidence-retained'
		);
		expect( screen.queryByText( 'Saved' ) ).not.toBeInTheDocument();

		await user.click( button );

		expect( savePostStatus ).toHaveBeenCalledWith( 'pending' );
	} );

	it( 'should quiet an idle confirmed Distributed Editing Save button back to ordinary Save controls while retaining evidence', async () => {
		const previousHoldMs =
			globalThis.__experimentalDistributedEditingConfirmedSaveButtonHoldMs;
		globalThis.__experimentalDistributedEditingConfirmedSaveButtonHoldMs = 1000;
		jest.useFakeTimers();

		try {
			render(
				<PostPublishButton
					isSaveable
					isPublishable
					distributedEditingSaveButtonState={ {
						status: 'retry_save_confirmed',
						reason: 'retry_save_already_confirmed',
						source: 'retry_save',
						label: 'Saved',
						statusText: 'WordPress saved your changes.',
						disabled: true,
						authorityState: 'authoritative_update_confirmed',
						localChangesState: 'authoritative_update_confirmed',
						reviewCheckpointState: 'review_consumed',
						authoritativePostState:
							'authoritative_update_confirmed',
						saveStateSummaryText: 'Ready for new edits.',
						authoritativePostUpdated: true,
						hasRetrySaveSavedStateEvidence: true,
						hasProtectedLocalChanges: false,
					} }
					distributedEditingSaveJourneyState={ {
						shouldExposeInSaveControls: true,
						step: 'save_confirmed',
						action: 'none',
						title: 'Saved',
						summary: 'Ready for new edits.',
						actionHint: null,
						requiresActionBeforeSave: false,
						statusChromeSummary: 'Ready for new edits.',
						statusChromeAuthorityState:
							'authoritative_update_confirmed',
						statusChromeAuthorityText:
							'WordPress accepted this Save.',
						claimsSavedWithoutEvidence: false,
					} }
				/>
			);

			expect(
				screen.getByRole( 'button', { name: 'Saved' } )
			).toHaveAttribute(
				'data-distributed-editing-confirmed-save-button-quieted',
				'false'
			);

			await act( async () => {
				jest.advanceTimersByTime( 1000 );
			} );

			const quietedButton = screen.getByRole( 'button', {
				name: 'Submit for Review',
			} );
			expect( quietedButton ).toHaveAttribute( 'aria-disabled', 'false' );
			expect( quietedButton ).not.toHaveAttribute(
				'data-distributed-editing-save-button-status'
			);
			expect( quietedButton ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-button-evidence-retained',
				'true'
			);
			expect( quietedButton ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-button-quieted',
				'true'
			);
			expect( quietedButton ).toHaveAttribute(
				'data-distributed-editing-confirmed-save-button-original-status',
				'retry_save_confirmed'
			);
			expect( quietedButton ).not.toHaveAttribute(
				'data-distributed-editing-save-control-journey-step'
			);
			expect( quietedButton ).not.toHaveAttribute( 'title' );
			expect( screen.queryByText( 'Saved' ) ).not.toBeInTheDocument();
			expect(
				screen.queryByText( 'Save is available' )
			).not.toBeInTheDocument();
		} finally {
			jest.useRealTimers();

			if ( previousHoldMs === undefined ) {
				delete globalThis.__experimentalDistributedEditingConfirmedSaveButtonHoldMs;
			} else {
				globalThis.__experimentalDistributedEditingConfirmedSaveButtonHoldMs =
					previousHoldMs;
			}
		}
	} );
} );
