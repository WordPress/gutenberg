import { render, screen, within } from '@testing-library/react';
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
	it( 'shows the filters in a menu when the toggle is pressed', async () => {
		const user = userEvent.setup();
		render(
			<NotesFilters
				notes={ [ note( 1, 1 ), note( 2, 2 ) ] }
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
		expect( screen.getByRole( 'group', { name: 'Author' } ) ).toBeVisible();
	} );

	it( 'counts the filters already applied and checks them', async () => {
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
			await screen.findByRole( 'menuitemradio', { name: 'Resolved' } )
		).toBeChecked();
	} );

	it( 'calls onChange with the chosen status', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<NotesFilters
				notes={ [ note( 1, 1 ) ] }
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

	it( 'hides the Author group when only one author has notes', async () => {
		const user = userEvent.setup();
		render(
			<NotesFilters
				notes={ [ note( 1, 1 ) ] }
				filters={ DEFAULT_NOTES_FILTERS }
				onChange={ vi.fn() }
			/>
		);
		await user.click( screen.getByRole( 'button', { name: 'Filter' } ) );
		await screen.findByRole( 'menu' );
		expect( screen.getByRole( 'group', { name: 'Status' } ) ).toBeVisible();
		expect(
			screen.queryByRole( 'group', { name: 'Author' } )
		).not.toBeInTheDocument();
	} );

	it( 'keeps the Author group while an author filter is active', async () => {
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
		await screen.findByRole( 'menu' );
		expect(
			within( screen.getByRole( 'group', { name: 'Author' } ) ).getByRole(
				'menuitemradio',
				{ name: 'Author 1' }
			)
		).toBeChecked();
	} );
} );
