/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import BlockBreadcrumb from '../';

describe( 'BlockBreadcrumb', () => {
	it( 'should render correctly', () => {
		const { container } = render( <BlockBreadcrumb /> );

		expect( container ).toMatchSnapshot();
	} );

	describe( 'Root label text', () => {
		test( 'should display default label of "Document"', () => {
			render( <BlockBreadcrumb /> );

			const rootLabelTextDefault = screen.getByText( 'Document' );

			expect( rootLabelTextDefault ).toBeInTheDocument();
		} );

		test( 'should display `rootLabelText` value', () => {
			render( <BlockBreadcrumb rootLabelText="Tuhinga" /> );

			const rootLabelText = screen.getByText( 'Tuhinga' );
			const rootLabelTextDefault = screen.queryByText( 'Document' );

			expect( rootLabelTextDefault ).not.toBeInTheDocument();
			expect( rootLabelText ).toBeInTheDocument();
		} );
	} );
} );
