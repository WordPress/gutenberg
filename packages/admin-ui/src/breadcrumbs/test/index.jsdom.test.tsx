import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from '..';

describe( 'Breadcrumbs', () => {
	describe( 'validation', () => {
		it( 'should throw when a preceding item is missing `href`', () => {
			expect( () =>
				render(
					<Breadcrumbs
						headingLevel={ 1 }
						items={ [
							{ label: 'Home' },
							{ label: 'Settings', href: '/settings' },
							{ label: 'General' },
						] }
					/>
				)
			).toThrow( /item "Home" is missing an `href` prop/ );

			expect( () =>
				render(
					<Breadcrumbs
						headingLevel={ 1 }
						items={ [
							{ label: 'Home', href: '' },
							{ label: 'General' },
						] }
					/>
				)
			).toThrow( /item "Home" is missing an `href` prop/ );
		} );

		it( 'should throw for the first preceding item missing `href`', () => {
			expect( () =>
				render(
					<Breadcrumbs
						headingLevel={ 1 }
						items={ [
							{ label: 'Home' },
							{ label: 'Settings' },
							{ label: 'General' },
						] }
					/>
				)
			).toThrow( /item "Home" is missing an `href` prop/ );
		} );

		it( 'should not throw when all preceding items have `href`', () => {
			expect( () =>
				render(
					<Breadcrumbs
						headingLevel={ 1 }
						items={ [
							{ label: 'Home', href: '/' },
							{ label: 'Settings', href: '/settings' },
							{ label: 'General' },
						] }
					/>
				)
			).not.toThrow();
		} );

		it( 'should not throw when there is only one item without `href`', () => {
			expect( () =>
				render(
					<Breadcrumbs
						headingLevel={ 1 }
						items={ [ { label: 'Dashboard' } ] }
					/>
				)
			).not.toThrow();
		} );

		it( 'should not throw when items is empty', () => {
			expect( () =>
				render( <Breadcrumbs headingLevel={ 1 } items={ [] } /> )
			).not.toThrow();
		} );
	} );

	describe( 'rendering', () => {
		it( 'should render nothing when items is empty', () => {
			const { container } = render(
				<Breadcrumbs headingLevel={ 1 } items={ [] } />
			);
			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'should render the last item as an h1', () => {
			render(
				<Breadcrumbs
					headingLevel={ 1 }
					items={ [
						{ label: 'Home', href: '/' },
						{ label: 'Current Page' },
					] }
				/>
			);

			expect(
				screen.getByRole( 'heading', { level: 1 } )
			).toHaveTextContent( 'Current Page' );
		} );

		it( 'should render preceding items as links', () => {
			render(
				<Breadcrumbs
					headingLevel={ 1 }
					items={ [
						{ label: 'Home', href: '/' },
						{ label: 'Settings', href: '/settings' },
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
					headingLevel={ 1 }
					items={ [
						{ label: 'Home', href: '/' },
						{ label: 'Settings', href: '/settings' },
						{ label: 'General' },
					] }
				/>
			);

			const headings = screen.getAllByRole( 'heading', { level: 1 } );
			expect( headings ).toHaveLength( 1 );
			expect( headings[ 0 ] ).toHaveTextContent( 'General' );
		} );

		it( 'should render a single item without `href` as an h1', () => {
			render(
				<Breadcrumbs
					headingLevel={ 1 }
					items={ [ { label: 'Dashboard' } ] }
				/>
			);

			expect(
				screen.getByRole( 'heading', { level: 1 } )
			).toHaveTextContent( 'Dashboard' );
			expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
		} );

		it( 'should render inside a nav with an accessible label', () => {
			render(
				<Breadcrumbs
					headingLevel={ 1 }
					items={ [ { label: 'Home', href: '/' } ] }
				/>
			);

			expect(
				screen.getByRole( 'navigation', { name: 'Breadcrumbs' } )
			).toBeInTheDocument();
		} );
	} );
} );
