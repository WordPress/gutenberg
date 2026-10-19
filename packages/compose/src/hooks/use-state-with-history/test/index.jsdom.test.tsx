import { describe, expect, expectTypeOf, it } from 'vitest';
import {
	screen,
	render,
	fireEvent,
	renderHook,
	act,
} from '@testing-library/react';
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
	it( 'preserves the number value type through undo and redo', () => {
		const { result } = renderHook( () => useStateWithHistory( 0 ) );

		expectTypeOf( result.current.value ).toEqualTypeOf< number >();
		expectTypeOf( result.current.setValue ).parameters.toEqualTypeOf<
			[ number, boolean? ]
		>();
		expect( result.current.value ).toBe( 0 );

		act( () => result.current.setValue( 1 ) );
		expect( result.current.value ).toBe( 1 );

		act( () => result.current.undo() );
		expect( result.current.value ).toBe( 0 );

		act( () => result.current.redo() );
		expect( result.current.value ).toBe( 1 );
	} );

	it( 'preserves the object value type through undo and redo', () => {
		const initialValue = { count: 0 };
		const nextValue = { count: 1 };
		const { result } = renderHook( () =>
			useStateWithHistory( initialValue )
		);

		expectTypeOf( result.current.value ).toEqualTypeOf<
			typeof initialValue
		>();
		expectTypeOf( result.current.setValue ).parameters.toEqualTypeOf<
			[ typeof initialValue, boolean? ]
		>();
		expect( result.current.value ).toBe( initialValue );

		act( () => result.current.setValue( nextValue ) );
		expect( result.current.value ).toBe( nextValue );

		act( () => result.current.undo() );
		expect( result.current.value ).toBe( initialValue );

		act( () => result.current.redo() );
		expect( result.current.value ).toBe( nextValue );
	} );

	it( 'supports explicit staging flags', () => {
		const { result } = renderHook( () => useStateWithHistory( 'foo' ) );

		expectTypeOf( result.current.value ).toEqualTypeOf< string >();
		act( () => result.current.setValue( 'bar', false ) );
		act( () => result.current.setValue( 'baz', true ) );
		expect( result.current.value ).toBe( 'baz' );

		act( () => result.current.undo() );
		expect( result.current.value ).toBe( 'foo' );

		act( () => result.current.redo() );
		expect( result.current.value ).toBe( 'baz' );
	} );

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
