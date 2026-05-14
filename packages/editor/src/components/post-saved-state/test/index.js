/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
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

jest.mock( '@wordpress/data/src/components/use-dispatch', () => {
	return {
		useDispatch: () => ( {
			__experimentalMaybeHandleDistributedEditingSaveButtonClick:
				mockMaybeHandleDistributedEditingSaveButtonClick,
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
		mockMaybeHandleDistributedEditingSaveButtonClick.mockResolvedValue( {
			allowsNormalSaveFallback: true,
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
			isSaveable: true,
			isSaving: false,
			postStatus: 'draft',
			distributedEditingSaveButtonState: {
				status: 'accepted_but_unconsumed',
				source: 'fresh_review',
				reason: 'fresh_review_accepted_but_unconsumed',
				label: 'Submit reviewed changes',
				statusText:
					'Accepted Distributed Editing proof is ready for guarded retry save.',
				clickAction: 'continue_guarded_retry_save',
				authorityState: 'ready_for_guarded_update',
				authoritativePostUpdated: false,
			},
		} ) );

		render( <PostSavedState /> );

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
			'data-distributed-editing-save-button-authoritative-post-updated',
			'false'
		);
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
				statusText:
					'Review must be resolved before Distributed Editing can save.',
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
				label: 'Saving reviewed changes',
				statusText:
					'Distributed Editing retry save is waiting for server confirmation.',
				disabled: true,
				busy: true,
				authorityState: 'awaiting_server_confirmation',
				authoritativePostUpdated: false,
			},
		} ) );

		render( <PostSavedState /> );

		const button = screen.getByRole( 'button', {
			name: 'Saving reviewed changes',
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
} );
