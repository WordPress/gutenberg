import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import ReadOnlyNavigationInnerBlocks from '../read-only-inner-blocks';

const homeLink =
	'<li class="wp-block-navigation-item"><a href="/">Home</a></li>';
const aboutLink =
	'<li class="wp-block-navigation-item"><a href="/about">About</a></li>';
const search =
	'<form role="search" class="wp-block-search"><label for="s">Search</label><input id="s" type="search" /></form>';
const siteTitle = '<p class="wp-block-site-title"><a href="/">My Site</a></p>';

describe( 'ReadOnlyNavigationInnerBlocks', () => {
	it( 'renders links in a single list', () => {
		render(
			<ReadOnlyNavigationInnerBlocks
				content={ `${ homeLink }\n${ aboutLink }` }
			/>
		);

		const list = screen.getByRole( 'list' );
		expect( list ).toHaveClass( 'wp-block-navigation__container' );
		expect( within( list ).getAllByRole( 'listitem' ) ).toHaveLength( 2 );
		expect(
			within( list ).getByRole( 'link', { name: 'Home' } )
		).toBeVisible();
		expect(
			within( list ).getByRole( 'link', { name: 'About' } )
		).toBeVisible();
	} );

	it( 'renders blocks that are not list items between lists', () => {
		render(
			<ReadOnlyNavigationInnerBlocks
				content={ `${ homeLink }${ search }${ aboutLink }` }
			/>
		);

		const lists = screen.getAllByRole( 'list' );
		expect( lists ).toHaveLength( 2 );
		for ( const list of lists ) {
			expect( list ).toHaveClass( 'wp-block-navigation__container' );
			expect( within( list ).getAllByRole( 'listitem' ) ).toHaveLength(
				1
			);
			expect(
				within( list ).queryByRole( 'search' )
			).not.toBeInTheDocument();
		}
		expect( screen.getByRole( 'search' ) ).toBeInTheDocument();
	} );

	it( 'wraps blocks that the frontend renders as list items', () => {
		render(
			<ReadOnlyNavigationInnerBlocks
				content={ `${ siteTitle }${ homeLink }` }
			/>
		);

		const list = screen.getByRole( 'list' );
		const items = within( list ).getAllByRole( 'listitem' );
		expect( items ).toHaveLength( 2 );
		expect(
			within( items[ 0 ] ).getByRole( 'link', { name: 'My Site' } )
		).toBeVisible();
	} );

	it( 'removes event handlers', () => {
		render(
			<ReadOnlyNavigationInnerBlocks
				content={ `<li class="wp-block-navigation-item"><a href="/" onclick="alert(1)">Home</a></li>` }
			/>
		);

		expect(
			screen.getByRole( 'link', { name: 'Home' } )
		).not.toHaveAttribute( 'onclick' );
	} );

	it( 'makes links and form fields inert', async () => {
		render(
			<ReadOnlyNavigationInnerBlocks
				content={ `${ homeLink }${ search }` }
			/>
		);

		// Inert applies to the top-level elements, and so to every link
		// and form field inside them.
		await waitFor( () => {
			expect( screen.getByRole( 'list' ) ).toHaveAttribute( 'inert' );
		} );
		expect( screen.getByRole( 'search' ) ).toHaveAttribute( 'inert' );
	} );
} );
