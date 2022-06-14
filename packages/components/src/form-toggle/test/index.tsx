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
import FormToggle, { noop } from '..';
import type { FormToggleProps } from '../types';

const getInput = () => screen.getByRole( 'checkbox' ) as HTMLInputElement;

const ControlledFormToggle = ( { onChange }: FormToggleProps ) => {
	const [ isChecked, setChecked ] = useState( false );
	return (
		<FormToggle
			checked={ isChecked }
			onChange={ ( value ) => {
				setChecked( ( state ) => ! state );
				onChange( value );
			} }
		/>
	);
};

describe( 'FormToggle', () => {
	describe( 'basic rendering', () => {
		it( 'should render', () => {
			render( <FormToggle onChange={ noop } /> );
			expect( getInput() ).not.toBeNull();
		} );

		it( 'should render a span element with an unchecked checkbox', () => {
			const { container } = render( <FormToggle onChange={ noop } /> );

			expect( getInput() ).toHaveProperty( 'checked', false );
			expect( container.firstChild ).toMatchSnapshot();
		} );

		it( 'should render a checked checkbox and change the accessibility text to On when providing checked prop', () => {
			render( <FormToggle onChange={ noop } checked /> );

			expect( getInput() ).toHaveProperty( 'checked', true );
		} );

		it( 'should render with an additional className', () => {
			const { container: containerDefault } = render(
				<FormToggle onChange={ noop } />
			);

			const { container: containerWithClassName } = render(
				<FormToggle onChange={ noop } className="testing" />
			);

			// Expect the diff snapshot to be mostly about the className.
			expect( containerDefault ).toMatchDiffSnapshot(
				containerWithClassName
			);
		} );

		it( 'should render an id prop for the input checkbox', () => {
			const { container: containerDefault } = render(
				<FormToggle onChange={ noop } />
			);

			const { container: containerWithID } = render(
				// Disabled because of our rule restricting literal IDs, preferring
				// `withInstanceId`. In this case, it's fine to use literal IDs.
				// eslint-disable-next-line no-restricted-syntax
				<FormToggle onChange={ noop } id="test" />
			);

			// Expect the diff snapshot to be mostly about the ID.
			expect( containerDefault ).toMatchDiffSnapshot( containerWithID );
		} );
	} );

	describe( 'Value', () => {
		it( 'should flip the checked property when clicked', async () => {
			const user = userEvent.setup( {
				advanceTimers: jest.advanceTimersByTime,
			} );

			let state = false;
			const setState = jest.fn( () => ( state = ! state ) );

			render( <ControlledFormToggle onChange={ setState } /> );

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
