import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { NavigationLinkProps } from '../../navigation/types';
import Breadcrumbs from '../../breadcrumbs';
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

	it( 'should render navigation with the provided link component', () => {
		const CustomLink = ( { children, ...props }: NavigationLinkProps ) => (
			<a data-custom="true" { ...props }>
				{ children }
			</a>
		);

		render(
			<Page
				title="Analytics"
				showSidebarToggle={ false }
				components={ { link: CustomLink } }
				navigation={ { items, currentHref: '/overview' } }
			>
				<div>Content</div>
			</Page>
		);

		const link = screen.getByRole( 'link', { name: 'Overview' } );
		expect( link ).toHaveAttribute( 'data-custom', 'true' );
		expect( link ).toHaveAttribute( 'href', '/overview' );
	} );
} );

describe( 'Page region name', () => {
	it( 'takes its name from the title', () => {
		render(
			<Page title="Analytics" showSidebarToggle={ false }>
				Content
			</Page>
		);

		expect(
			screen.getByRole( 'region', { name: 'Analytics' } )
		).toBeInTheDocument();
	} );

	it( 'takes its name from the current page in the breadcrumbs', () => {
		render(
			<Page
				showSidebarToggle={ false }
				breadcrumbs={
					<Breadcrumbs items={ [ { label: 'General' } ] } />
				}
			>
				Content
			</Page>
		);

		expect(
			screen.getByRole( 'region', { name: 'General' } )
		).toBeInTheDocument();
	} );

	it( 'uses `ariaLabel` in place of the heading', () => {
		render(
			<Page
				title="Analytics"
				ariaLabel="Site analytics"
				showSidebarToggle={ false }
			>
				Content
			</Page>
		);

		expect(
			screen.getByRole( 'region', { name: 'Site analytics' } )
		).toBeInTheDocument();
	} );
} );
