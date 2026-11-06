import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RevisionDetails from '../revision-details';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

const author = {
	name: 'joen',
	avatar_urls: { '48': 'https://example.com/avatar.png' },
};

describe( 'RevisionDetails', () => {
	it( 'shows when a saved revision was made and by whom', () => {
		render(
			<RevisionDetails
				revision={ {
					id: 12,
					modified: '2026-01-22T17:12:00',
					author,
				} }
			/>
		);

		expect( screen.getByText( /2026/ ) ).toBeVisible();
		expect( screen.getByText( 'joen' ) ).toBeVisible();
		expect(
			screen.queryByText( 'Current version' )
		).not.toBeInTheDocument();
	} );

	it( 'marks the current version', () => {
		render(
			<RevisionDetails
				revision={ { id: 12, modified: '2026-01-22T17:12:00', author } }
				isCurrent
			/>
		);

		expect( screen.getByText( 'Current version' ) ).toBeVisible();
	} );

	it( 'names unsaved changes instead of a date', () => {
		render( <RevisionDetails revision={ { id: 'unsaved', author } } /> );

		expect( screen.getByText( 'Unsaved changes' ) ).toBeVisible();
		expect( screen.getByText( 'joen' ) ).toBeVisible();
	} );

	it( 'names the theme defaults, which have no author', () => {
		render( <RevisionDetails revision={ { id: 'parent', author } } /> );

		expect( screen.getByText( 'Default styles' ) ).toBeVisible();
		expect( screen.queryByText( 'joen' ) ).not.toBeInTheDocument();
	} );

	it( 'falls back to a generic name when the author is unknown', () => {
		render(
			<RevisionDetails
				revision={ { id: 12, modified: '2026-01-22T17:12:00' } }
			/>
		);

		expect( screen.getByText( 'User' ) ).toBeVisible();
	} );

	it( 'shows no date for a revision without one', () => {
		render( <RevisionDetails revision={ { id: 12, author } } /> );

		expect( screen.queryByText( /20\d\d/ ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'joen' ) ).toBeVisible();
	} );

	it( 'keeps the avatar out of the accessibility tree', () => {
		render(
			<RevisionDetails
				revision={ { id: 12, modified: '2026-01-22T17:12:00', author } }
			/>
		);

		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
	} );
} );
