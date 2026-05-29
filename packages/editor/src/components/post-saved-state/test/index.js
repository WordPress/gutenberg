/**
 * External dependencies
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostSavedState from '../';

const mockSavePost = jest.fn();
const mockMaybeHandleDistributedEditingSaveButtonClick = jest.fn();
const mockSyncDistributedEditingWithServer = jest.fn();

jest.mock( '@wordpress/data/src/components/use-dispatch', () => {
	return {
		useDispatch: () => ( {
			__experimentalMaybeHandleDistributedEditingSaveButtonClick:
				mockMaybeHandleDistributedEditingSaveButtonClick,
			__experimentalSyncDistributedEditingWithServer:
				mockSyncDistributedEditingWithServer,
			savePost: mockSavePost,
		} ),
		useDispatchWithMap: jest.fn(),
	};
} );

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

jest.mock( '@wordpress/compose/src/hooks/use-viewport-match', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

jest.mock( '@wordpress/icons/src/icon', () => () => (
	<div data-testid="test-icon" />
) );

describe( 'PostSavedState', () => {
	beforeEach( () => {
		mockSavePost.mockClear();
		mockMaybeHandleDistributedEditingSaveButtonClick.mockClear();
		mockSyncDistributedEditingWithServer.mockClear();
		mockMaybeHandleDistributedEditingSaveButtonClick.mockResolvedValue( {
			allowsNormalSaveFallback: true,
		} );
		mockSyncDistributedEditingWithServer.mockResolvedValue( {
			status: 'server_sync_current',
		} );
		useViewportMatch.mockImplementation( () => false );
	} );

	it( 'should display saving while save in progress, even if not saveable', () => {
		useSelect.mockImplementation( () => ( {
			isDirty: false,
			isNew: true,
			isSaveable: false,
			isSaving: true,
			postStatus: 'draft',
		} ) );

		render( <PostSavedState /> );

		expect(
			screen.getByRole( 'button', { name: /Saving/i } )
		).toBeVisible();
	} );

	it( 'returns a disabled button if the post is not saveable', () => {
		useSelect.mockImplementation( () => ( {
			isDirty: false,
			isNew: true,
			isSaveable: false,
			isSaving: false,
			postStatus: 'draft',
		} ) );

		render( <PostSavedState /> );

		expect( screen.getByRole( 'button' ) ).toMatchSnapshot();
	} );

	it( 'should return Saved text if not new and not dirty', () => {
		useSelect.mockImplementation( () => ( {
			isDirty: false,
			isNew: false,
			isSaveable: true,
			isSaving: false,
			postStatus: 'draft',
		} ) );

		render( <PostSavedState /> );

		const button = screen.getByRole( 'button' );

		expect( within( button ).getByTestId( 'test-icon' ) ).toBeVisible();
		expect( within( button ).getByText( 'Saved' ) ).toBeVisible();
	} );

	it( 'should let new edits override the transient Saved message', async () => {
		let editorState = {
			isDirty: true,
			isNew: false,
			isSaveable: true,
			isSaving: true,
			postStatus: 'draft',
		};

		useSelect.mockImplementation( () => editorState );
		useViewportMatch.mockImplementation( () => true );

		const { rerender } = render( <PostSavedState /> );

		expect(
			screen.getByRole( 'button', { name: 'Saving' } )
		).toBeVisible();

		editorState = {
			...editorState,
			isDirty: false,
			isSaving: false,
		};
		rerender( <PostSavedState /> );

		await waitFor( () =>
			expect(
				screen.getByRole( 'button', { name: 'Saved' } )
			).toBeVisible()
		);

		editorState = {
			...editorState,
			isDirty: true,
		};
		rerender( <PostSavedState /> );

		const button = screen.getByRole( 'button', { name: 'Save draft' } );
		expect( button ).toBeEnabled();
		expect( mockSavePost ).not.toHaveBeenCalled();
	} );

	it( 'should return Save button if edits to be saved', async () => {
		const user = userEvent.setup();

		useSelect.mockImplementation( () => ( {
			isDirty: true,
			isNew: false,
			isSaveable: true,
			isSaving: false,
			postStatus: 'draft',
		} ) );

		// Simulate the viewport being considered large.
		useViewportMatch.mockImplementation( () => true );

		render( <PostSavedState /> );

		const button = screen.getByRole( 'button' );

		expect( button ).toMatchSnapshot();

		await user.click( button );

		expect(
			mockMaybeHandleDistributedEditingSaveButtonClick
		).toHaveBeenCalled();
		expect( mockSavePost ).toHaveBeenCalled();

		// Regression: Verify the event object is not passed to prop callback.
		expect( mockSavePost.mock.calls[ 0 ] ).toEqual( [] );
	} );

	it( 'should show an active Distributed Editing save descriptor', () => {
		useSelect.mockImplementation( () => ( {
			isDirty: true,
			isNew: false,
			isSaveable: false,
			isSaving: false,
			postStatus: 'draft',
			distributedEditingSaveButtonState: {
				status: 'accepted_but_unconsumed',
				source: 'fresh_review',
				reason: 'fresh_review_accepted_but_unconsumed',
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
			},
		} ) );

		render( <PostSavedState /> );

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
			'Reviewed local changes are ready for Save; the post in WordPress is not updated yet.'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-authoritative-post-updated',
			'false'
		);
	} );

	it( 'should expose Distributed Editing Save journey data on the real draft Save control without changing the click path', async () => {
		const user = userEvent.setup();
		useSelect.mockImplementation( () => ( {
			isDirty: true,
			isNew: false,
			isSaveable: true,
			isSaving: false,
			postStatus: 'draft',
			distributedEditingSaveJourneyState: {
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
			},
		} ) );

		render( <PostSavedState /> );

		const button = screen.getByRole( 'button', { name: 'Save draft' } );
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
			'data-distributed-editing-save-control-journey-authority-state',
			'ready_to_update_authoritative_post'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-authority-summary',
			'Save checks the latest post before WordPress updates it.'
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

		await user.click( button );

		expect(
			mockMaybeHandleDistributedEditingSaveButtonClick
		).toHaveBeenCalled();
		expect( mockSavePost ).toHaveBeenCalled();
	} );

	it( 'should let Distributed Editing block normal draft save fallback', async () => {
		const user = userEvent.setup();
		mockMaybeHandleDistributedEditingSaveButtonClick.mockResolvedValue( {
			allowsNormalSaveFallback: false,
			blocksNormalSavePost: true,
		} );
		useSelect.mockImplementation( () => ( {
			isDirty: true,
			isNew: false,
			isSaveable: true,
			isSaving: false,
			postStatus: 'draft',
			distributedEditingSaveButtonState: {
				status: 'review_blocked',
				label: 'Review changes',
				statusText: 'Review changes before WordPress updates the post.',
				clickAction: 'open_pre_publish_review',
				authorityState: 'review_required_before_update',
				authoritativePostUpdated: false,
			},
		} ) );

		render( <PostSavedState /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Review changes' } )
		);

		expect(
			mockMaybeHandleDistributedEditingSaveButtonClick
		).toHaveBeenCalled();
		expect( mockSavePost ).not.toHaveBeenCalled();
	} );

	it( 'should show mid-flow Distributed Editing recovery as the draft Save button action', async () => {
		const user = userEvent.setup();
		mockMaybeHandleDistributedEditingSaveButtonClick.mockResolvedValue( {
			status: 'local_changes_applied_before_save',
			allowsNormalSaveFallback: false,
			blocksNormalSavePost: true,
		} );
		useSelect.mockImplementation( () => ( {
			isDirty: true,
			isNew: false,
			isSaveable: true,
			isSaving: false,
			postStatus: 'draft',
			distributedEditingSaveButtonState: {
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
			},
			distributedEditingSaveJourneyState: {
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
			},
		} ) );

		render( <PostSavedState /> );

		const button = screen.getByRole( 'button', {
			name: 'Apply local changes',
		} );
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-status',
			'workflow_action_required'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-click-action',
			'apply_local_changes'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action',
			'apply_local_changes'
		);
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-control-journey-action-required',
			'true'
		);
		expect( button ).toHaveAttribute( 'aria-disabled', 'false' );

		await user.click( button );

		expect(
			mockMaybeHandleDistributedEditingSaveButtonClick
		).toHaveBeenCalled();
		expect( mockSavePost ).not.toHaveBeenCalled();
	} );

	it( 'should expose disabled and busy Distributed Editing save state without clicking through', async () => {
		const user = userEvent.setup();
		useSelect.mockImplementation( () => ( {
			isDirty: true,
			isNew: false,
			isSaveable: true,
			isSaving: false,
			postStatus: 'draft',
			distributedEditingSaveButtonState: {
				status: 'retry_save_in_progress',
				label: 'Saving',
				statusText: 'WordPress is saving your changes.',
				disabled: true,
				busy: true,
				authorityState: 'awaiting_server_confirmation',
				authoritativePostUpdated: false,
			},
		} ) );

		render( <PostSavedState /> );

		const button = screen.getByRole( 'button', {
			name: 'Saving',
		} );
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( button ).toHaveClass( 'is-saving' );
		expect( button ).toHaveClass( 'is-busy' );
		expect( button ).toHaveAttribute(
			'data-distributed-editing-save-button-authority-state',
			'awaiting_server_confirmation'
		);

		await user.click( button );

		expect( mockSavePost ).not.toHaveBeenCalled();
	} );

	it( 'should ignore the default Distributed Editing save descriptor', () => {
		useSelect.mockImplementation( () => ( {
			isDirty: true,
			isNew: false,
			isSaveable: true,
			isSaving: false,
			postStatus: 'draft',
			distributedEditingSaveButtonState: {
				status: 'update_ready',
				label: 'Update',
				statusText: 'Ready to update',
				clickAction: 'continue_save',
			},
		} ) );

		render( <PostSavedState /> );

		const button = screen.getByRole( 'button', { name: 'Save draft' } );
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-button-status'
		);
		expect( button ).not.toHaveAttribute(
			'data-distributed-editing-save-button-authority-state'
		);
	} );

	it( 'should show a Distributed Editing Sync button next to the draft Save control', async () => {
		const user = userEvent.setup();
		useSelect.mockImplementation( () => ( {
			isDirty: true,
			isNew: false,
			isSaveable: true,
			isSaving: false,
			isDistributedEditingEnabled: true,
			postId: 44,
			postStatus: 'draft',
		} ) );
		useViewportMatch.mockImplementation( () => true );

		render( <PostSavedState /> );

		const saveButton = screen.getByRole( 'button', {
			name: 'Save draft',
		} );
		const syncButton = screen.getByRole( 'button', {
			name: 'Sync with WordPress',
		} );

		expect( saveButton ).toBeVisible();
		expect( syncButton ).toHaveAttribute(
			'data-distributed-editing-server-sync-status',
			'ready'
		);

		await user.click( syncButton );

		expect( mockSyncDistributedEditingWithServer ).toHaveBeenCalledTimes(
			1
		);
		expect( mockSavePost ).not.toHaveBeenCalled();
	} );
} );
