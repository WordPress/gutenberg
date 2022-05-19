/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { useControlledValue } from '../use-controlled-value';

function Input( props ) {
	const [ value, setValue ] = useControlledValue( props );
	return (
		<input
			value={ value }
			onChange={ ( event ) => setValue( event.target.value ) }
		/>
	);
}

function getInput() {
	return screen.getByRole( 'textbox' );
}

describe( 'useControlledValue', () => {
	it( 'should use the default value', () => {
		render( <Input defaultValue="WordPress.org" /> );
		expect( getInput() ).toHaveValue( 'WordPress.org' );
	} );

	it( 'should use the default value then switch to the controlled value', () => {
		const { rerender } = render( <Input defaultValue="WordPress.org" /> );
		expect( getInput() ).toHaveValue( 'WordPress.org' );

		rerender(
			<Input defaultValue="WordPress.org" value="Code is Poetry" />
		);
		expect( getInput() ).toHaveValue( 'Code is Poetry' );
	} );

	it( 'should call onChange only when there is no value being passed in', () => {
		const onChange = jest.fn();
		render( <Input defaultValue="WordPress.org" onChange={ onChange } /> );

		expect( getInput() ).toHaveValue( 'WordPress.org' );

		fireEvent.change( getInput(), { target: { value: 'Code is Poetry' } } );

		expect( getInput() ).toHaveValue( 'Code is Poetry' );
		expect( onChange ).toHaveBeenCalledWith( 'Code is Poetry' );
	} );

	it( 'should call onChange when there is a value passed in', () => {
		const onChange = jest.fn();
		const { rerender } = render(
			<Input
				defaultValue="WordPress.org"
				value="Code is Poetry"
				onChange={ onChange }
			/>
		);

		expect( getInput() ).toHaveValue( 'Code is Poetry' );

		fireEvent.change( getInput(), {
			target: { value: 'WordPress rocks!' },
		} );

		rerender(
			<Input
				defaultValue="WordPress.org"
				value="WordPress rocks!"
				onChange={ onChange }
			/>
		);

		expect( getInput() ).toHaveValue( 'WordPress rocks!' );
		expect( onChange ).toHaveBeenCalledWith( 'WordPress rocks!' );
	} );

	it( 'should not maintain internal state if no onChange is passed but a value is passed', () => {
		const { rerender } = render( <Input value="Code is Poetry" /> );

		expect( getInput() ).toHaveValue( 'Code is Poetry' );

		// Primarily this proves that the hook doesn't break if no onChange is passed but
		// value turns into a controlled state, for example if the value needs to be set
		// to a constant in certain conditions but no change listening needs to happen.
		fireEvent.change( getInput(), { target: { value: 'WordPress.org' } } );

		// If `value` is passed then we expect the value to be fully controlled
		// meaning that the value passed in will always be used even though
		// we're managing internal state.
		expect( getInput() ).toHaveValue( 'Code is Poetry' );

		// Next we un-set the value to uncover the internal state which was still maintained.
		rerender( <Input /> );

		expect( getInput() ).toHaveValue( 'WordPress.org' );
	} );
} );
