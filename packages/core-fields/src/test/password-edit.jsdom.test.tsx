import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from '@wordpress/element';
import { describe, expect, it, vi } from 'vitest';
import PasswordEdit from '../post_type_supports/password/edit';
import type { PostWithPassword } from '../post_type_supports/password/types';
import PostPasswordModal from '../post_type_supports/password/post-password-modal';

const field = {
	id: 'password',
	getValue: ( { item }: { item: PostWithPassword } ) => item.password,
};

function EditedPassword( { initial }: { initial: PostWithPassword } ) {
	const [ data, setData ] = useState( initial );
	return (
		<>
			<PasswordEdit
				field={ field }
				data={ data }
				onChange={ ( edits ) =>
					setData( ( current ) => ( { ...current, ...edits } ) )
				}
			/>
			<output data-testid="stored">{ data.password }</output>
		</>
	);
}

describe( 'PasswordEdit', () => {
	it( 'renders "Set password" when post has no password', () => {
		render( <EditedPassword initial={ {} } /> );
		expect(
			screen.getByRole( 'button', { name: 'Set password' } )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Only visible to those who know the password.' )
		).toBeInTheDocument();
	} );

	it( 'renders "Edit password" when post already has a password', () => {
		render( <EditedPassword initial={ { password: 'secret' } } /> );
		expect(
			screen.getByRole( 'button', { name: 'Edit password' } )
		).toBeInTheDocument();
	} );

	it( 'opens the modal and sets a new password on save', () => {
		render( <EditedPassword initial={ {} } /> );
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Set password' } )
		);

		expect(
			screen.getByRole( 'dialog', { name: 'Set password' } )
		).toBeInTheDocument();

		const input = screen.getByRole( 'textbox', { name: 'Password' } );
		fireEvent.change( input, { target: { value: 'new-secret' } } );
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Save password' } )
		);

		expect(
			screen.queryByRole( 'dialog', { name: 'Set password' } )
		).not.toBeInTheDocument();
		expect( screen.getByTestId( 'stored' ) ).toHaveTextContent(
			'new-secret'
		);
		expect(
			screen.getByRole( 'button', { name: 'Edit password' } )
		).toBeInTheDocument();
	} );

	it( 'removes the password when "Remove password" is clicked', () => {
		render(
			<EditedPassword initial={ { password: 'existing-secret' } } />
		);
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Edit password' } )
		);

		expect(
			screen.getByRole( 'dialog', { name: 'Edit password' } )
		).toBeInTheDocument();

		fireEvent.click(
			screen.getByRole( 'button', { name: 'Remove password' } )
		);

		expect(
			screen.queryByRole( 'dialog', { name: 'Edit password' } )
		).not.toBeInTheDocument();
		expect( screen.getByTestId( 'stored' ) ).toHaveTextContent( '' );
		expect(
			screen.getByRole( 'button', { name: 'Set password' } )
		).toBeInTheDocument();
	} );

	it( 'restores focus to the trigger button when the modal closes', () => {
		render( <EditedPassword initial={ {} } /> );
		const button = screen.getByRole( 'button', { name: 'Set password' } );
		button.focus();
		fireEvent.click( button );

		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();

		fireEvent.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		expect( button ).toHaveFocus();
	} );
} );

