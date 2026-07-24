/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { Note } from '../note';

function seedNotePermissions( noteId, { canEdit, canDelete } ) {
	dispatch( coreStore ).receiveUserPermissions( {
		[ `update/root/comment/${ noteId }` ]: canEdit,
		[ `delete/root/comment/${ noteId }` ]: canDelete,
	} );
}

function makeNote( overrides = {} ) {
	return {
		id: 1,
		parent: 0,
		status: 'hold',
		author: 1,
		author_name: 'Admin',
		content: {
			raw: 'Please change this to something else.',
			rendered: '<p>Please change this to something else.</p>',
		},
		...overrides,
	};
}

async function openActionsMenu() {
	const user = userEvent.setup();
	const trigger = screen.getByRole( 'button', { name: 'Actions' } );
	expect( trigger ).not.toHaveAttribute( 'aria-disabled', 'true' );
	await user.click( trigger );
}

describe( 'Note', () => {
	it( 'disables the actions menu when the user can neither edit nor delete the note', () => {
		const note = makeNote( { id: 101 } );
		seedNotePermissions( note.id, { canEdit: false, canDelete: false } );

		render( <Note note={ note } isSelected /> );

		expect(
			screen.getByRole( 'button', { name: 'Actions' } )
		).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'shows only Edit when the user can edit but not delete', async () => {
		const note = makeNote( { id: 102 } );
		seedNotePermissions( note.id, { canEdit: true, canDelete: false } );

		render( <Note note={ note } isSelected /> );

		await openActionsMenu();

		expect( screen.getByText( 'Edit' ) ).toBeVisible();
		expect( screen.queryByText( 'Delete' ) ).not.toBeInTheDocument();
	} );

	it( 'shows only Delete when the user can delete but not edit', async () => {
		const note = makeNote( { id: 103 } );
		seedNotePermissions( note.id, { canEdit: false, canDelete: true } );

		render( <Note note={ note } isSelected /> );

		await openActionsMenu();

		expect( screen.queryByText( 'Edit' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Delete' ) ).toBeVisible();
	} );

	it( 'shows both Edit and Delete when the user can do both', async () => {
		const note = makeNote( { id: 104 } );
		seedNotePermissions( note.id, { canEdit: true, canDelete: true } );

		render( <Note note={ note } isSelected /> );

		await openActionsMenu();

		expect( screen.getByText( 'Edit' ) ).toBeVisible();
		expect( screen.getByText( 'Delete' ) ).toBeVisible();
	} );

	it( 'shows Reopen instead of Edit for an approved note when the user can edit', async () => {
		const note = makeNote( { id: 105, status: 'approved' } );
		seedNotePermissions( note.id, { canEdit: true, canDelete: true } );

		render( <Note note={ note } isSelected /> );

		await openActionsMenu();

		expect( screen.getByText( 'Reopen' ) ).toBeVisible();
		expect( screen.queryByText( 'Edit' ) ).not.toBeInTheDocument();
	} );
} );
