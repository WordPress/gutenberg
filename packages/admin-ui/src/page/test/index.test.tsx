/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Page from '..';

describe( 'Page navigation', () => {
	const items = [
		{ label: 'Overview', href: '/overview' },
		{ label: 'Products', href: '/products' },
	];

	it( 'should render the navigation links in the page header', () => {
		render(
			<Page
				title="Analytics"
				showSidebarToggle={ false }
				navigation={ { items, currentHref: '/overview' } }
			>
				<div>Content</div>
			</Page>
		);

		expect(
			screen.getByRole( 'navigation', { name: 'Sections' } )
		).toBeInTheDocument();

		const links = screen.getAllByRole( 'link' );
		expect( links ).toHaveLength( 2 );
		expect(
			screen.getByRole( 'link', { name: 'Overview' } )
		).toHaveAttribute( 'aria-current', 'page' );
		expect(
			screen.getByRole( 'link', { name: 'Products' } )
		).not.toHaveAttribute( 'aria-current' );
	} );

	it( 'should not render a navigation landmark when there are no items', () => {
		render(
			<Page
				title="Analytics"
				showSidebarToggle={ false }
				navigation={ { items: [] } }
			>
				<div>Content</div>
			</Page>
		);

		expect( screen.queryByRole( 'navigation' ) ).not.toBeInTheDocument();
	} );
} );
