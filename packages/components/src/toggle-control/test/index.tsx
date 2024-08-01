/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import ToggleControl from '..';

describe( 'ToggleControl', () => {
	it( 'should label the toggle', async () => {
		await render(
			<ToggleControl label="My toggle" onChange={ () => {} } />
		);

		expect(
			screen.getByRole( 'checkbox', { name: 'My toggle' } )
		).toBeInTheDocument();
	} );

	it( 'triggers change callback with boolean', async () => {
		const onChange = jest.fn();

		await render(
			<ToggleControl label="My toggle" onChange={ onChange } />
		);

		screen.getByRole( 'checkbox' ).click();
		expect( onChange ).toHaveBeenLastCalledWith( true );

		screen.getByRole( 'checkbox' ).click();
		expect( onChange ).toHaveBeenLastCalledWith( false );
	} );

	describe( 'help', () => {
		it( 'should not give the input a description if no `help` prop', async () => {
			await render(
				<ToggleControl label="My toggle" onChange={ () => {} } />
			);
			expect(
				screen.getByRole( 'checkbox' )
			).not.toHaveAccessibleDescription();
		} );

		it( "should associate `help` as the input's description", async () => {
			await render(
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
