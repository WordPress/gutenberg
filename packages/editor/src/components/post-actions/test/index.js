import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import PostActions from '../';
import { usePostActions } from '../actions';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '../actions', () => ( { usePostActions: jest.fn() } ) );

const item = { id: 123, title: { raw: 'Test post' } };

function renderPostActions() {
	useSelect.mockReturnValue( {
		item,
		permissions: { canUpdate: true },
	} );

	return render( <PostActions postType="post" postId={ item.id } /> );
}

describe( 'PostActions', () => {
	beforeEach( () => {
		usePostActions.mockReset();
	} );

	it( 'keeps the unavailable actions trigger focusable and closed', async () => {
		const user = userEvent.setup();
		usePostActions.mockReturnValue( [] );
		renderPostActions();

		const trigger = screen.getByRole( 'button', { name: 'Actions' } );
		expect( trigger ).toHaveAttribute( 'aria-disabled', 'true' );

		trigger.focus();
		expect( trigger ).toHaveFocus();

		await user.keyboard( '{Enter}' );
		expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
	} );

	it( 'performs an action, closes the menu, and restores trigger focus', async () => {
		const user = userEvent.setup();
		const callback = jest.fn();
		usePostActions.mockReturnValue( [
			{ id: 'duplicate', label: 'Duplicate', callback },
		] );
		renderPostActions();

		const trigger = screen.getByRole( 'button', { name: 'Actions' } );
		await user.click( trigger );
		await user.click(
			await screen.findByRole( 'menuitem', { name: 'Duplicate' } )
		);

		expect( callback ).toHaveBeenCalledWith(
			[ { ...item, permissions: { canUpdate: true } } ],
			expect.objectContaining( { registry: expect.any( Object ) } )
		);
		await waitFor( () => {
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
		} );
		expect( trigger ).toHaveFocus();
	} );

	it( 'moves focus to a modal action and returns it after cancellation', async () => {
		const user = userEvent.setup();
		usePostActions.mockReturnValue( [
			{
				id: 'delete',
				label: 'Delete',
				RenderModal: ( { closeModal } ) => (
					<button onClick={ closeModal }>Cancel</button>
				),
			},
		] );
		renderPostActions();

		const trigger = screen.getByRole( 'button', { name: 'Actions' } );
		await user.click( trigger );
		await user.click(
			await screen.findByRole( 'menuitem', { name: 'Delete' } )
		);

		const cancelButton = await screen.findByRole( 'button', {
			name: 'Cancel',
		} );
		await waitFor( () => expect( cancelButton ).toHaveFocus() );

		await user.click( cancelButton );
		await waitFor( () => {
			expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		} );
		expect( trigger ).toHaveFocus();
	} );
} );
