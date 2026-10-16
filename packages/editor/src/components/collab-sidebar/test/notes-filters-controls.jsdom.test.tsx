import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_NOTES_FILTERS, NotesFilters } from '../notes-filters';

const note = ( id: number, author: number ) => ( {
	id,
	author,
	author_name: `Author ${ author }`,
	status: 'hold',
	content: { rendered: '<p>Note</p>' },
	reply: [],
} );

describe( 'NotesFilters', () => {
	it( 'shows the filters only after the toggle is pressed', async () => {
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

	it( 'starts open and counts the filters already applied', () => {
		render(
			<NotesFilters
				notes={ [ note( 1, 1 ) ] }
				filters={ { ...DEFAULT_NOTES_FILTERS, status: 'approved' } }
				onChange={ vi.fn() }
			/>
		);
		expect(
			screen.getByRole( 'button', { name: 'Filter (1 applied)' } )
		).toHaveAttribute( 'aria-expanded', 'true' );
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

	it( 'keeps the Author control while an author filter is active', () => {
		// The other author's threads were deleted, leaving one author.
		render(
			<NotesFilters
				notes={ [ note( 1, 1 ) ] }
				filters={ { ...DEFAULT_NOTES_FILTERS, author: '1' } }
				onChange={ vi.fn() }
			/>
		);
		expect(
			screen.getByRole( 'combobox', { name: 'Author' } )
		).toHaveValue( '1' );
	} );
} );
