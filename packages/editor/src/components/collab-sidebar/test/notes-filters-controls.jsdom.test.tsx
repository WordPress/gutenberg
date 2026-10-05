import { render, screen } from '@testing-library/react';
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
	it( 'hides the Author control when only one author has notes', () => {
		render(
			<NotesFilters
				notes={ [ note( 1, 1 ) ] }
				filters={ DEFAULT_NOTES_FILTERS }
				onChange={ vi.fn() }
			/>
		);
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
