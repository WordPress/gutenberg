/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import TimeInput from '..';

describe( 'TimePicker', () => {
	it( 'should call onChange with updated values | 24-hours format', async () => {
		const user = userEvent.setup();

		const onChangeSpy = jest.fn();

		render(
			<TimeInput hours={ 0 } minutes={ 0 } onChange={ onChangeSpy } />
		);

		const hoursInput = screen.getByRole( 'spinbutton', { name: 'Hours' } );
		const minutesInput = screen.getByRole( 'spinbutton', {
			name: 'Minutes',
		} );

		await user.clear( minutesInput );
		await user.type( minutesInput, '35' );
		await user.keyboard( '{Tab}' );

		expect( onChangeSpy ).toHaveBeenCalledWith( { hours: 0, minutes: 35 } );
		onChangeSpy.mockClear();

		await user.clear( hoursInput );
		await user.type( hoursInput, '12' );
		await user.keyboard( '{Tab}' );

		expect( onChangeSpy ).toHaveBeenCalledWith( {
			hours: 12,
			minutes: 35,
		} );
		onChangeSpy.mockClear();

		await user.clear( hoursInput );
		await user.type( hoursInput, '23' );
		await user.keyboard( '{Tab}' );

		expect( onChangeSpy ).toHaveBeenCalledWith( {
			hours: 23,
			minutes: 35,
		} );
		onChangeSpy.mockClear();

		await user.clear( minutesInput );
		await user.type( minutesInput, '0' );
		await user.keyboard( '{Tab}' );

		expect( onChangeSpy ).toHaveBeenCalledWith( { hours: 23, minutes: 0 } );
	} );

	it( 'should call onChange with updated values | 12-hours format', async () => {
		const user = userEvent.setup();

		const onChangeSpy = jest.fn();

		render(
			<TimeInput
				is12Hour
				hours={ 0 }
				minutes={ 0 }
				onChange={ onChangeSpy }
			/>
		);

		const hoursInput = screen.getByRole( 'spinbutton', { name: 'Hours' } );
		const minutesInput = screen.getByRole( 'spinbutton', {
			name: 'Minutes',
		} );
		const amButton = screen.getByRole( 'button', { name: 'AM' } );
		const pmButton = screen.getByRole( 'button', { name: 'PM' } );

		// TODO: Update assert these states through the accessibility tree rather than through styles, see: https://github.com/WordPress/gutenberg/issues/61163
		expect( amButton ).toHaveClass( 'is-primary' );
		expect( pmButton ).not.toHaveClass( 'is-primary' );
		expect( hoursInput ).not.toHaveValue( 0 );
		expect( hoursInput ).toHaveValue( 12 );

		await user.clear( minutesInput );
		await user.type( minutesInput, '35' );
		await user.keyboard( '{Tab}' );

		expect( onChangeSpy ).toHaveBeenCalledWith( { hours: 0, minutes: 35 } );
		expect( amButton ).toHaveClass( 'is-primary' );

		await user.clear( hoursInput );
		await user.type( hoursInput, '12' );
		await user.keyboard( '{Tab}' );

		expect( onChangeSpy ).toHaveBeenCalledWith( { hours: 0, minutes: 35 } );

		await user.click( pmButton );
		expect( onChangeSpy ).toHaveBeenCalledWith( {
			hours: 12,
			minutes: 35,
		} );
		expect( pmButton ).toHaveClass( 'is-primary' );
	} );

	it( 'should call onChange with defined minutes steps', async () => {
		const user = userEvent.setup();

		const onChangeSpy = jest.fn();

		render(
			<TimeInput
				hours={ 0 }
				minutes={ 0 }
				minutesProps={ { step: 5 } }
				onChange={ onChangeSpy }
			/>
		);

		const minutesInput = screen.getByRole( 'spinbutton', {
			name: 'Minutes',
		} );

		await user.clear( minutesInput );
		await user.keyboard( '{ArrowUp}' );

		expect( minutesInput ).toHaveValue( 5 );

		await user.keyboard( '{ArrowUp}' );
		await user.keyboard( '{ArrowUp}' );

		expect( minutesInput ).toHaveValue( 15 );

		await user.keyboard( '{ArrowDown}' );

		expect( minutesInput ).toHaveValue( 10 );

		await user.clear( minutesInput );
		await user.type( minutesInput, '44' );
		await user.keyboard( '{Tab}' );

		expect( minutesInput ).toHaveValue( 45 );

		await user.clear( minutesInput );
		await user.type( minutesInput, '51' );
		await user.keyboard( '{Tab}' );

		expect( minutesInput ).toHaveValue( 50 );
	} );
} );
