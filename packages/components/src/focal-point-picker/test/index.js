/**
 * External dependencies
 */
import { act, fireEvent, render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Picker from '../index.js';

describe( 'FocalPointPicker', () => {
	describe( 'focus and blur', () => {
		let firedDragEnd;
		let firedDrag;
		const { getByRole, unmount } = render(
			<Picker
				onChange={ () => {} }
				onDragEnd={ () => ( firedDragEnd = true ) }
				onDrag={ () => ( firedDrag = true ) }
			/>
		);
		const dragArea = getByRole( 'button' );
		fireEvent.mouseDown( dragArea );
		const gainedFocus = dragArea.ownerDocument.activeElement === dragArea;

		fireEvent.blur( dragArea );
		fireEvent.mouseMove( dragArea );

		// cleans up as it's not automated for renders outside of test blocks
		unmount();

		it( 'should focus the draggable area', () => {
			expect( gainedFocus ).toBe( true );
		} );

		it( 'should stop a drag operation when focus is lost', () => {
			expect( firedDragEnd && ! firedDrag ).toBe( true );
		} );
	} );

	describe( 'drag gestures', () => {
		it( 'should call onDragStart, onDrag, onDragEnd and onChange in that order', () => {
			const logs = [];
			const eventLogger = ( name, args ) => logs.push( { name, args } );
			const events = [ 'onDragStart', 'onDrag', 'onDragEnd', 'onChange' ];
			const handlers = {};
			events.forEach( ( name ) => {
				handlers[ name ] = ( ...all ) => eventLogger( name, all );
			} );
			const { getByRole } = render( <Picker { ...handlers } /> );
			const dragArea = getByRole( 'button' );
			act( () => {
				fireEvent.mouseDown( dragArea );
				fireEvent.mouseMove( dragArea );
				fireEvent.mouseUp( dragArea );
			} );
			expect(
				events.reduce( ( last, eventName, index ) => {
					return last && logs[ index ].name === eventName;
				}, true )
			).toBe( true );
		} );
	} );

	describe( 'resolvePoint handling', () => {
		it( 'should allow value altering', async () => {
			const spyChange = jest.fn();
			const spy = jest.fn();
			const { getByRole } = render(
				<Picker
					value={ { x: 0.25, y: 0.25 } }
					onChange={ spyChange }
					resolvePoint={ () => {
						spy();
						return { x: 0.91, y: 0.42 };
					} }
				/>
			);
			// Click and press arrow up
			const dragArea = getByRole( 'button' );
			act( () => {
				fireEvent.mouseDown( dragArea );
				fireEvent.keyDown( dragArea, { charCode: 0, keyCode: 38 } );
			} );
			expect( spy ).toHaveBeenCalled();
			expect( spyChange ).toHaveBeenCalledWith( {
				x: '0.91',
				y: '0.42',
			} );
		} );
	} );

	describe( 'controllability', () => {
		it( 'should update value from props', () => {
			const { rerender, getByRole } = render(
				<Picker value={ { x: 0.25, y: 0.5 } } />
			);
			const xInput = getByRole( 'spinbutton', { name: 'Left' } );
			rerender( <Picker value={ { x: 0.93, y: 0.5 } } /> );
			expect( xInput.value ).toBe( '93' );
		} );
		it( 'call onChange with the expected values', async () => {
			const spyChange = jest.fn();
			const { getByRole } = render(
				<Picker value={ { x: 0.14, y: 0.62 } } onChange={ spyChange } />
			);
			// Click and press arrow up
			const dragArea = getByRole( 'button' );
			act( () => {
				fireEvent.mouseDown( dragArea );
				fireEvent.keyDown( dragArea, { charCode: 0, keyCode: 38 } );
			} );
			expect( spyChange ).toHaveBeenCalledWith( {
				x: '0.14',
				y: '0.61',
			} );
		} );
	} );
} );
