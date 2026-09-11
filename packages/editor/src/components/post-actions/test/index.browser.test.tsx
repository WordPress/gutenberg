import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { useSelect } from '@wordpress/data';
import PostActions from '../';
import { usePostActions } from '../actions';

vi.mock( import( '@wordpress/data' ), { spy: true } );
vi.mock( import( '../actions' ), () => ( { usePostActions: vi.fn() } ) );

const mockedUseSelect = vi.mocked( useSelect );
const mockedUsePostActions = vi.mocked( usePostActions );

const item = { id: 123, title: { raw: 'Test post' } };

async function renderPostActions() {
	mockedUseSelect.mockReturnValue( {
		item,
		permissions: { canUpdate: true },
	} );

	await render(
		<PostActions
			postType="post"
			postId={ item.id }
			onActionPerformed={ undefined }
		/>
	);
}

describe( 'PostActions', () => {
	beforeEach( () => {
		mockedUsePostActions.mockReset();
	} );

	it( 'keeps the unavailable actions trigger focusable and closed', async () => {
		const user = userEvent.setup();
		mockedUsePostActions.mockReturnValue( [] );
		await renderPostActions();

		const trigger = screen.getByRole( 'button', { name: 'Actions' } );
		expect( trigger ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.tab();
		expect( trigger ).toHaveFocus();

		await user.keyboard( '{Enter}' );
		expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
	} );

	it( 'performs an action, closes the menu, and restores trigger focus', async () => {
		const user = userEvent.setup();
		const callback = vi.fn();
		mockedUsePostActions.mockReturnValue( [
			{ id: 'duplicate', label: 'Duplicate', callback },
		] );
		await renderPostActions();

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
		mockedUsePostActions.mockReturnValue( [
			{
				id: 'delete',
				label: 'Delete',
				RenderModal: ( { closeModal }: { closeModal: () => void } ) => (
					<button onClick={ closeModal }>Cancel</button>
				),
			},
		] );
		await renderPostActions();

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
