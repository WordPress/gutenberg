/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import LineHeightControl from '../';
import { BASE_DEFAULT_VALUE, SPIN_FACTOR, STEP } from '../utils';

const SPIN = STEP * SPIN_FACTOR;

const ControlledLineHeightControl = () => {
	const [ value, setValue ] = useState();
	return (
		<LineHeightControl
			value={ value }
			onChange={ setValue }
			__next40pxDefaultSize
		/>
	);
};

describe( 'LineHeightControl', () => {
	it( 'should immediately step up from the default value if up-arrowed from an unset state', async () => {
		const user = userEvent.setup();
		render( <ControlledLineHeightControl /> );
		const input = screen.getByRole( 'spinbutton' );
		await user.click( input );
		await user.keyboard( '{ArrowUp}' );
		expect( input ).toHaveValue( BASE_DEFAULT_VALUE + SPIN );
	} );

	it( 'should immediately step down from the default value if down-arrowed from an unset state', async () => {
		const user = userEvent.setup();
		render( <ControlledLineHeightControl /> );
		const input = screen.getByRole( 'spinbutton' );
		await user.click( input );
		await user.keyboard( '{ArrowDown}' );
		expect( input ).toHaveValue( BASE_DEFAULT_VALUE - SPIN );
	} );

	it( 'should immediately step up from the default value if spin button up was clicked from an unset state', async () => {
		const user = userEvent.setup();
		render( <ControlledLineHeightControl /> );
		const input = screen.getByRole( 'spinbutton' );
		await user.click( screen.getByRole( 'button', { name: 'Increment' } ) );
		expect( input ).toHaveValue( BASE_DEFAULT_VALUE + SPIN );
	} );

	it( 'should immediately step down from the default value if spin button down was clicked from an unset state', async () => {
		const user = userEvent.setup();
		render( <ControlledLineHeightControl /> );
		const input = screen.getByRole( 'spinbutton' );
		await user.click( screen.getByRole( 'button', { name: 'Decrement' } ) );
		expect( input ).toHaveValue( BASE_DEFAULT_VALUE - SPIN );
	} );
} );
