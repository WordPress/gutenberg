import { createRef } from '@wordpress/element';
import { render, screen } from '@testing-library/react';
import { Breadcrumb } from '../index';

describe( 'Breadcrumb', () => {
	it( 'renders a navigation landmark and ordered list from items', () => {
		render(
			<Breadcrumb
				items={ [
					{ label: 'Home', href: '/' },
					{ label: 'Settings', href: '/settings' },
					{ label: 'General' },
				] }
			/>
		);

		expect(
			screen.getByRole( 'navigation', { name: 'Breadcrumbs' } )
		).toBeInTheDocument();
		expect( screen.getByRole( 'list' ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 3 );
	} );

	it( 'renders preceding items as links and the last item as the current page', () => {
		render(
			<Breadcrumb
				items={ [
					{ label: 'Home', href: '/' },
					{ label: 'General' },
				] }
			/>
		);

		expect( screen.getByRole( 'link', { name: 'Home' } ) ).toHaveAttribute(
			'href',
			'/'
		);
		expect( screen.getByText( 'General' ) ).toHaveAttribute(
			'aria-current',
			'page'
		);
	} );

	it( 'applies aria-current to the last link when it has an href', () => {
		render(
			<Breadcrumb
				items={ [
					{ label: 'Home', href: '/' },
					{ label: 'Settings', href: '/settings' },
				] }
			/>
		);

		expect( screen.getByRole( 'link', { name: 'Settings' } ) ).toHaveAttribute(
			'aria-current',
			'page'
		);
	} );

	it( 'throws when a non-final item is missing href in the items API', () => {
		expect( () =>
			render(
				<Breadcrumb
					items={ [
						{ label: 'Home' },
						{ label: 'General' },
					] }
				/>
			)
		).toThrow( /all items except the last must provide an `href`/ );
		expect( console ).toHaveErrored();
	} );

	it( 'supports compound composition and forwards refs', () => {
		const ref = createRef< HTMLElement >();

		render(
			<Breadcrumb ref={ ref }>
				<Breadcrumb.List>
					<Breadcrumb.Item href="/">Home</Breadcrumb.Item>
					<Breadcrumb.Current>Current</Breadcrumb.Current>
				</Breadcrumb.List>
			</Breadcrumb>
		);

		expect( ref.current?.tagName ).toBe( 'NAV' );
		expect( screen.getByRole( 'link', { name: 'Home' } ) ).toHaveAttribute(
			'href',
			'/'
		);
		expect( screen.getByText( 'Current' ) ).toHaveAttribute(
			'aria-current',
			'page'
		);
	} );

	it( 'supports custom item rendering', () => {
		render(
			<Breadcrumb>
				<Breadcrumb.List>
					<Breadcrumb.Item
						href="/"
						render={ ( props ) => {
							const { href, ...otherProps } = props as React.ComponentProps< 'a' >;

							return <button data-href={ href } type="button" { ...otherProps } />;
						} }
					>
						Home
					</Breadcrumb.Item>
					<Breadcrumb.Current>Current</Breadcrumb.Current>
				</Breadcrumb.List>
			</Breadcrumb>
		);

		expect( screen.getByRole( 'button', { name: 'Home' } ) ).toHaveAttribute(
			'data-href',
			'/'
		);
	} );
} );
