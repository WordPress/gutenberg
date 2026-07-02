/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Navigation } from '..';

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
					name: 'Secondary navigation',
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

		it( 'should mark the item matching `selected` with aria-current="page"', () => {
			render(
				<Navigation
					items={ [
						{ label: 'Overview', href: '/overview' },
						{ label: 'Products', href: '/products' },
					] }
					selected="/overview"
				/>
			);

			expect(
				screen.getByRole( 'link', { name: 'Overview' } )
			).toHaveAttribute( 'aria-current', 'page' );
			expect(
				screen.getByRole( 'link', { name: 'Products' } )
			).not.toHaveAttribute( 'aria-current' );
		} );
	} );
} );
