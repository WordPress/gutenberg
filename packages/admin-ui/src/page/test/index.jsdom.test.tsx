import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { NavigationLinkProps } from '../../navigation/types';
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

describe( 'Page breadcrumbs', () => {
	const breadcrumbs = [
		{ label: 'Settings', href: '/settings' },
		{ label: 'General' },
	];

	it( 'should name the region from the last breadcrumb', () => {
		render(
			<Page showSidebarToggle={ false } breadcrumbs={ breadcrumbs }>
				<div>Content</div>
			</Page>
		);

		expect(
			screen.getByRole( 'region', { name: 'General' } )
		).toBeInTheDocument();
	} );

	it( 'should name the region from `ariaLabel` before the last breadcrumb', () => {
		render(
			<Page
				showSidebarToggle={ false }
				breadcrumbs={ breadcrumbs }
				ariaLabel="General settings"
			>
				<div>Content</div>
			</Page>
		);

		expect(
			screen.getByRole( 'region', { name: 'General settings' } )
		).toBeInTheDocument();
	} );

	it( 'should render the last breadcrumb as a heading at `headingLevel`', () => {
		render(
			<Page
				showSidebarToggle={ false }
				breadcrumbs={ breadcrumbs }
				headingLevel={ 2 }
			>
				<div>Content</div>
			</Page>
		);

		expect( screen.getByRole( 'heading', { level: 2 } ) ).toHaveTextContent(
			'General'
		);
	} );

	it( 'should render breadcrumb links with the provided link component', () => {
		const CustomLink = ( { children, ...props }: NavigationLinkProps ) => (
			<a data-custom="true" { ...props }>
				{ children }
			</a>
		);

		render(
			<Page
				showSidebarToggle={ false }
				components={ { link: CustomLink } }
				breadcrumbs={ breadcrumbs }
			>
				<div>Content</div>
			</Page>
		);

		const link = screen.getByRole( 'link', { name: 'Settings' } );
		expect( link ).toHaveAttribute( 'data-custom', 'true' );
		expect( link ).toHaveAttribute( 'href', '/settings' );
	} );
} );
