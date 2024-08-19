/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BaseCheckboxControl from '..';
import type { CheckboxControlProps } from '../types';

function createContainer() {
	const container = document.createElement( 'div' );
	document.body.appendChild( container );
	return container;
}

const noop = () => {};

const getInput = () => screen.getByRole( 'checkbox' ) as HTMLInputElement;

const CheckboxControl = ( props: Omit< CheckboxControlProps, 'onChange' > ) => {
	return (
		<BaseCheckboxControl
			onChange={ noop }
			{ ...props }
			__nextHasNoMarginBottom
		/>
	);
};

const ControlledCheckboxControl = ( { onChange }: CheckboxControlProps ) => {
	const [ isChecked, setChecked ] = useState( false );
	return (
		<BaseCheckboxControl
			__nextHasNoMarginBottom
			checked={ isChecked }
			onChange={ ( value ) => {
				setChecked( value );
				onChange( value );
			} }
		/>
	);
};

describe( 'CheckboxControl', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', async () => {
			await render( <CheckboxControl /> );
			expect( getInput() ).not.toBeNull();
		} );

		it( 'should render an unchecked `checkbox` by default', async () => {
			await render( <CheckboxControl /> );
			expect( getInput() ).toHaveProperty( 'checked', false );
		} );

		it( 'should render an checked `checkbox` when `checked={ true }`', async () => {
			await render( <CheckboxControl checked /> );
			expect( getInput() ).toHaveProperty( 'checked', true );
		} );

		it( 'should render label', async () => {
			await render( <CheckboxControl label="Hello" /> );

			const label = screen.getByText( 'Hello' );
			expect( label ).toBeInTheDocument();
		} );

		it( 'should not render label element if label is not set', async () => {
			await render( <CheckboxControl /> );

			const label = screen.queryByRole( 'label' );
			expect( label ).not.toBeInTheDocument();
		} );

		it( 'should render a checkbox in an indeterminate state', async () => {
			await render( <CheckboxControl indeterminate /> );
			expect( getInput() ).toHaveProperty( 'indeterminate', true );
		} );

		it( 'should render the indeterminate icon when in the indeterminate state', async () => {
			const containerDefault = createContainer();
			await render( <CheckboxControl />, {
				container: containerDefault,
			} );

			const containerIndeterminate = createContainer();
			await render( <CheckboxControl indeterminate />, {
				container: containerIndeterminate,
			} );

			// Expect the diff snapshot to be mostly about the indeterminate icon
			expect( containerDefault ).toMatchDiffSnapshot(
				containerIndeterminate
			);
		} );

		it( 'should associate the `help` text accessibly', async () => {
			await render( <CheckboxControl help="Help text" /> );
			expect( getInput() ).toHaveAccessibleDescription( 'Help text' );
		} );
	} );

	describe( 'Value', () => {
		it( 'should flip the checked property when clicked', async () => {
			const user = userEvent.setup();

			let state = false;
			const setState = jest.fn(
				( nextState: boolean ) => ( state = nextState )
			);

			await render( <ControlledCheckboxControl onChange={ setState } /> );

			const input = getInput();

			await user.click( input );
			expect( input ).toHaveProperty( 'checked', true );
			expect( state ).toBe( true );

			await user.click( input );
			expect( input ).toHaveProperty( 'checked', false );
			expect( state ).toBe( false );

			expect( setState ).toHaveBeenCalledTimes( 2 );
		} );
	} );
} );
