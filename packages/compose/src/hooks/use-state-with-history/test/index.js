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

const AmendTestComponent = () => {
	const { value, setValue, amendValue, hasUndo, undo, redo } =
		useStateWithHistory( { text: 'foo', cursor: 0 } );

	return (
		<div>
			<span data-testid="text">{ value.text }</span>
			<span data-testid="cursor">{ value.cursor }</span>
			<button
				className="change"
				onClick={ () =>
					setValue( { text: 'bar', cursor: value.cursor }, false )
				}
			>
				Change
			</button>
			<button
				className="amend"
				onClick={ () => amendValue( { ...value, cursor: 5 } ) }
			>
				Amend
			</button>
			<button className="undo" onClick={ undo } disabled={ ! hasUndo }>
				Undo
			</button>
			<button className="redo" onClick={ redo }>
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

	it( 'should amend the latest undo entry', () => {
		render( <AmendTestComponent /> );

		expect( screen.getByTestId( 'text' ) ).toHaveTextContent( 'foo' );
		expect( screen.getByTestId( 'cursor' ) ).toHaveTextContent( '0' );

		// Make a persistent change.
		fireEvent.click( screen.getByText( 'Change' ) );
		expect( screen.getByTestId( 'text' ) ).toHaveTextContent( 'bar' );
		expect( screen.getByTestId( 'cursor' ) ).toHaveTextContent( '0' );

		// Amend cursor into the same undo entry.
		fireEvent.click( screen.getByText( 'Amend' ) );
		expect( screen.getByTestId( 'text' ) ).toHaveTextContent( 'bar' );
		expect( screen.getByTestId( 'cursor' ) ).toHaveTextContent( '5' );

		// Undo should restore both text and cursor together.
		fireEvent.click( screen.getByText( 'Undo' ) );
		expect( screen.getByTestId( 'text' ) ).toHaveTextContent( 'foo' );
		expect( screen.getByTestId( 'cursor' ) ).toHaveTextContent( '0' );

		// Redo should restore both text and cursor together.
		fireEvent.click( screen.getByText( 'Redo' ) );
		expect( screen.getByTestId( 'text' ) ).toHaveTextContent( 'bar' );
		expect( screen.getByTestId( 'cursor' ) ).toHaveTextContent( '5' );
	} );
} );
