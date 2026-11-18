import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { useServerSideRender } from '@wordpress/server-side-render';
import ReadOnlyNavigationInnerBlocks, {
	getMenuItemsHtml,
} from '../read-only-inner-blocks';

vi.mock( import( '@wordpress/server-side-render' ), () => ( {
	useServerSideRender: vi.fn(),
} ) );

const mockUseServerSideRender = vi.mocked( useServerSideRender );

const renderedNavigation = `<nav class="wp-block-navigation" aria-label="Main"><ul class="wp-block-navigation__container"><li class="wp-block-navigation-item"><a href="/">Home</a></li><li class="wp-block-navigation-item"><a href="/about">About</a></li></ul><form role="search" class="wp-block-search"><label for="s">Search</label><input id="s" type="search" /></form></nav>`;

describe( 'getMenuItemsHtml', () => {
	it( 'returns the content of the nav element', () => {
		const html = getMenuItemsHtml( renderedNavigation );

		expect( html ).toMatch(
			/^<ul class="wp-block-navigation__container">/
		);
		expect( html ).not.toContain( '<nav' );
	} );

	it( 'returns an empty string when nothing is rendered', () => {
		expect( getMenuItemsHtml( '' ) ).toBe( '' );
	} );
} );

describe( 'ReadOnlyNavigationInnerBlocks', () => {
	beforeEach( () => {
		mockUseServerSideRender.mockReset();
	} );

	it( 'renders the menu without its overlay', () => {
		mockUseServerSideRender.mockReturnValue( {
			status: 'success',
			content: renderedNavigation,
		} );

		render(
			<ReadOnlyNavigationInnerBlocks
				attributes={ { ref: 1, overlayMenu: 'mobile' } }
			/>
		);

		expect( mockUseServerSideRender ).toHaveBeenCalledWith( {
			block: 'core/navigation',
			attributes: { ref: 1, overlayMenu: 'never' },
		} );
		expect( screen.queryByRole( 'navigation' ) ).not.toBeInTheDocument();
		const list = screen.getByRole( 'list' );
		expect( within( list ).getAllByRole( 'listitem' ) ).toHaveLength( 2 );
		expect( screen.getByRole( 'search' ) ).toBeInTheDocument();
	} );

	it( 'removes event handlers', () => {
		mockUseServerSideRender.mockReturnValue( {
			status: 'success',
			content: `<nav><ul><li><a href="/" onclick="alert(1)">Home</a></li></ul></nav>`,
		} );

		render( <ReadOnlyNavigationInnerBlocks attributes={ { ref: 1 } } /> );

		expect(
			screen.getByRole( 'link', { name: 'Home' } )
		).not.toHaveAttribute( 'onclick' );
	} );

	it( 'makes links and form fields inert', async () => {
		mockUseServerSideRender.mockReturnValue( {
			status: 'success',
			content: renderedNavigation,
		} );

		render( <ReadOnlyNavigationInnerBlocks attributes={ { ref: 1 } } /> );

		// Inert applies to the top-level elements, and so to every link
		// and form field inside them.
		await waitFor( () => {
			expect( screen.getByRole( 'list' ) ).toHaveAttribute( 'inert' );
		} );
		expect( screen.getByRole( 'search' ) ).toHaveAttribute( 'inert' );
	} );

	it( 'keeps the last preview while a new one loads', () => {
		mockUseServerSideRender.mockReturnValue( {
			status: 'success',
			content: renderedNavigation,
		} );
		const { rerender } = render(
			<ReadOnlyNavigationInnerBlocks attributes={ { ref: 1 } } />
		);

		mockUseServerSideRender.mockReturnValue( { status: 'loading' } );
		rerender(
			<ReadOnlyNavigationInnerBlocks
				attributes={ { ref: 1, showSubmenuIcon: false } }
			/>
		);

		expect( screen.getByRole( 'link', { name: 'Home' } ) ).toBeVisible();
	} );

	it( 'shows a message when the menu cannot be rendered', () => {
		mockUseServerSideRender.mockReturnValue( {
			status: 'error',
			error: 'Sorry, you are not allowed to do that.',
		} );

		render( <ReadOnlyNavigationInnerBlocks attributes={ { ref: 1 } } /> );

		expect(
			screen.getByText( 'The Navigation Menu could not be shown.' )
		).toBeVisible();
	} );
} );
