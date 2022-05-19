/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';
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

const getInput = () => screen.getByTestId( 'checkbox' );

const CheckboxControl = ( props: Omit< CheckboxControlProps, 'onChange' > ) => {
	return (
		<BaseCheckboxControl
			onChange={ noop }
			{ ...props }
			data-testid="checkbox"
		/>
	);
};

const ControlledCheckboxControl = () => {
	const [ isChecked, setChecked ] = useState( false );
	return (
		<BaseCheckboxControl
			checked={ isChecked }
			onChange={ setChecked }
			data-testid="checkbox"
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
		it( 'should flip the checked property when clicked', () => {
			render( <ControlledCheckboxControl /> );
			expect( getInput() ).toHaveProperty( 'checked', false );

			fireEvent.click( getInput() );
			expect( getInput() ).toHaveProperty( 'checked', true );

			fireEvent.click( getInput() );
			expect( getInput() ).toHaveProperty( 'checked', false );
		} );
	} );
} );
