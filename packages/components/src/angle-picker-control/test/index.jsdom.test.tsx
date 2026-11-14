import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from '@wordpress/element';
import AnglePickerControl, { PrivateAnglePickerControl } from '..';
import type { PrivateAnglePickerControlProps } from '../types';

function StatefulPrivateAnglePickerControl( {
	onChange,
	...props
}: PrivateAnglePickerControlProps ) {
	const [ value, setValue ] = useState( props.value );

	return (
		<PrivateAnglePickerControl
			{ ...props }
			value={ value }
			onChange={ ( newValue ) => {
				setValue( newValue );
				onChange( newValue );
			} }
		/>
	);
}

function clickDial( container: HTMLElement, clientX: number ) {
	const dial = getDial( container );
	fireEvent.mouseDown( dial, { clientX, clientY: 0 } );
	fireEvent.mouseUp( dial, { clientX, clientY: 0 } );
}

function getDial( container: HTMLElement ) {
	return container.querySelector(
		'.components-angle-picker-control__angle-circle'
	) as HTMLElement;
}

function getIndicator( container: HTMLElement ) {
	return container.querySelector(
		'.components-angle-picker-control__angle-circle-indicator'
	);
}

// jsdom gives the dial a zero-size box, so its center is at 0, 0.
function pointAt( angle: number ) {
	const radians = ( angle * Math.PI ) / 180;
	return {
		clientX: Math.sin( radians ) * 100,
		clientY: -Math.cos( radians ) * 100,
	};
}

function turnDial( container: HTMLElement, angles: number[] ) {
	const dial = getDial( container );
	const [ first, ...rest ] = angles;
	fireEvent.mouseDown( dial, pointAt( first ) );
	rest.forEach( ( angle ) => {
		fireEvent.mouseMove( dial, pointAt( angle ) );
	} );
	fireEvent.mouseUp( dial, pointAt( angles[ angles.length - 1 ] ) );
}

function reportedValues( onChange: ReturnType< typeof vi.fn > ) {
	return onChange.mock.calls.map( ( [ value ] ) => value );
}

