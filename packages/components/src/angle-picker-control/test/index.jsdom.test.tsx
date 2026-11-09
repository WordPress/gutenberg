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

function dragAngleCircle( container: HTMLElement, clientX: number ) {
	// eslint-disable-next-line testing-library/no-node-access
	const circle = container.querySelector(
		'.components-angle-picker-control__angle-circle'
	) as HTMLElement;
	fireEvent.mouseDown( circle, { clientX, clientY: 0 } );
	fireEvent.mouseUp( circle, { clientX, clientY: 0 } );
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
		dragAngleCircle( container, -10 );

		expect( onChange ).toHaveBeenLastCalledWith( -90 );
	} );

	it( 'reports dial angles unchanged with the default range', () => {
		const onChange = vi.fn();
		const { container } = render(
			<AnglePickerControl value={ 0 } onChange={ onChange } />
		);

		dragAngleCircle( container, -10 );

		expect( onChange ).toHaveBeenLastCalledWith( 270 );
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
} );
