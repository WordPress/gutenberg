/**
 * External dependencies
 */
import { screen, render, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useStateWithHistory from '../';

const TestComponent = () => {
	const { value, setValue, hasUndo, hasRedo, undo, redo } =
		useStateWithHistory( 'foo' );

	return (
		<div>
			<input
				value={ value }
				onChange={ ( event ) => setValue( event.target.value ) }
			/>
			<button className="undo" onClick={ undo } disabled={ ! hasUndo }>
				Undo
			</button>
			<button className="redo" onClick={ redo } disabled={ ! hasRedo }>
				Redo
			</button>
		</div>
	);
};

describe( 'useStateWithHistory', () => {
	it( 'should allow undo/redo', async () => {
		render( <TestComponent /> );
		const input = screen.getByRole( 'textbox' );
		expect( input ).toHaveValue( 'foo' );
		const buttonUndo = screen.getByRole( 'button', { name: 'Undo' } );
		const buttonRedo = screen.getByRole( 'button', { name: 'Redo' } );
		expect( buttonUndo ).toBeDisabled();
		expect( buttonRedo ).toBeDisabled();

		// Make a change
		fireEvent.change( input, { target: { value: 'bar' } } );
		expect( input ).toHaveValue( 'bar' );
		expect( buttonUndo ).toBeEnabled();
		expect( buttonRedo ).toBeDisabled();

		// Undo the change
		fireEvent.click( buttonUndo );
		expect( input ).toHaveValue( 'foo' );
		expect( buttonUndo ).toBeDisabled();
		expect( buttonRedo ).toBeEnabled();

		// Redo the change
		fireEvent.click( buttonRedo );
		expect( input ).toHaveValue( 'bar' );
		expect( buttonUndo ).toBeEnabled();
		expect( buttonRedo ).toBeDisabled();
	} );
} );