describe( 'AnglePickerControl', () => {
	it( 'limits the input to 0 to 360 by default', () => {
		render( <AnglePickerControl value={ 0 } onChange={ vi.fn() } /> );

		const input = screen.getByRole( 'spinbutton', { name: 'Angle' } );
		expect( input ).toHaveAttribute( 'min', '0' );
		expect( input ).toHaveAttribute( 'max', '360' );
	} );

	it( 'reports 0 when the input is cleared by default', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render( <AnglePickerControl value={ 45 } onChange={ onChange } /> );

		await user.clear( screen.getByRole( 'spinbutton', { name: 'Angle' } ) );

		expect( onChange ).toHaveBeenLastCalledWith( 0 );
	} );

	it( 'accepts a custom range', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<StatefulPrivateAnglePickerControl
				value={ 0 }
				min={ -180 }
				max={ 180 }
				onChange={ onChange }
			/>
		);

		const input = screen.getByRole( 'spinbutton', { name: 'Angle' } );
		expect( input ).toHaveAttribute( 'min', '-180' );
		expect( input ).toHaveAttribute( 'max', '180' );

		await user.clear( input );
		await user.type( input, '-45' );
		await user.tab();

		expect( onChange ).toHaveBeenLastCalledWith( -45 );
		expect( input ).toHaveValue( -45 );
	} );

	it( 'does not change an in-range value on blur', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<AnglePickerControl
				value={ -9 }
				min={ -180 }
				max={ 180 }
				onChange={ onChange }
			/>
		);

		await user.click( screen.getByRole( 'spinbutton', { name: 'Angle' } ) );
		await user.tab();

		expect( onChange ).not.toHaveBeenCalled();
	} );

	it( 'maps a dial angle into a range below 0', () => {
		const onChange = vi.fn();
		const { container } = render(
			<AnglePickerControl
				value={ 0 }
				min={ -180 }
				max={ 180 }
				onChange={ onChange }
			/>
		);

		// Left of center is 270 degrees on the dial.
		clickDial( container, -10 );

		expect( onChange ).toHaveBeenLastCalledWith( -90 );
	} );

	it( 'reports dial angles unchanged with the default range', () => {
		const onChange = vi.fn();
		const { container } = render(
			<AnglePickerControl value={ 0 } onChange={ onChange } />
		);

		clickDial( container, -10 );

		expect( onChange ).toHaveBeenLastCalledWith( 270 );
	} );

	it( 'wraps from 359 to 0 with the default range', () => {
		const onChange = vi.fn();
		const { container } = render(
			<StatefulPrivateAnglePickerControl
				value={ 340 }
				onChange={ onChange }
			/>
		);

		turnDial( container, [ 340, 359, 10, 20 ] );

		expect( reportedValues( onChange ) ).toEqual( [
			340, 359, 10, 20, 20,
		] );
	} );

	it( 'stops at the top of a -180 to 180 range', () => {
		const onChange = vi.fn();
		const { container } = render(
			<StatefulPrivateAnglePickerControl
				value={ 170 }
				min={ -180 }
				max={ 180 }
				onChange={ onChange }
			/>
		);

		turnDial( container, [ 170, 190, 200 ] );
		expect( onChange ).toHaveBeenLastCalledWith( 180 );

		onChange.mockClear();
		turnDial( container, [ 180, 170, 160 ] );
		expect( onChange ).toHaveBeenLastCalledWith( 160 );
	} );

	it( 'stops at the bottom of a -180 to 180 range from below 0', () => {
		const onChange = vi.fn();
		const { container } = render(
			<StatefulPrivateAnglePickerControl
				value={ -170 }
				min={ -180 }
				max={ 180 }
				onChange={ onChange }
			/>
		);

		turnDial( container, [ 190, 170, 160 ] );

		expect( reportedValues( onChange ) ).toEqual( [
			-170, -180, -180, -180,
		] );
	} );

	it( 'keeps counting past a full turn in both directions', () => {
		const onChange = vi.fn();
		const { container } = render(
			<StatefulPrivateAnglePickerControl
				value={ 340 }
				min={ -360 }
				max={ 360 }
				onChange={ onChange }
			/>
		);

		turnDial( container, [ 340, 350, 0, 10 ] );
		expect( reportedValues( onChange ) ).toEqual( [
			340, 350, 360, 360, 360,
		] );

		onChange.mockClear();
		turnDial( container, [ 0, 330, 300 ] );
		expect( reportedValues( onChange ) ).toEqual( [ 360, 330, 300, 300 ] );
	} );

	it( 'turns below 0 and then more than a full turn clockwise', () => {
		const onChange = vi.fn();
		const { container } = render(
			<StatefulPrivateAnglePickerControl
				value={ 0 }
				min={ -720 }
				max={ 720 }
				onChange={ onChange }
			/>
		);

		turnDial( container, [ 0, 350, 340 ] );
		expect( onChange ).toHaveBeenLastCalledWith( -20 );

		onChange.mockClear();
		turnDial( container, [ 340, 90, 180, 270, 0, 10 ] );
		expect( onChange ).toHaveBeenLastCalledWith( 370 );
	} );

	it( 'points a click at the value closest to the current one', () => {
		const onChange = vi.fn();
		const { container } = render(
			<StatefulPrivateAnglePickerControl
				value={ -30 }
				min={ -360 }
				max={ 360 }
				onChange={ onChange }
			/>
		);

		turnDial( container, [ 300 ] );

		expect( reportedValues( onChange ) ).toEqual( [ -60, -60 ] );
	} );

	it( 'points a click from an out-of-range value at the nearest end', () => {
		const onChange = vi.fn();
		const { container } = render(
			<StatefulPrivateAnglePickerControl
				value={ 200 }
				min={ 0 }
				max={ 90 }
				onChange={ onChange }
			/>
		);

		turnDial( container, [ 10 ] );

		expect( reportedValues( onChange ) ).toEqual( [ 10, 10 ] );
	} );

	it( 'stops at min and max on a narrow range without jumping', () => {
		const onChange = vi.fn();
		const { container } = render(
			<StatefulPrivateAnglePickerControl
				value={ 80 }
				min={ 0 }
				max={ 90 }
				onChange={ onChange }
			/>
		);

		turnDial( container, [ 80, 100, 180, 270, 350, 270, 180, 100, 60 ] );
		expect( reportedValues( onChange ) ).toEqual( [
			80, 90, 90, 90, 90, 90, 90, 90, 60, 60,
		] );

		onChange.mockClear();
		turnDial( container, [ 60, 10, 340, 270, 180, 100 ] );
		expect( reportedValues( onChange ) ).toEqual( [
			60, 10, 0, 0, 0, 0, 0,
		] );
	} );
} );

describe( 'PrivateAnglePickerControl', () => {
	it( 'reports undefined when the input is cleared with allowEmpty', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(
			<StatefulPrivateAnglePickerControl
				allowEmpty
				value={ 45 }
				onChange={ onChange }
			/>
		);

		const input = screen.getByRole( 'spinbutton', { name: 'Angle' } );
		await user.clear( input );
		await user.tab();

		expect( onChange ).toHaveBeenLastCalledWith( undefined );
		expect( input ).toHaveValue( null );
	} );

	it( 'shows no dial indicator for an empty value with allowEmpty', () => {
		const { container, rerender } = render(
			<PrivateAnglePickerControl
				allowEmpty
				value={ undefined }
				onChange={ vi.fn() }
			/>
		);

		expect( getIndicator( container ) ).toBeNull();

		rerender(
			<PrivateAnglePickerControl
				allowEmpty
				value={ 0 }
				onChange={ vi.fn() }
			/>
		);
		expect( getIndicator( container ) ).not.toBeNull();
	} );
} );
