/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Breadcrumbs } from '..';
import type { BreadcrumbsProps } from '../types';

jest.mock( '@wordpress/route', () => ( {
	Link: ( { to, children }: { to: string; children: React.ReactNode } ) => (
		<a href={ to }>{ children }</a>
	),
} ) );

describe( 'Breadcrumbs', () => {
	describe( 'types', () => {
		it( 'dummy test', () => {
			expect( true ).toBe( true );
		} );

		describe( 'should accept a single item without `to`', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const props: BreadcrumbsProps = {
					items: [ { label: 'Home' } ],
				};
				props satisfies BreadcrumbsProps;
			};
		} );

		describe( 'should accept a single item with `to`', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const props: BreadcrumbsProps = {
					items: [ { label: 'Home', to: '/' } ],
				};
				props satisfies BreadcrumbsProps;
			};
		} );

		describe( 'should accept multiple items where all preceding items have `to`', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const props: BreadcrumbsProps = {
					items: [
						{ label: 'Home', to: '/' },
						{ label: 'Settings', to: '/settings' },
						{ label: 'General' },
					],
				};
				props satisfies BreadcrumbsProps;
			};
		} );

		describe( 'should accept multiple items where the last item also has `to`', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const props: BreadcrumbsProps = {
					items: [
						{ label: 'Home', to: '/' },
						{ label: 'Settings', to: '/settings' },
					],
				};
				props satisfies BreadcrumbsProps;
			};
		} );

		describe( 'should accept an empty items array', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const props: BreadcrumbsProps = {
					items: [],
				};
				props satisfies BreadcrumbsProps;
			};
		} );

		describe( 'should reject a preceding item without `to`', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const props: BreadcrumbsProps = {
					// @ts-expect-error preceding items must have `to`.
					items: [
						{ label: 'Home' },
						{ label: 'Settings', to: '/settings' },
						{ label: 'General' },
					],
				};
				props satisfies BreadcrumbsProps;
			};
		} );

		describe( 'should reject items without a `label`', () => {
			// eslint-disable-next-line no-unused-expressions
			() => {
				const props: BreadcrumbsProps = {
					// @ts-expect-error items must have a `label`.
					items: [ { to: '/' } ],
				};
				props satisfies BreadcrumbsProps;
			};
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

		it( 'should render preceding items as links even without `to`', () => {
			render(
				<Breadcrumbs
					// @ts-expect-error testing runtime behavior with invalid props
					items={ [
						{ label: 'Home' },
						{ label: 'Settings' },
						{ label: 'General' },
					] }
				/>
			);

			expect(
				screen.queryByRole( 'heading', { level: 1 } )
			).toHaveTextContent( 'General' );

			const listItems = screen.getAllByRole( 'listitem' );
			expect( listItems ).toHaveLength( 3 );
			expect( listItems[ 0 ] ).not.toHaveTextContent( '' );
			expect( listItems[ 0 ] ).toHaveTextContent( 'Home' );
			expect( listItems[ 0 ].querySelector( 'a' ) ).toBeInTheDocument();
			expect( listItems[ 1 ].querySelector( 'a' ) ).toBeInTheDocument();
		} );

		it( 'should render inside a nav with an accessible label', () => {
			render( <Breadcrumbs items={ [ { label: 'Home', to: '/' } ] } /> );

			expect(
				screen.getByRole( 'navigation', { name: 'Breadcrumbs' } )
			).toBeInTheDocument();
		} );
	} );
} );
