import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_NOTES_FILTERS, NotesFilters } from '../notes-filters';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

const note = ( id: number, author: number ) => ( {
	id,
	author,
	author_name: `Author ${ author }`,
	status: 'hold',
	content: { rendered: '<p>Note</p>' },
	reply: [],
} );

describe( 'NotesFilters', () => {
	it( 'shows the filters in a dropdown when the toggle is pressed', async () => {
		const user = userEvent.setup();
		render(
			<NotesFilters
				notes={ [ note( 1, 1 ), note( 2, 2 ) ] }
				filters={ DEFAULT_NOTES_FILTERS }
				onChange={ vi.fn() }
			/>
		);
		expect(
			screen.queryByRole( 'combobox', { name: 'Status' } )
		).not.toBeInTheDocument();

		const toggle = screen.getByRole( 'button', { name: 'Filter' } );
		await user.click( toggle );
		expect( toggle ).toHaveAttribute( 'aria-expanded', 'true' );
		expect(
			screen.getByRole( 'combobox', { name: 'Status' } )
		).toBeVisible();
		expect(
			screen.getByRole( 'combobox', { name: 'Author' } )
		).toBeVisible();
	} );

	it( 'counts the filters already applied', async () => {
		const user = userEvent.setup();
		render(
			<NotesFilters
				notes={ [ note( 1, 1 ) ] }
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
			screen.getByRole( 'combobox', { name: 'Status' } )
		).toHaveValue( 'approved' );
	} );

	it( 'hides the Author control when only one author has notes', async () => {
		const user = userEvent.setup();
		render(
			<NotesFilters
				notes={ [ note( 1, 1 ) ] }
				filters={ DEFAULT_NOTES_FILTERS }
				onChange={ vi.fn() }
			/>
		);
		await user.click( screen.getByRole( 'button', { name: 'Filter' } ) );
		expect(
			screen.getByRole( 'combobox', { name: 'Status' } )
		).toBeVisible();
		expect(
			screen.queryByRole( 'combobox', { name: 'Author' } )
		).not.toBeInTheDocument();
	} );

	it( 'keeps the Author control while an author filter is active', async () => {
		const user = userEvent.setup();
		// The other author's threads were deleted, leaving one author.
		render(
			<NotesFilters
				notes={ [ note( 1, 1 ) ] }
				filters={ { ...DEFAULT_NOTES_FILTERS, author: '1' } }
				onChange={ vi.fn() }
			/>
		);
		await user.click(
			screen.getByRole( 'button', { name: 'Filter (1 applied)' } )
		);
		expect(
			screen.getByRole( 'combobox', { name: 'Author' } )
		).toHaveValue( '1' );
	} );
} );
