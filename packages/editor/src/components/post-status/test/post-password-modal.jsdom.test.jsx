import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostPasswordModal from '../post-password-modal';

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

	it( 'submits a valid password and calls onSave with the exact value', async () => {
		const user = userEvent.setup();
		const onSave = vi.fn();
		render(
			<PostPasswordModal
				initialPassword=""
				onSave={ onSave }
				onRemove={ vi.fn() }
				onClose={ vi.fn() }
			/>
		);

		expect(
			screen.getByRole( 'dialog', { name: 'Set password' } )
		).toBeInTheDocument();

		const input = screen.getByRole( 'textbox', { name: 'Password' } );
		await user.type( input, 'my-secret-password' );
		await user.click(
			screen.getByRole( 'button', { name: 'Save password' } )
		);

		expect( onSave ).toHaveBeenCalledTimes( 1 );
		expect( onSave ).toHaveBeenCalledWith( 'my-secret-password' );
	} );

	it( 'accepts a 255-character password and calls onSave', async () => {
		const user = userEvent.setup();
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
		await user.type( input, valid255Password );
		await user.click(
			screen.getByRole( 'button', { name: 'Save password' } )
		);

		expect( onSave ).toHaveBeenCalledTimes( 1 );
		expect( onSave ).toHaveBeenCalledWith( valid255Password );
	} );

	it( 'shows "Password can\'t exceed 255 characters." and does not call onSave when password is 256 characters', async () => {
		const user = userEvent.setup();
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
		await user.type( input, invalid256Password );
		await user.click(
			screen.getByRole( 'button', { name: 'Save password' } )
		);

		expect(
			await screen.findByText( "Password can't exceed 255 characters." )
		).toBeVisible();
		expect( onSave ).not.toHaveBeenCalled();
	} );

	it( 'shows "Enter a password." and does not call onSave when password is empty or whitespace-only', async () => {
		const user = userEvent.setup();
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
		await user.type( input, '   ' );
		await user.click(
			screen.getByRole( 'button', { name: 'Save password' } )
		);

		expect( await screen.findByText( 'Enter a password.' ) ).toBeVisible();
		expect( onSave ).not.toHaveBeenCalled();
	} );

	it( 'calls onClose and does not call onSave when Cancel is clicked', async () => {
		const user = userEvent.setup();
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

		await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );

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

	it( 'renders "Remove password" when initialPassword is non-empty and calls onRemove when clicked', async () => {
		const user = userEvent.setup();
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
		await user.click( removeButton );

		expect( onRemove ).toHaveBeenCalledTimes( 1 );
	} );
} );
