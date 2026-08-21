import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Note } from '../note';

jest.mock( '../note-card', () => ( {
	NoteCard: ( { actions, children } ) => (
		<div>
			{ actions }
			{ children }
		</div>
	),
} ) );

jest.mock( '../note-form', () => ( {
	NoteForm: ( { onCancel } ) => (
		<button type="button" onClick={ onCancel }>
			Cancel edit
		</button>
	),
} ) );

const note = {
	id: 42,
	parent: 0,
	status: 'hold',
	type: 'note',
	meta: {},
	content: {
		raw: 'A note',
		rendered: 'A note',
	},
	author_name: 'Author',
};

const defaultProps = {
	note,
	isSelected: true,
	onEditNote: jest.fn(),
	onDeleteNote: jest.fn(),
};

describe( 'Note actions menu', () => {
	it( 'opens with the keyboard, runs Edit, and returns focus after Cancel', async () => {
		const user = userEvent.setup();
		render( <Note { ...defaultProps } /> );

		const trigger = screen.getByRole( 'button', { name: 'Actions' } );
		await user.tab();
		expect( trigger ).toHaveFocus();

		await user.keyboard( '{ArrowDown}' );
		const editItem = await screen.findByRole( 'menuitem', {
			name: 'Edit',
		} );
		expect( editItem ).toHaveFocus();

		await user.keyboard( '{Enter}' );
		await waitFor( () =>
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument()
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Cancel edit' } )
		);
		expect( trigger ).toHaveFocus();
	} );

	it( 'contains Escape from the menu and returns focus to the trigger', async () => {
		const user = userEvent.setup();
		const onUnhandledEscape = jest.fn();
		render(
			<div
				role="treeitem"
				tabIndex={ 0 }
				onKeyDown={ ( event ) => {
					if ( event.key === 'Escape' && ! event.defaultPrevented ) {
						onUnhandledEscape();
					}
				} }
			>
				<Note { ...defaultProps } />
			</div>
		);

		const trigger = screen.getByRole( 'button', { name: 'Actions' } );
		await user.click( trigger );
		await screen.findByRole( 'menuitem', {
			name: 'Edit',
		} );

		await user.keyboard( '{Escape}' );

		await waitFor( () =>
			expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument()
		);
		expect( trigger ).toHaveFocus();
		expect( onUnhandledEscape ).not.toHaveBeenCalled();
	} );

	it( 'keeps the actions trigger exposed but disabled when the parent note is resolved', async () => {
		const user = userEvent.setup();
		render(
			<Note { ...defaultProps } parentNote={ { status: 'approved' } } />
		);

		const trigger = screen.getByRole( 'button', { name: 'Actions' } );
		expect( trigger ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.tab();
		expect( trigger ).toHaveFocus();
		await user.click( trigger );
		expect( screen.queryByRole( 'menu' ) ).not.toBeInTheDocument();
	} );
} );
