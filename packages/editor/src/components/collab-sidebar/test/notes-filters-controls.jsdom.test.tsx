import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_NOTES_FILTERS, NotesFilters } from '../notes-filters';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

describe( 'NotesFilters', () => {
	it( 'shows the filters in a menu when the toggle is pressed', async () => {
		const user = userEvent.setup();
		render(
			<NotesFilters
				filters={ DEFAULT_NOTES_FILTERS }
				onChange={ vi.fn() }
			/>
		);
		expect(
			screen.queryByRole( 'group', { name: 'Status' } )
		).not.toBeInTheDocument();

		const toggle = screen.getByRole( 'button', { name: 'Filter' } );
		await user.click( toggle );
		await screen.findByRole( 'menu' );
		expect( toggle ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( screen.getByRole( 'group', { name: 'Status' } ) ).toBeVisible();
	} );

	it( 'counts the filters already applied and checks them', async () => {
		const user = userEvent.setup();
		render(
			<NotesFilters
				filters={ { ...DEFAULT_NOTES_FILTERS, status: 'approved' } }
				onChange={ vi.fn() }
			/>
		);
		const toggle = screen.getByRole( 'button', {
			name: 'Filter (1 applied)',
		} );
		expect( toggle ).toHaveAttribute( 'aria-expanded', 'false' );
		await user.click( toggle );
		expect(
			await screen.findByRole( 'menuitemradio', { name: 'Resolved' } )
		).toBeChecked();
	} );

	it( 'calls onChange with the chosen status', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<NotesFilters
				filters={ DEFAULT_NOTES_FILTERS }
				onChange={ onChange }
			/>
		);
		await user.click( screen.getByRole( 'button', { name: 'Filter' } ) );
		await user.click(
			await screen.findByRole( 'menuitemradio', { name: 'Open' } )
		);
		expect( onChange ).toHaveBeenCalledWith( {
			...DEFAULT_NOTES_FILTERS,
			status: 'hold',
		} );
	} );
} );
