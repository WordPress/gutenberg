/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ToggleControl from '..';

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

	describe( 'togglePosition', () => {
		it( 'should render without error when togglePosition is "start"', () => {
			render(
				<ToggleControl
					label="My toggle"
					onChange={ () => {} }
					togglePosition="start"
				/>
			);
			expect(
				screen.getByRole( 'checkbox', { name: 'My toggle' } )
			).toBeInTheDocument();
		} );

		it( 'should render without error when togglePosition is "end"', () => {
			render(
				<ToggleControl
					label="My toggle"
					onChange={ () => {} }
					togglePosition="end"
				/>
			);
			expect(
				screen.getByRole( 'checkbox', { name: 'My toggle' } )
			).toBeInTheDocument();
		} );

		it( 'should render different markup for start vs end positions', () => {
			const { container: containerStart } = render(
				<ToggleControl
					label="Position test"
					onChange={ () => {} }
					togglePosition="start"
				/>
			);

			const { container: containerEnd } = render(
				<ToggleControl
					label="Position test"
					onChange={ () => {} }
					togglePosition="end"
				/>
			);

			expect( containerStart.innerHTML ).not.toBe(
				containerEnd.innerHTML
			);
		} );
	} );
} );
