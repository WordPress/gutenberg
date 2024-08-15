/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import _ToggleControl from '..';

const ToggleControl = (
	props: React.ComponentProps< typeof _ToggleControl >
) => {
	return <_ToggleControl { ...props } __nextHasNoMarginBottom />;
};

describe( 'ToggleControl', () => {
	it( 'should label the toggle', () => {
		render( <ToggleControl label="My toggle" onChange={ () => {} } /> );

		expect(
			screen.getByRole( 'checkbox', { name: 'My toggle' } )
		).toBeInTheDocument();
	} );

	it( 'triggers change callback with boolean', () => {
		const onChange = jest.fn();

		render( <ToggleControl label="My toggle" onChange={ onChange } /> );

		screen.getByRole( 'checkbox' ).click();
		expect( onChange ).toHaveBeenLastCalledWith( true );

		screen.getByRole( 'checkbox' ).click();
		expect( onChange ).toHaveBeenLastCalledWith( false );
	} );

	describe( 'help', () => {
		it( 'should not give the input a description if no `help` prop', () => {
			render( <ToggleControl label="My toggle" onChange={ () => {} } /> );
			expect(
				screen.getByRole( 'checkbox' )
			).not.toHaveAccessibleDescription();
		} );

		it( "should associate `help` as the input's description", () => {
			render(
				<ToggleControl
					help="My help text"
					label="My toggle"
					onChange={ () => {} }
				/>
			);
			expect(
				screen.getByRole( 'checkbox', { description: 'My help text' } )
			).toBeInTheDocument();
		} );
	} );
} );
