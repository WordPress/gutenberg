/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import _Picker from '..';
import type { FocalPointPickerProps } from '../types';

type Log = { name: string; args: unknown[] };
type EventLogger = ( name: string, args: unknown[] ) => void;

const Picker = ( props: React.ComponentProps< typeof _Picker > ) => {
	return <_Picker { ...props } __nextHasNoMarginBottom />;
};

const props: FocalPointPickerProps = {
	onChange: jest.fn(),
	url: 'test-url',
	value: {
		x: 0,
		y: 0,
	},
};

describe( 'FocalPointPicker', () => {
	describe( 'focus and blur', () => {
		it( 'clicking the draggable area should focus it', async () => {
			const user = userEvent.setup();

			const mockOnChange = jest.fn();

			render( <Picker { ...props } onChange={ mockOnChange } /> );

			const draggableArea = screen.getByRole( 'button' );

			await user.click( draggableArea );

			expect( draggableArea ).toHaveFocus();
		} );

		it( 'should stop a drag operation when focus is lost', () => {
			const mockOnDrag = jest.fn();
			const mockOnDragEnd = jest.fn();
			const mockOnChange = jest.fn();

			render(
				<Picker
					{ ...props }
					onChange={ mockOnChange }
					onDrag={ mockOnDrag }
					onDragEnd={ mockOnDragEnd }
				/>
			);

			const draggableArea = screen.getByRole( 'button' );

			// `user-event` is not capable of testing drag interactions properly.
			// we could consider using playwright instead.
			fireEvent.mouseDown( draggableArea );

			expect( mockOnDrag ).not.toHaveBeenCalled();
			expect( mockOnDragEnd ).not.toHaveBeenCalled();

			fireEvent.blur( draggableArea );
			fireEvent.mouseMove( draggableArea );

			expect( mockOnDrag ).not.toHaveBeenCalled();
			expect( mockOnDragEnd ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'drag gestures', () => {
		it( 'should call onDragStart, onDrag, onDragEnd and onChange in that order', () => {
			const logs: Log[] = [];
			const eventLogger: EventLogger = ( name, args ) =>
				logs.push( { name, args } );
			const events = [ 'onDragStart', 'onDrag', 'onDragEnd', 'onChange' ];
			const handlers: { [ key: string ]: EventLogger } = {};
			events.forEach( ( name ) => {
				handlers[ name ] = ( ...all ) => eventLogger( name, all );
			} );

			render( <Picker { ...props } { ...handlers } /> );

			const dragArea = screen.getByRole( 'button' );

			// `user-event` is not capable of testing drag interactions properly.
			// we could consider using playwright instead.
			fireEvent.mouseDown( dragArea );
			fireEvent.mouseMove( dragArea );
			fireEvent.mouseUp( dragArea );

			expect(
				events.reduce( ( last, eventName, index ) => {
					return last && logs[ index ].name === eventName;
				}, true )
			).toBe( true );
		} );
	} );

	describe( 'resolvePoint handling', () => {
		it( 'should allow value altering', async () => {
			const user = userEvent.setup();

			const spyChange = jest.fn();
			const spy = jest.fn();

			render(
				<Picker
					{ ...props }
					value={ { x: 0.25, y: 0.25 } }
					onChange={ spyChange }
					resolvePoint={ () => {
						spy();
						return { x: 0.91, y: 0.42 };
					} }
				/>
			);

			// Click and press arrow up
			const dragArea = screen.getByRole( 'button' );

			await user.click( dragArea );
			await user.keyboard( '[ArrowUp]' );

			expect( spy ).toHaveBeenCalled();
			expect( spyChange ).toHaveBeenLastCalledWith( {
				x: 0.91,
				y: 0.42,
			} );
		} );
	} );

	describe( 'controllability', () => {
		it( 'should update value from props', () => {
			const { rerender } = render(
				<Picker { ...props } value={ { x: 0.25, y: 0.5 } } />
			);
			const xInput = screen.getByRole( 'spinbutton', {
				name: 'Focal point left position',
			} ) as HTMLButtonElement;
			rerender( <Picker { ...props } value={ { x: 0.93, y: 0.5 } } /> );
			expect( xInput.value ).toBe( '93' );
		} );
		it( 'call onChange with the expected values', async () => {
			const user = userEvent.setup();

			const spyChange = jest.fn();
			render(
				<Picker
					{ ...props }
					value={ { x: 0.14, y: 0.62 } }
					onChange={ spyChange }
				/>
			);
			// Focus and press arrow up
			const dragArea = screen.getByRole( 'button' );

			await user.click( dragArea );
			await user.keyboard( '[ArrowDown]' );

			expect( spyChange ).toHaveBeenLastCalledWith( {
				x: 0.14,
				y: 0.63,
			} );
		} );
	} );

	describe( 'value handling', () => {
		it( 'should handle legacy string values', () => {
			const onChangeSpy = jest.fn();
			render(
				<Picker
					{ ...props }
					value={ {
						x: '0.1' as unknown as number,
						y: '0.2' as unknown as number,
					} }
					onChange={ onChangeSpy }
				/>
			);
			expect(
				(
					screen.getByRole( 'spinbutton', {
						name: 'Focal point left position',
					} ) as HTMLButtonElement
				 ).value
			).toBe( '10' );
			expect(
				(
					screen.getByRole( 'spinbutton', {
						name: 'Focal point top position',
					} ) as HTMLButtonElement
				 ).value
			).toBe( '20' );
			expect( onChangeSpy ).not.toHaveBeenCalled();
		} );
	} );
} );
