/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { PostPublishButton } from '../';

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

	it( 'should show active Distributed Editing save descriptor text', () => {
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				distributedEditingSaveButtonState={ {
					status: 'accepted_but_unconsumed',
					reason: 'fresh_review_accepted_but_unconsumed',
					source: 'fresh_review',
					label: 'Submit reviewed changes',
					statusText:
						'Accepted Distributed Editing proof is ready for guarded retry save.',
					clickAction: 'continue_guarded_retry_save',
					authorityState: 'ready_for_guarded_update',
					localChangesState: 'protected_local_changes_exportable',
					reviewCheckpointState: 'review_accepted',
					authoritativePostState: 'ready_for_guarded_update',
					saveStateSummaryText:
						'Reviewed local changes are ready for guarded update; the authoritative post is not updated yet.',
					authoritativePostUpdated: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Submit reviewed changes',
		} );
		expect( button ).toHaveAttribute(
			'title',
			'Accepted Distributed Editing proof is ready for guarded retry save.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-status',
			'accepted_but_unconsumed'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-source',
			'fresh_review'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-click-action',
			'continue_guarded_retry_save'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-reason',
			'fresh_review_accepted_but_unconsumed'
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
			'Reviewed local changes are ready for guarded update; the authoritative post is not updated yet.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-authoritative-post-updated',
			'false'
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
						'Save can update the authoritative WordPress post.',
					statusChromeAuthorityState:
						'ready_to_update_authoritative_post',
					statusChromeAuthorityText:
						'Save can update the authoritative WordPress post.',
					claimsSavedWithoutEvidence: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Submit for Review',
		} );
		expect( button ).toHaveAttribute(
			'title',
			'Use Save when you are ready for WordPress to update this post. Save can update the authoritative WordPress post.'
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
			'Use Save when you are ready for WordPress to update this post. Save can update the authoritative WordPress post.'
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
			'Use Save when you are ready for WordPress to update this post. Save can update the authoritative WordPress post.'
		);
		expect( cue ).toHaveAttribute(
			'aria-label',
			'Use Save when you are ready for WordPress to update this post. Save can update the authoritative WordPress post.'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-status-summary',
			'Save can update the authoritative WordPress post.'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-authority-state',
			'ready_to_update_authoritative_post'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-authority-summary',
			'Save can update the authoritative WordPress post.'
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
					label: 'Refetch required',
					statusText:
						'The latest post must be loaded before Distributed Editing can save.',
					clickAction: 'refetch_server_state',
					authorityState: 'server_refresh_required_before_update',
					localChangesState: 'protected_local_changes_exportable',
					reviewCheckpointState: 'server_refresh_required',
					authoritativePostState:
						'server_refresh_required_before_update',
					saveStateSummaryText:
						'Protected local changes need a server refresh before the authoritative post can update.',
					authoritativePostUpdated: false,
				} }
				distributedEditingSaveJourneyState={ {
					shouldExposeInSaveControls: true,
					step: 'get_latest_post',
					action: 'get_latest_post',
					title: 'Save needs the latest post',
					summary:
						'Get the latest post before Save updates WordPress; local changes stay protected.',
					actionHint: 'Get latest first',
					requiresActionBeforeSave: true,
					statusChromeSummary:
						'Protected local changes need a server refresh before the authoritative post can update.',
					statusChromeAuthorityState:
						'server_refresh_required_before_update',
					statusChromeAuthorityText:
						'Server state must be refreshed before the authoritative WordPress post can be updated.',
					claimsSavedWithoutEvidence: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Refetch required',
		} );
		expect( button ).toHaveAttribute(
			'title',
			'Get latest first. Get the latest post before Save updates WordPress; local changes stay protected. Protected local changes need a server refresh before the authoritative post can update.'
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
		const cueLabel = screen.getByText( 'Save needs the latest post' );
		const cueActionHint = screen.getByText( 'Get latest first' );
		const cue = screen.getByLabelText(
			'Get latest first. Get the latest post before Save updates WordPress; local changes stay protected. Protected local changes need a server refresh before the authoritative post can update.'
		);
		expect( cueLabel ).toBeVisible();
		expect( cueActionHint ).toBeVisible();
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
			'Protected local changes need a server refresh before the authoritative post can update.'
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
						'Save opens review before updating the authoritative post.',
					clickAction: 'open_pre_publish_review',
					authorityState: 'review_required_before_update',
					localChangesState: 'protected_local_changes_exportable',
					reviewCheckpointState: 'review_required',
					authoritativePostState: 'review_required_before_update',
					saveStateSummaryText:
						'Protected local changes need review before the authoritative post can update.',
					authoritativePostUpdated: false,
				} }
				distributedEditingSaveJourneyState={ {
					shouldExposeInSaveControls: true,
					step: 'review_changes',
					action: 'review_changes',
					title: 'Save opens review',
					summary:
						'Review highlighted changes before WordPress updates the post.',
					actionHint: 'Review before update',
					requiresActionBeforeSave: true,
					statusChromeSummary:
						'Protected local changes need review before the authoritative post can update.',
					statusChromeAuthorityState: 'review_required_before_update',
					statusChromeAuthorityText:
						'The authoritative WordPress post cannot be updated until risky changes are approved or removed.',
					claimsSavedWithoutEvidence: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Review changes',
		} );
		expect( button ).toHaveAttribute(
			'title',
			'Review before update. Review highlighted changes before WordPress updates the post. Protected local changes need review before the authoritative post can update.'
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
		const cueLabel = screen.getByText( 'Save opens review' );
		const cueActionHint = screen.getByText( 'Review before update' );
		const cue = screen.getByLabelText(
			'Review before update. Review highlighted changes before WordPress updates the post. Protected local changes need review before the authoritative post can update.'
		);
		expect( cueLabel ).toBeVisible();
		expect( cueActionHint ).toBeVisible();
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
			'Review before update. Review highlighted changes before WordPress updates the post. Protected local changes need review before the authoritative post can update.'
		);
		expect( cue ).toHaveAttribute(
			'aria-label',
			'Review before update. Review highlighted changes before WordPress updates the post. Protected local changes need review before the authoritative post can update.'
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
			'Protected local changes need review before the authoritative post can update.'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-authority-state',
			'review_required_before_update'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-authority-summary',
			'The authoritative WordPress post cannot be updated until risky changes are approved or removed.'
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

	it( 'should show the guarded update action hint without requiring pre-Save action', async () => {
		const user = userEvent.setup();
		const savePostStatus = jest.fn();
		render(
			<PostPublishButton
				isSaveable
				isPublishable
				savePostStatus={ savePostStatus }
				distributedEditingSaveButtonState={ {
					status: 'accepted_but_unconsumed',
					reason: 'fresh_review_accepted_but_unconsumed',
					source: 'fresh_review',
					label: 'Submit reviewed changes',
					statusText:
						'Accepted Distributed Editing proof is ready for guarded retry save.',
					clickAction: 'continue_guarded_retry_save',
					authorityState: 'ready_for_guarded_update',
					localChangesState: 'protected_local_changes_exportable',
					reviewCheckpointState: 'review_accepted',
					authoritativePostState: 'ready_for_guarded_update',
					saveStateSummaryText:
						'Reviewed local changes are ready for guarded update; the authoritative post is not updated yet.',
					authoritativePostUpdated: false,
				} }
				distributedEditingSaveJourneyState={ {
					shouldExposeInSaveControls: true,
					step: 'ready_to_save',
					action: 'save',
					title: 'Save is ready',
					summary:
						'Save will send reviewed changes to WordPress for a guarded update.',
					actionHint: 'Send guarded update',
					requiresActionBeforeSave: false,
					statusChromeSummary:
						'Reviewed local changes are ready for guarded update; the authoritative post is not updated yet.',
					statusChromeAuthorityState: 'ready_for_guarded_update',
					statusChromeAuthorityText:
						'Reviewed changes are ready for a guarded update of the authoritative WordPress post.',
					claimsSavedWithoutEvidence: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Submit reviewed changes',
		} );
		expect( button ).toHaveAttribute(
			'title',
			'Send guarded update. Save will send reviewed changes to WordPress for a guarded update. Reviewed local changes are ready for guarded update; the authoritative post is not updated yet.'
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
			'Send guarded update'
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
		const cueLabel = screen.getByText( 'Save is ready' );
		const cueActionHint = screen.getByText( 'Send guarded update' );
		const cue = screen.getByLabelText(
			'Send guarded update. Save will send reviewed changes to WordPress for a guarded update. Reviewed local changes are ready for guarded update; the authoritative post is not updated yet.'
		);
		expect( cueLabel ).toBeVisible();
		expect( cueActionHint ).toBeVisible();
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-visual-cue',
			'true'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-hint',
			'Send guarded update'
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
					saveStateSummaryText:
						'The authoritative post accepted the Distributed Editing update.',
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
			'The authoritative post accepted the Distributed Editing update.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-authoritative-post-updated',
			'true'
		);
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
					label: 'Validating review',
					statusText:
						'Fresh-review validation is in progress before guarded save.',
					disabled: true,
					busy: true,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Validating review',
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
					label: 'Saving reviewed changes',
					statusText:
						'Distributed Editing Save is waiting for WordPress confirmation.',
					disabled: true,
					busy: true,
					authorityState: 'awaiting_server_confirmation',
					localChangesState:
						'protected_local_changes_awaiting_server_confirmation',
					reviewCheckpointState: 'review_accepted',
					authoritativePostState: 'awaiting_server_confirmation',
					saveStateSummaryText:
						'Reviewed local changes are waiting for server confirmation before the authoritative post is updated.',
					authoritativePostUpdated: false,
				} }
				distributedEditingSaveJourneyState={ {
					shouldExposeInSaveControls: true,
					step: 'waiting_for_wordpress',
					action: 'keep_tab_open',
					title: 'Save is waiting for WordPress',
					summary:
						'Keep this tab open until WordPress confirms whether the post was updated.',
					actionHint: 'Keep tab open',
					requiresActionBeforeSave: false,
					statusChromeSummary:
						'Reviewed local changes are waiting for server confirmation before the authoritative post is updated.',
					statusChromeAuthorityState: 'awaiting_server_confirmation',
					statusChromeAuthorityText:
						'The authoritative WordPress post has not confirmed these protected changes yet.',
					claimsSavedWithoutEvidence: false,
				} }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'Saving reviewed changes',
		} );
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( button ).toHaveClass( 'is-busy' );
		expect( button ).toHaveAttribute(
			'title',
			'Keep tab open. Keep this tab open until WordPress confirms whether the post was updated. Reviewed local changes are waiting for server confirmation before the authoritative post is updated.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-step',
			'waiting_for_wordpress'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action',
			'keep_tab_open'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-hint',
			'Keep tab open'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'false'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-claims-saved-without-evidence',
			'false'
		);
		const cueLabel = screen.getByText( 'Save is waiting for WordPress' );
		const cueActionHint = screen.getByText( 'Keep tab open' );
		const cue = screen.getByLabelText(
			'Keep tab open. Keep this tab open until WordPress confirms whether the post was updated. Reviewed local changes are waiting for server confirmation before the authoritative post is updated.'
		);
		expect( cueLabel ).toBeVisible();
		expect( cueActionHint ).toBeVisible();
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-visual-cue',
			'true'
		);
		expect( cue ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-hint',
			'Keep tab open'
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
} );
