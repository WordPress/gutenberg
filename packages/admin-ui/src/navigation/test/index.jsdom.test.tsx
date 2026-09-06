import { render, screen } from '@testing-library/react';
import { Navigation } from '..';
import type { NavigationLinkProps } from '../types';

describe( 'Navigation', () => {
	describe( 'validation', () => {
		it( 'should throw when an item is missing `href`', () => {
			expect( () =>
				render(
					<Navigation
						items={ [
							{ label: 'Overview', href: '/overview' },
							{ label: 'Products' } as never,
						] }
					/>
				)
			).toThrow( /item "Products" is missing an `href` prop/ );
			expect( console ).toHaveErrored();
		} );

		it( 'should throw when two items share the same `href`', () => {
			expect( () =>
				render(
					<Navigation
						items={ [
							{ label: 'Overview', href: '/overview' },
							{ label: 'Duplicate', href: '/overview' },
						] }
					/>
				)
			).toThrow( /duplicate `href` "\/overview"/ );
			expect( console ).toHaveErrored();
		} );

		it( 'should not throw when all items have `href`', () => {
			expect( () =>
				render(
					<Navigation
						items={ [
							{ label: 'Overview', href: '/overview' },
							{ label: 'Products', href: '/products' },
						] }
					/>
				)
			).not.toThrow();
		} );

		it( 'should not throw when items is empty', () => {
			expect( () => render( <Navigation items={ [] } /> ) ).not.toThrow();
		} );

		it( 'should allow an empty string `href`', () => {
			expect( () =>
				render(
					<Navigation
						items={ [
							{ label: 'Overview', href: '' },
							{ label: 'Products', href: '/products' },
						] }
						currentHref=""
					/>
				)
			).not.toThrow();
		} );
	} );

	describe( 'rendering', () => {
		it( 'should render nothing when items is empty', () => {
			const { container } = render( <Navigation items={ [] } /> );
			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'should render inside a nav with a default accessible label', () => {
			render(
				<Navigation
					items={ [ { label: 'Overview', href: '/overview' } ] }
				/>
			);

			expect(
				screen.getByRole( 'navigation', {
					name: 'Sections',
				} )
			).toBeInTheDocument();
		} );

		it( 'should use a custom `ariaLabel` when provided', () => {
			render(
				<Navigation
					items={ [ { label: 'Overview', href: '/overview' } ] }
					ariaLabel="Analytics sections"
				/>
			);

			expect(
				screen.getByRole( 'navigation', {
					name: 'Analytics sections',
				} )
			).toBeInTheDocument();
		} );

		it( 'should render each item as a link with its `href`', () => {
			render(
				<Navigation
					items={ [
						{ label: 'Overview', href: '/overview' },
						{ label: 'Products', href: '/products' },
					] }
				/>
			);

			const links = screen.getAllByRole( 'link' );
			expect( links ).toHaveLength( 2 );
			expect( links[ 0 ] ).toHaveTextContent( 'Overview' );
			expect( links[ 0 ] ).toHaveAttribute( 'href', '/overview' );
			expect( links[ 1 ] ).toHaveTextContent( 'Products' );
			expect( links[ 1 ] ).toHaveAttribute( 'href', '/products' );
		} );

		it( 'should mark the item matching `currentHref` with aria-current="page"', () => {
			render(
				<Navigation
					items={ [
						{ label: 'Overview', href: '/overview' },
						{ label: 'Products', href: '/products' },
					] }
					currentHref="/overview"
				/>
			);

			expect(
				screen.getByRole( 'link', { name: 'Overview' } )
			).toHaveAttribute( 'aria-current', 'page' );
			expect(
				screen.getByRole( 'link', { name: 'Products' } )
			).not.toHaveAttribute( 'aria-current' );
		} );

		it( 'should mark an empty string `href` as current when `currentHref` is empty', () => {
			render(
				<Navigation
					items={ [
						{ label: 'Overview', href: '' },
						{ label: 'Products', href: '/products' },
					] }
					currentHref=""
				/>
			);

			// Disable reason: A link with an empty `href` doesn't surface in
			// the accessibility three via `getByRole` with `name`. In practice
			// this would likely not be something we would recommend doing, but
			// this test verifies the expected behavior of current link testing.
			// eslint-disable-next-line testing-library/no-node-access
			const overviewLink = screen.getByText( 'Overview' ).closest( 'a' );
			expect( overviewLink ).toHaveAttribute( 'href', '' );
			expect( overviewLink ).toHaveAttribute( 'aria-current', 'page' );
		} );
	} );

	describe( 'linkComponent', () => {
		it( 'should render items with the provided link component', () => {
			const CustomLink = ( {
				children,
				...props
			}: NavigationLinkProps ) => (
				<a data-custom="true" { ...props }>
					{ children }
				</a>
			);

			render(
				<Navigation
					items={ [
						{ label: 'Overview', href: '/overview' },
						{ label: 'Products', href: '/products' },
					] }
					currentHref="/overview"
					linkComponent={ CustomLink }
				/>
			);

			const link = screen.getByRole( 'link', { name: 'Overview' } );
			expect( link ).toHaveAttribute( 'data-custom', 'true' );
			expect( link ).toHaveAttribute( 'href', '/overview' );
			expect( link ).toHaveAttribute( 'aria-current', 'page' );
			expect(
				screen.getByRole( 'link', { name: 'Products' } )
			).toHaveAttribute( 'data-custom', 'true' );
		} );
	} );
} );
