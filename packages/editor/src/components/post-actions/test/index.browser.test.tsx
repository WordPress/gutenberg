import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { useSelect } from '@wordpress/data';
import { lock } from '../../../lock-unlock';
import PostActions from '../';
import { usePostActions } from '../actions';

vi.mock( import( '@wordpress/data' ), { spy: true } );
vi.mock( import( '../actions' ), () => ( { usePostActions: vi.fn() } ) );

const mockedUseSelect = vi.mocked( useSelect );
const mockedUsePostActions = vi.mocked( usePostActions );

const item = { id: 123, title: { raw: 'Test post' } };

// The core store selectors `PostActions` reads the post with, which it gets
// from the private selectors.
const coreSelectors = {};
lock( coreSelectors, {
	getEditedEntityRecord: () => item,
	getEntityRecordPermissions: () => ( { canUpdate: true } ),
} );

async function renderPostActions() {
	mockedUseSelect.mockImplementation( ( mapSelect: any ) =>
		mapSelect( () => coreSelectors )
	);

	await render(
		<PostActions
			postType="post"
			postId={ item.id }
			onActionPerformed={ undefined }
		/>
	);
}

describe( 'PostActions', () => {
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

	it( 'moves focus to a modal action and returns it after cancellation', async () => {
		const user = userEvent.setup();
		mockedUsePostActions.mockReturnValue( [
			{
				id: 'delete',
				label: 'Delete',
				RenderModal: ( {
					closeModal,
				}: {
					closeModal?: () => void;
				} ) => <button onClick={ closeModal }>Cancel</button>,
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
