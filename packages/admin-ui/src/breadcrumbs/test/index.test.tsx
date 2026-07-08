/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Breadcrumbs } from '..';

jest.mock( '@wordpress/route', () => ( {
	Link: ( {
		to,
		children,
		search,
		params,
		hash,
	}: {
		to: string;
		children: React.ReactNode;
		search?: Record< string, unknown >;
		params?: Record< string, unknown >;
		hash?: string;
	} ) => {
		const searchString =
			search && Object.keys( search ).length
				? '?' +
				  new URLSearchParams(
						Object.fromEntries(
							Object.entries( search ).map(
								( [ key, value ] ) => [ key, String( value ) ]
							)
						)
				  ).toString()
				: '';
		const href = `${ to }${ searchString }${ hash ? `#${ hash }` : '' }`;

		return (
			<a
				href={ href }
				data-params={ params ? JSON.stringify( params ) : undefined }
				data-hash={ hash }
			>
				{ children }
			</a>
		);
	},
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

		it( 'should forward search from a preceding item to its link', () => {
			render(
				<Breadcrumbs
					items={ [
						{
							label: 'Home',
							to: '/',
							search: { filter: 'active', page: 2 },
						},
						{ label: 'Current Page' },
					] }
				/>
			);

			const link = screen.getByRole( 'link', { name: 'Home' } );
			expect( link ).toHaveAttribute( 'href', '/?filter=active&page=2' );
		} );

		it( 'should forward search from the last item when it has `to`', () => {
			render(
				<Breadcrumbs
					items={ [
						{ label: 'Home', to: '/' },
						{
							label: 'Settings',
							to: '/settings',
							search: { tab: 'general' },
						},
					] }
				/>
			);

			const link = screen.getByRole( 'link', { name: 'Settings' } );
			expect( link ).toHaveAttribute( 'href', '/settings?tab=general' );
		} );

		it( 'should forward params to breadcrumb links', () => {
			render(
				<Breadcrumbs
					items={ [
						{
							label: 'Post',
							to: '/posts/$postId',
							params: { postId: '42' },
						},
						{ label: 'Edit' },
					] }
				/>
			);

			const link = screen.getByRole( 'link', { name: 'Post' } );
			expect( link ).toHaveAttribute(
				'data-params',
				JSON.stringify( { postId: '42' } )
			);
		} );

		it( 'should forward hash to breadcrumb links', () => {
			render(
				<Breadcrumbs
					items={ [
						{
							label: 'Settings',
							to: '/settings',
							hash: 'advanced',
						},
						{ label: 'General' },
					] }
				/>
			);

			const link = screen.getByRole( 'link', { name: 'Settings' } );
			expect( link ).toHaveAttribute( 'href', '/settings#advanced' );
			expect( link ).toHaveAttribute( 'data-hash', 'advanced' );
		} );

		it( 'should render links without search, params, or hash unchanged', () => {
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
			expect( links[ 0 ] ).toHaveAttribute( 'href', '/' );
			expect( links[ 0 ] ).not.toHaveAttribute( 'data-params' );
			expect( links[ 0 ] ).not.toHaveAttribute( 'data-hash' );
			expect( links[ 1 ] ).toHaveAttribute( 'href', '/settings' );
		} );
	} );
} );
