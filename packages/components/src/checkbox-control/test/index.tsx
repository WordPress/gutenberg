/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BaseCheckboxControl from '..';
import type { CheckboxControlProps } from '../types';

const getInput = () => screen.getByRole( 'checkbox' ) as HTMLInputElement;

const CheckboxControl = ( props: Omit< CheckboxControlProps, 'onChange' > ) => {
	return (
		<BaseCheckboxControl
			onChange={ noop }
			{ ...props }
		/>
	);
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
			expect( label ).toBeTruthy();
		} );

		it( 'should render an indeterminate icon', () => {
			const { container } = render( <CheckboxControl indeterminate /> );

			const indeterminateIcon = container.getElementsByClassName(
				'components-checkbox-control__indeterminate'
			);
			expect( indeterminateIcon.length ).toBe( 1 );
		} );
	} );

	describe( 'Value', () => {
		it( 'should flip the checked property when clicked', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

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
