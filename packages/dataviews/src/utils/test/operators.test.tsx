/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { getOperatorByName } from '../operators';
import { OPERATOR_IS, OPERATOR_IS_ANY } from '../../constants';

const sampleFilter = { name: 'Author' } as const;

const ROOT_TEST_ID = 'filter-chip';
const NAME_CLASS = 'dataviews-filters__summary-filter-text-name';
const VALUE_CLASS = 'dataviews-filters__summary-filter-text-value';

function renderFilter( element: React.ReactNode ) {
	return render( <div data-testid={ ROOT_TEST_ID }>{ element }</div> );
}

function getRoot() {
	return screen.getByTestId( ROOT_TEST_ID );
}

describe( 'operators filterText', () => {
	it( 'renders a string label inside the Value wrapper (legacy BC)', () => {
		const operator = getOperatorByName( OPERATOR_IS );
		expect( operator ).toBeDefined();

		renderFilter(
			operator!.filterText( sampleFilter, [
				{ value: 1, label: 'Admin' },
			] )
		);

		const root = getRoot();
		expect( within( root ).getByText( 'Admin' ) ).toBeInTheDocument();
		expect(
			within( root ).getByText( ( _, el ) =>
				Boolean(
					el?.classList.contains( NAME_CLASS ) &&
						el.textContent?.startsWith( 'Author' )
				)
			)
		).toBeInTheDocument();
	} );

	it( 'renders a React labelElement in place of label', () => {
		const operator = getOperatorByName( OPERATOR_IS );
		expect( operator ).toBeDefined();

		renderFilter(
			operator!.filterText( sampleFilter, [
				{
					value: 1,
					label: 'Admin',
					labelElement: <span data-testid="badge">Admin</span>,
				},
			] )
		);

		const badge = screen.getByTestId( 'badge' );
		expect( badge ).toBeInTheDocument();
		expect( getRoot() ).toContainElement( badge );
	} );

	it( 'joins multiple labelElements with a comma separator', () => {
		const operator = getOperatorByName( OPERATOR_IS_ANY );
		expect( operator ).toBeDefined();

		renderFilter(
			operator!.filterText( sampleFilter, [
				{
					value: 1,
					label: 'Admin',
					labelElement: <span data-testid="el">Admin</span>,
				},
				{
					value: 2,
					label: 'Editor',
					labelElement: <span data-testid="el">Editor</span>,
				},
			] )
		);

		expect( screen.getAllByTestId( 'el' ) ).toHaveLength( 2 );
		expect( getRoot() ).toHaveTextContent( 'Admin, Editor' );
	} );

	it( 'joins mixed string and React labels in order', () => {
		const operator = getOperatorByName( OPERATOR_IS_ANY );
		expect( operator ).toBeDefined();

		renderFilter(
			operator!.filterText( sampleFilter, [
				{ value: 1, label: 'Admin' },
				{
					value: 2,
					label: 'Editor',
					labelElement: <span data-testid="el">Editor</span>,
				},
				{ value: 3, label: 'Author' },
			] )
		);

		expect( screen.getByTestId( 'el' ) ).toBeInTheDocument();
		expect( screen.getAllByTestId( 'el' ) ).toHaveLength( 1 );
		expect( getRoot() ).toHaveTextContent( 'Admin, Editor, Author' );
	} );

	it( 'wraps the filter name in the Name CSS class', () => {
		const operator = getOperatorByName( OPERATOR_IS );
		expect( operator ).toBeDefined();

		renderFilter(
			operator!.filterText( sampleFilter, [
				{ value: 1, label: 'Admin' },
			] )
		);

		const nameWrapper = within( getRoot() ).getByText( ( _, el ) =>
			Boolean(
				el?.classList.contains( NAME_CLASS ) &&
					el.textContent?.startsWith( 'Author' )
			)
		);
		expect( nameWrapper ).toHaveClass( NAME_CLASS );
	} );

	it( 'keeps CSS class hooks for the React labelElement path', () => {
		const operator = getOperatorByName( OPERATOR_IS );
		expect( operator ).toBeDefined();

		renderFilter(
			operator!.filterText( sampleFilter, [
				{
					value: 1,
					label: 'Admin',
					labelElement: <span data-testid="badge">Admin</span>,
				},
			] )
		);

		const root = getRoot();
		expect(
			within( root ).getByText( ( _, el ) =>
				Boolean( el?.classList.contains( NAME_CLASS ) )
			)
		).toBeInTheDocument();
		expect(
			within( root ).getByText( ( _, el ) =>
				Boolean( el?.classList.contains( VALUE_CLASS ) )
			)
		).toBeInTheDocument();
		expect( screen.getByTestId( 'badge' ) ).toBeInTheDocument();
	} );
} );
