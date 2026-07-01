/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Navigation } from '..';

jest.mock( '@wordpress/route', () => ( {
	Link: ( {
		to,
		search,
		children,
		...props
	}: {
		to?: string;
		search?:
			| Record< string, string >
			| ( (
					previous: Record< string, string >
			  ) => Record< string, string > );
		children: React.ReactNode;
	} ) => {
		// The router resolves the `search` reducer against the current params.
		const resolved = typeof search === 'function' ? search( {} ) : search;
		const href =
			to ??
			( resolved
				? `?${ new URLSearchParams( resolved ).toString() }`
				: undefined );
		return (
			<a href={ href } { ...props }>
				{ children }
			</a>
		);
	},
} ) );

describe( 'Navigation', () => {
	describe( 'validation', () => {
		it( 'should throw when an item has neither `to` nor `search`', () => {
			expect( () =>
				render(
					<Navigation
						items={ [
							{ label: 'Overview', to: '/overview' },
							{ label: 'Products' },
						] }
					/>
				)
			).toThrow( /item "Products" must have a `to` or `search` prop/ );
			expect( console ).toHaveErrored();
		} );

		it( 'should not throw when all items have `to`', () => {
			expect( () =>
				render(
					<Navigation
						items={ [
							{ label: 'Overview', to: '/overview' },
							{ label: 'Products', to: '/products' },
						] }
					/>
				)
			).not.toThrow();
		} );

		it( 'should not throw when an item provides only `search`', () => {
			expect( () =>
				render(
					<Navigation
						items={ [
							{
								label: 'Overview',
								search: { section: 'overview' },
							},
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
					items={ [ { label: 'Overview', to: '/overview' } ] }
				/>
			);

			expect(
				screen.getByRole( 'navigation', {
					name: 'Secondary navigation',
				} )
			).toBeInTheDocument();
		} );

		it( 'should render each item as a link with its `to` as href', () => {
			render(
				<Navigation
					items={ [
						{ label: 'Overview', to: '/overview' },
						{ label: 'Products', to: '/products' },
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

		it( 'should build an href from `search` when `to` is omitted', () => {
			render(
				<Navigation
					items={ [
						{ label: 'Overview', search: { section: 'overview' } },
					] }
				/>
			);

			expect(
				screen.getByRole( 'link', { name: 'Overview' } )
			).toHaveAttribute( 'href', '?section=overview' );
		} );

		it( 'should mark only the active item with aria-current="page"', () => {
			render(
				<Navigation
					items={ [
						{ label: 'Overview', to: '/overview', active: true },
						{ label: 'Products', to: '/products' },
					] }
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
