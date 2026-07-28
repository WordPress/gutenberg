/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Breadcrumbs } from '..';

jest.mock( '@wordpress/route', () => ( {
	Link: ( { to, children }: { to: string; children: React.ReactNode } ) => (
		<a href={ to }>{ children }</a>
	),
} ) );

describe( 'Breadcrumbs', () => {
	describe( 'validation', () => {
		it( 'should throw when a preceding item is missing `to`', () => {
			expect( () =>
				render(
					<Breadcrumbs
						items={ [
							{ label: 'Home' },
							{ label: 'Settings', to: '/settings' },
							{ label: 'General' },
						] }
					/>
				)
			).toThrow( /item "Home" is missing a `to` prop/ );
			expect( console ).toHaveErrored();
		} );

		it( 'should throw for the first preceding item missing `to`', () => {
			expect( () =>
				render(
					<Breadcrumbs
						items={ [
							{ label: 'Home' },
							{ label: 'Settings' },
							{ label: 'General' },
						] }
					/>
				)
			).toThrow( /item "Home" is missing a `to` prop/ );
			expect( console ).toHaveErrored();
		} );

		it( 'should not throw when all preceding items have `to`', () => {
			expect( () =>
				render(
					<Breadcrumbs
						items={ [
							{ label: 'Home', to: '/' },
							{ label: 'Settings', to: '/settings' },
							{ label: 'General' },
						] }
					/>
				)
			).not.toThrow();
		} );

		it( 'should not throw when there is only one item without `to`', () => {
			expect( () =>
				render( <Breadcrumbs items={ [ { label: 'Dashboard' } ] } /> )
			).not.toThrow();
		} );

		it( 'should not throw when items is empty', () => {
			expect( () =>
				render( <Breadcrumbs items={ [] } /> )
			).not.toThrow();
		} );
	} );

	describe( 'rendering', () => {
		it( 'should render nothing when items is empty', () => {
			const { container } = render( <Breadcrumbs items={ [] } /> );
			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'should render the last item as an h1 when it has no `to`', () => {
			render(
				<Breadcrumbs
					items={ [
						{ label: 'Home', to: '/' },
						{ label: 'Current Page' },
					] }
				/>
			);

			expect(
				screen.getByRole( 'heading', { level: 1 } )
			).toHaveTextContent( 'Current Page' );
		} );

		it( 'should render the last item as a link when it has `to`', () => {
			render(
				<Breadcrumbs
					items={ [
						{ label: 'Home', to: '/' },
						{ label: 'Settings', to: '/settings' },
					] }
				/>
			);

			expect(
				screen.queryByRole( 'heading', { level: 1 } )
			).not.toBeInTheDocument();

			const links = screen.getAllByRole( 'link' );
			expect( links ).toHaveLength( 2 );
			expect( links[ 1 ] ).toHaveTextContent( 'Settings' );
			expect( links[ 1 ] ).toHaveAttribute( 'href', '/settings' );
		} );

		it( 'should render preceding items as links', () => {
			render(
				<Breadcrumbs
					items={ [
						{ label: 'Home', to: '/' },
						{ label: 'Settings', to: '/settings' },
						{ label: 'General' },
					] }
				/>
			);

			const links = screen.getAllByRole( 'link' );
			expect( links ).toHaveLength( 2 );
			expect( links[ 0 ] ).toHaveTextContent( 'Home' );
			expect( links[ 0 ] ).toHaveAttribute( 'href', '/' );
			expect( links[ 1 ] ).toHaveTextContent( 'Settings' );
			expect( links[ 1 ] ).toHaveAttribute( 'href', '/settings' );
		} );

		it( 'should never render preceding items as headings', () => {
			render(
				<Breadcrumbs
					items={ [
						{ label: 'Home', to: '/' },
						{ label: 'Settings', to: '/settings' },
						{ label: 'General' },
					] }
				/>
			);

			const headings = screen.getAllByRole( 'heading', { level: 1 } );
			expect( headings ).toHaveLength( 1 );
			expect( headings[ 0 ] ).toHaveTextContent( 'General' );
		} );

		it( 'should render a single item without `to` as an h1', () => {
			render( <Breadcrumbs items={ [ { label: 'Dashboard' } ] } /> );

			expect(
				screen.getByRole( 'heading', { level: 1 } )
			).toHaveTextContent( 'Dashboard' );
			expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		} );

		it( 'should render inside a nav with an accessible label', () => {
			render( <Breadcrumbs items={ [ { label: 'Home', to: '/' } ] } /> );

			expect(
				screen.getByRole( 'navigation', { name: 'Breadcrumbs' } )
			).toBeInTheDocument();
		} );
	} );
} );
