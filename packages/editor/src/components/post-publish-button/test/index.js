import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { dispatch, select } from '@wordpress/data';
import PostPublishButton from '../';
import { store as editorStore } from '../../../store';
import {
	EDITOR_INTENT_EDIT,
	EDITOR_INTENT_SUGGEST,
} from '../../../store/constants';
import { unlock } from '../../../lock-unlock';

function setEditorIntent( intent ) {
	unlock( dispatch( editorStore ) ).setEditorIntent( intent );
}

describe( 'PostPublishButton', () => {
	beforeEach( () => {
		// The intent is registry state, not a mock, so restoring the spies
		// doesn't reset what a previous test left behind. Reset it before
		// rendering, while nothing is mounted to react to the change.
		setEditorIntent( EDITOR_INTENT_EDIT );
		jest.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			_links: {},
		} );
		jest.spyOn( dispatch( editorStore ), 'editPost' ).mockReturnValue();
		jest.spyOn( dispatch( editorStore ), 'savePost' ).mockReturnValue();
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	function mockSelector( name, value ) {
		jest.spyOn( select( editorStore ), name ).mockReturnValue( value );
	}

	function mockHasPublishAction( hasPublishAction ) {
		jest.spyOn( select( editorStore ), 'getCurrentPost' ).mockReturnValue( {
			_links: hasPublishAction ? { 'wp:action-publish': true } : {},
		} );
	}

	describe( 'aria-disabled', () => {
		it( 'should be true if post is currently saving', () => {
			mockSelector( 'isEditedPostPublishable', true );
			mockSelector( 'isEditedPostSaveable', true );
			mockSelector( 'isSavingPost', true );

			render( <PostPublishButton /> );

			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			);
		} );

		it( 'should be true if post is not publishable and not forceIsDirty', () => {
			mockSelector( 'isEditedPostSaveable', true );
			mockSelector( 'isEditedPostPublishable', false );

			render( <PostPublishButton forceIsDirty={ false } /> );

			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			);
		} );

		it( 'should be true if post is not saveable', () => {
			mockSelector( 'isEditedPostPublishable', true );
			mockSelector( 'isEditedPostSaveable', false );

			render( <PostPublishButton /> );

			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			);
		} );

		it( 'should be true if post saving is locked', () => {
			mockSelector( 'isEditedPostPublishable', true );
			mockSelector( 'isEditedPostSaveable', true );
			mockSelector( 'isPostSavingLocked', true );

			render( <PostPublishButton /> );

			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			);
		} );

		it( 'should be true if a non-post entity is being saved', () => {
			mockSelector( 'isEditedPostPublishable', true );
			mockSelector( 'isEditedPostSaveable', true );
			mockSelector( 'isSavingNonPostEntityChanges', true );

			render( <PostPublishButton /> );

			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			);
		} );

		it( 'should be false if post is saveable but not publishable and forceIsDirty is true', () => {
			mockSelector( 'isEditedPostSaveable', true );
			mockSelector( 'isEditedPostPublishable', false );

			render( <PostPublishButton forceIsDirty /> );

			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-disabled',
				'false'
			);
		} );

		it( 'should be false if post is publishave and saveable', () => {
			mockSelector( 'isEditedPostPublishable', true );
			mockSelector( 'isEditedPostSaveable', true );

			render( <PostPublishButton /> );

			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-disabled',
				'false'
			);
		} );

		it( 'should be true while suggesting', () => {
			mockHasPublishAction( true );
			mockSelector( 'isEditedPostPublishable', true );
			mockSelector( 'isEditedPostSaveable', true );
			setEditorIntent( EDITOR_INTENT_SUGGEST );

			render( <PostPublishButton /> );

			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			);
		} );

		it( 'should be true for the toggle while suggesting', () => {
			mockHasPublishAction( true );
			mockSelector( 'isEditedPostPublishable', true );
			mockSelector( 'isEditedPostSaveable', true );
			setEditorIntent( EDITOR_INTENT_SUGGEST );

			render( <PostPublishButton isToggle /> );

			expect( screen.getByRole( 'button' ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			);
		} );
	} );

	describe( 'suggesting', () => {
		it( 'should not save the post when clicked', async () => {
			const user = userEvent.setup();
			mockHasPublishAction( true );
			mockSelector( 'isEditedPostPublishable', true );
			mockSelector( 'isEditedPostSaveable', true );
			setEditorIntent( EDITOR_INTENT_SUGGEST );

			render( <PostPublishButton /> );

			await user.click( screen.getByRole( 'button' ) );

			// `editPost` would drop the status but `savePost` would still
			// write the post to the server as a draft.
			expect( dispatch( editorStore ).editPost ).not.toHaveBeenCalled();
			expect( dispatch( editorStore ).savePost ).not.toHaveBeenCalled();
		} );

		it( 'should keep its visible label as its accessible name', () => {
			mockHasPublishAction( true );
			mockSelector( 'isEditedPostPublishable', true );
			mockSelector( 'isEditedPostSaveable', true );
			setEditorIntent( EDITOR_INTENT_SUGGEST );

			render( <PostPublishButton /> );

			expect(
				screen.getByRole( 'button', { name: 'Publish' } )
			).toBeVisible();
		} );

		it( 'should say why it is disabled', () => {
			mockHasPublishAction( true );
			mockSelector( 'isEditedPostPublishable', true );
			mockSelector( 'isEditedPostSaveable', true );
			setEditorIntent( EDITOR_INTENT_SUGGEST );

			render( <PostPublishButton /> );

			// Tooltip popups are visual-only, so the reason has to reach
			// assistive technology through the button's description.
			expect(
				screen.getByRole( 'button', { name: 'Publish' } )
			).toHaveAccessibleDescription(
				'Switch to Editing to publish or update this post.'
			);
		} );
	} );

	describe( 'publish status', () => {
		it( 'should be pending for contributor', async () => {
			const user = userEvent.setup();
			mockHasPublishAction( false );
			mockSelector( 'isEditedPostSaveable', true );
			mockSelector( 'isEditedPostPublishable', true );

			render( <PostPublishButton /> );

			await user.click( screen.getByRole( 'button' ) );

			expect( dispatch( editorStore ).editPost ).toHaveBeenCalledWith(
				{ status: 'pending' },
				{ undoIgnore: true }
			);
		} );

		it( 'should be future for scheduled post', async () => {
			const user = userEvent.setup();
			mockHasPublishAction( true );
			mockSelector( 'isEditedPostBeingScheduled', true );
			mockSelector( 'isEditedPostSaveable', true );
			mockSelector( 'isEditedPostPublishable', true );

			render( <PostPublishButton /> );

			await user.click( screen.getByRole( 'button' ) );

			expect( dispatch( editorStore ).editPost ).toHaveBeenCalledWith(
				{ status: 'future' },
				{ undoIgnore: true }
			);
		} );

		it( 'should be private for private visibility', async () => {
			const user = userEvent.setup();
			mockHasPublishAction( true );
			mockSelector( 'getEditedPostVisibility', 'private' );
			mockSelector( 'isEditedPostSaveable', true );
			mockSelector( 'isEditedPostPublishable', true );

			render( <PostPublishButton /> );

			await user.click( screen.getByRole( 'button' ) );

			expect( dispatch( editorStore ).editPost ).toHaveBeenCalledWith(
				{ status: 'private' },
				{ undoIgnore: true }
			);
		} );

		it( 'should be publish otherwise', async () => {
			const user = userEvent.setup();
			mockHasPublishAction( true );
			mockSelector( 'isEditedPostSaveable', true );
			mockSelector( 'isEditedPostPublishable', true );

			render( <PostPublishButton /> );

			await user.click( screen.getByRole( 'button' ) );

			expect( dispatch( editorStore ).editPost ).toHaveBeenCalledWith(
				{ status: 'publish' },
				{ undoIgnore: true }
			);
		} );
	} );

	describe( 'click', () => {
		it( 'should save with status', async () => {
			const user = userEvent.setup();
			mockHasPublishAction( true );
			mockSelector( 'isEditedPostSaveable', true );
			mockSelector( 'isEditedPostPublishable', true );

			render( <PostPublishButton /> );

			await user.click( screen.getByRole( 'button' ) );

			expect( dispatch( editorStore ).editPost ).toHaveBeenCalledWith(
				{ status: 'publish' },
				{ undoIgnore: true }
			);
			expect( dispatch( editorStore ).savePost ).toHaveBeenCalled();
		} );
	} );

	it( 'should have save modifier class', () => {
		mockSelector( 'isSavingPost', true );
		mockSelector( 'isCurrentPostPublished', true );

		render( <PostPublishButton /> );

		expect( screen.getByRole( 'button' ) ).toHaveClass( 'is-busy' );
	} );
} );