describe( 'PostPasswordModal', () => {
	it( 'pre-fills the input with initialPassword and shows "Edit password" title', () => {
		render(
			<PostPasswordModal
				initialPassword="existing-secret"
				onSave={ vi.fn() }
				onRemove={ vi.fn() }
				onClose={ vi.fn() }
			/>
		);

		expect(
			screen.getByRole( 'dialog', { name: 'Edit password' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'textbox', { name: 'Password' } )
		).toHaveValue( 'existing-secret' );
	} );

	it( 'submits a valid password and calls onSave with the exact value', () => {
		const onSave = vi.fn();
		render(
			<PostPasswordModal
				initialPassword=""
				onSave={ onSave }
				onRemove={ vi.fn() }
				onClose={ vi.fn() }
			/>
		);

		const input = screen.getByRole( 'textbox', { name: 'Password' } );
		fireEvent.change( input, { target: { value: 'my-secret-password' } } );
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Save password' } )
		);

		expect( onSave ).toHaveBeenCalledTimes( 1 );
		expect( onSave ).toHaveBeenCalledWith( 'my-secret-password' );
	} );

	it( 'accepts a 255-character password and calls onSave', () => {
		const onSave = vi.fn();
		const valid255Password = 'a'.repeat( 255 );

		render(
			<PostPasswordModal
				initialPassword=""
				onSave={ onSave }
				onRemove={ vi.fn() }
				onClose={ vi.fn() }
			/>
		);

		const input = screen.getByRole( 'textbox', { name: 'Password' } );
		fireEvent.change( input, { target: { value: valid255Password } } );
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Save password' } )
		);

		expect( onSave ).toHaveBeenCalledTimes( 1 );
		expect( onSave ).toHaveBeenCalledWith( valid255Password );
	} );

	it( 'shows "Password can\'t exceed 255 characters." and does not call onSave when password is 256 characters', async () => {
		const onSave = vi.fn();
		const invalid256Password = 'a'.repeat( 256 );

		render(
			<PostPasswordModal
				initialPassword=""
				onSave={ onSave }
				onRemove={ vi.fn() }
				onClose={ vi.fn() }
			/>
		);

		const input = screen.getByRole( 'textbox', { name: 'Password' } );
		fireEvent.change( input, { target: { value: invalid256Password } } );
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Save password' } )
		);

		expect(
			await screen.findByText( "Password can't exceed 255 characters." )
		).toBeVisible();
		expect( onSave ).not.toHaveBeenCalled();
	} );

	it( 'shows "Enter a password." and does not call onSave when password is empty or whitespace', async () => {
		const onSave = vi.fn();

		render(
			<PostPasswordModal
				initialPassword=""
				onSave={ onSave }
				onRemove={ vi.fn() }
				onClose={ vi.fn() }
			/>
		);

		const input = screen.getByRole( 'textbox', { name: 'Password' } );
		fireEvent.change( input, { target: { value: '   ' } } );
		fireEvent.click(
			screen.getByRole( 'button', { name: 'Save password' } )
		);

		expect( await screen.findByText( 'Enter a password.' ) ).toBeVisible();
		expect( onSave ).not.toHaveBeenCalled();
	} );

	it( 'calls onClose and does not call onSave when Cancel is clicked', () => {
		const onSave = vi.fn();
		const onClose = vi.fn();

		render(
			<PostPasswordModal
				initialPassword="existing-secret"
				onSave={ onSave }
				onRemove={ vi.fn() }
				onClose={ onClose }
			/>
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
		expect( onSave ).not.toHaveBeenCalled();
	} );

	it( 'does not render "Remove password" when initialPassword is empty', () => {
		render(
			<PostPasswordModal
				initialPassword=""
				onSave={ vi.fn() }
				onRemove={ vi.fn() }
				onClose={ vi.fn() }
			/>
		);

		expect(
			screen.queryByRole( 'button', { name: 'Remove password' } )
		).not.toBeInTheDocument();
	} );

	it( 'renders "Remove password" when initialPassword is non empty and calls onRemove when clicked', () => {
		const onRemove = vi.fn();

		render(
			<PostPasswordModal
				initialPassword="existing-secret"
				onSave={ vi.fn() }
				onRemove={ onRemove }
				onClose={ vi.fn() }
			/>
		);

		const removeButton = screen.getByRole( 'button', {
			name: 'Remove password',
		} );
		expect( removeButton ).toBeInTheDocument();
		fireEvent.click( removeButton );

		expect( onRemove ).toHaveBeenCalledTimes( 1 );
	} );
} );
