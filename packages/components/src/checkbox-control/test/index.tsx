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
import BaseCheckboxControl from '..';
import type { CheckboxControlProps } from '../types';

const noop = () => {};

const getInput = () => screen.getByRole( 'checkbox' ) as HTMLInputElement;

const CheckboxControl = ( props: Omit< CheckboxControlProps, 'onChange' > ) => {
	return <BaseCheckboxControl onChange={ noop } { ...props } />;
};

const ControlledCheckboxControl = ( { onChange }: CheckboxControlProps ) => {
	const [ isChecked, setChecked ] = useState( false );
	return (
		<BaseCheckboxControl
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
		it( 'should render', () => {
			render( <CheckboxControl /> );
			expect( getInput() ).not.toBeNull();
		} );

		it( 'should render an unchecked `checkbox` by default', () => {
			render( <CheckboxControl /> );
			expect( getInput() ).toHaveProperty( 'checked', false );
		} );

		it( 'should render an checked `checkbox` when `checked={ true }`', () => {
			render( <CheckboxControl checked /> );
			expect( getInput() ).toHaveProperty( 'checked', true );
		} );

		it( 'should render label', () => {
			render( <CheckboxControl label="Hello" /> );

			const label = screen.getByText( 'Hello' );
			expect( label ).toBeInTheDocument();
		} );

		it( 'should not render label element if label is not set', () => {
			render( <CheckboxControl /> );

			const label = screen.queryByRole( 'label' );
			expect( label ).not.toBeInTheDocument();
		} );

		it( 'should render a checkbox in an indeterminate state', () => {
			render( <CheckboxControl indeterminate /> );
			expect( getInput() ).toHaveProperty( 'indeterminate', true );
		} );

		it( 'should render the indeterminate icon when in the indeterminate state', () => {
			const { container: containerDefault } = render(
				<CheckboxControl />
			);

			const { container: containerIndeterminate } = render(
				<CheckboxControl indeterminate />
			);

			// Expect the diff snapshot to be mostly about the indeterminate icon
			expect( containerDefault ).toMatchDiffSnapshot(
				containerIndeterminate
			);
		} );

		it( 'should associate the `help` text accessibly', () => {
			render( <CheckboxControl help="Help text" /> );
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

			render( <ControlledCheckboxControl onChange={ setState } /> );

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
