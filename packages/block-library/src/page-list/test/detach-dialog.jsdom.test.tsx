import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DetachPageListDialog from '../detach-dialog';

describe( 'DetachPageListDialog', () => {
	it( 'explains Detach by default', () => {
		render(
			<DetachPageListDialog onConfirm={ vi.fn() } onCancel={ vi.fn() } />
		);
		expect(
			screen.getByText( /New pages will still be added automatically/ )
		).toBeInTheDocument();
	} );

	it( 'shows the message for what triggered it, and confirms or cancels', () => {
		const onConfirm = vi.fn();
		const onCancel = vi.fn();
		render(
			<DetachPageListDialog
				message="To move this page, this menu's pages will become links."
				onConfirm={ onConfirm }
				onCancel={ onCancel }
			/>
		);
		expect(
			screen.getByText( /this menu's pages will become links/ )
		).toBeInTheDocument();

		fireEvent.click( screen.getByRole( 'button', { name: 'Detach' } ) );
		expect( onConfirm ).toHaveBeenCalled();
		// The header's close button is labelled Cancel too; the footer's is last.
		const cancelButtons = screen.getAllByRole( 'button', {
			name: 'Cancel',
		} );
		fireEvent.click( cancelButtons[ cancelButtons.length - 1 ] );
		expect( onCancel ).toHaveBeenCalled();
	} );
} );

describe( 'DetachPageListDialog title and button', () => {
	it( 'can be titled for switching to an advanced menu', () => {
		render(
			<DetachPageListDialog
				title="Switch to advanced menu"
				confirmButtonText="Switch"
				onConfirm={ vi.fn() }
				onCancel={ vi.fn() }
			/>
		);
		expect(
			screen.getByRole( 'heading', { name: 'Switch to advanced menu' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Switch' } )
		).toBeInTheDocument();
	} );
} );
