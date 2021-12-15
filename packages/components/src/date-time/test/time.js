/**
 * External dependencies
 */
import { render, fireEvent, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import TimePicker from '../time';

describe( 'TimePicker', () => {
	it( 'should call onChange with updated date values', () => {
		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T11:00:00"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const monthInput = screen.getByLabelText( 'Month' );
		const dayInput = screen.getByLabelText( 'Day' );
		const yearInput = screen.getByLabelText( 'Year' );
		const hoursInput = screen.getByLabelText( 'Hours' );
		const minutesInput = screen.getByLabelText( 'Minutes' );

		fireEvent.change( monthInput, { target: { value: '12' } } );
		fireEvent.blur( monthInput );

		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-12-18T11:00:00' );
		onChangeSpy.mockClear();

		fireEvent.change( dayInput, { target: { value: '22' } } );
		fireEvent.blur( dayInput );

		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-12-22T11:00:00' );
		onChangeSpy.mockClear();

		fireEvent.change( yearInput, { target: { value: '2018' } } );
		fireEvent.blur( yearInput );

		expect( onChangeSpy ).toHaveBeenCalledWith( '2018-12-22T11:00:00' );
		onChangeSpy.mockClear();

		fireEvent.change( hoursInput, { target: { value: '12' } } );
		fireEvent.blur( hoursInput );

		expect( onChangeSpy ).toHaveBeenCalledWith( '2018-12-22T00:00:00' );
		onChangeSpy.mockClear();

		fireEvent.change( minutesInput, { target: { value: '35' } } );
		fireEvent.blur( minutesInput );

		expect( onChangeSpy ).toHaveBeenCalledWith( '2018-12-22T00:35:00' );
		onChangeSpy.mockClear();
	} );

	it( 'should call onChange with an updated hour (12-hour clock)', () => {
		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T11:00:00"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const hoursInput = screen.getByLabelText( 'Hours' );

		fireEvent.change( hoursInput, { target: { value: '10' } } );
		fireEvent.blur( hoursInput );

		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T10:00:00' );
	} );

	it( 'should not call onChange with an updated hour (12-hour clock) if the hour is out of bounds', () => {
		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T11:00:00"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const hoursInput = screen.getByLabelText( 'Hours' );

		fireEvent.change( hoursInput, { target: { value: '22' } } );
		fireEvent.blur( hoursInput );

		expect( onChangeSpy ).not.toHaveBeenCalled();
	} );

	it( 'should call onChange with an updated hour (24-hour clock)', () => {
		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T11:00:00"
				onChange={ onChangeSpy }
				is12Hour={ false }
			/>
		);

		const hoursInput = screen.getByLabelText( 'Hours' );

		fireEvent.change( hoursInput, { target: { value: '22' } } );
		fireEvent.blur( hoursInput );

		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T22:00:00' );
	} );

	it( 'should not call onChange with an updated minute if out of bounds', () => {
		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T11:00:00"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const minutesInput = screen.getByLabelText( 'Minutes' );

		fireEvent.change( minutesInput, { target: { value: '99' } } );
		fireEvent.blur( minutesInput );

		expect( onChangeSpy ).not.toHaveBeenCalled();
	} );

	it( 'should switch to PM correctly', () => {
		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T11:00:00"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const pmButton = screen.getByText( 'PM' );

		fireEvent.click( pmButton );

		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T23:00:00' );
	} );

	it( 'should switch to AM correctly', () => {
		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T23:00:00"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const amButton = screen.getByText( 'AM' );

		fireEvent.click( amButton );

		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T11:00:00' );
	} );

	it( 'should allow to set the time correctly when the PM period is selected', () => {
		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T11:00:00"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const pmButton = screen.getByText( 'PM' );
		fireEvent.click( pmButton );

		const hoursInput = screen.getByLabelText( 'Hours' );
		fireEvent.change( hoursInput, { target: { value: '6' } } );
		fireEvent.blur( hoursInput );

		// When clicking on 'PM', we expect the time to be 11pm
		expect( onChangeSpy ).toHaveBeenNthCalledWith(
			1,
			'1986-10-18T23:00:00'
		);
		// When changing the hours to '6', we expect the time to be 6pm
		expect( onChangeSpy ).toHaveBeenNthCalledWith(
			2,
			'1986-10-18T18:00:00'
		);
	} );

	it( 'should truncate at the minutes on change', () => {
		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T23:12:35"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const minutesInput = screen.getByLabelText( 'Minutes' );

		fireEvent.change( minutesInput, { target: { value: '22' } } );
		fireEvent.blur( minutesInput );

		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T23:22:00' );
	} );

	it( 'should reset the date when currentTime changed', () => {
		const onChangeSpy = jest.fn();

		const { rerender } = render(
			<TimePicker
				currentTime="1986-10-18T11:00:00"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		rerender(
			<TimePicker
				currentTime="2020-07-13T18:00:00"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		expect( screen.getByLabelText( 'Month' ).value ).toBe( '07' );
		expect( screen.getByLabelText( 'Day' ).value ).toBe( '13' );
		expect( screen.getByLabelText( 'Year' ).value ).toBe( '2020' );
		expect( screen.getByLabelText( 'Hours' ).value ).toBe( '06' );
		expect( screen.getByLabelText( 'Minutes' ).value ).toBe( '00' );
		/**
		 * This is not ideal, but best of we can do for now until we refactor
		 * AM/PM into accessible elements, like radio buttons.
		 */
		expect(
			screen.getByText( 'AM' ).classList.contains( 'is-primary' )
		).toBe( false );
		expect(
			screen.getByText( 'PM' ).classList.contains( 'is-primary' )
		).toBe( true );
	} );

	it( 'should have different layouts/orders for 12/24 hour formats', () => {
		const onChangeSpy = jest.fn();

		const { rerender } = render(
			<form aria-label="form">
				<TimePicker
					currentTime="1986-10-18T11:00:00"
					onChange={ onChangeSpy }
					is12Hour={ false }
				/>
			</form>
		);

		const form = screen.getByRole( 'form' );

		let monthInputIndex = [].indexOf.call(
			form.elements,
			screen.getByLabelText( 'Month' )
		);
		let dayInputIndex = [].indexOf.call(
			form.elements,
			screen.getByLabelText( 'Day' )
		);

		expect( monthInputIndex < dayInputIndex ).toBe( true );

		rerender(
			<form aria-label="form">
				<TimePicker
					currentTime="1986-10-18T11:00:00"
					onChange={ onChangeSpy }
					is12Hour
				/>
			</form>
		);

		monthInputIndex = [].indexOf.call(
			form.elements,
			screen.getByLabelText( 'Month' )
		);
		dayInputIndex = [].indexOf.call(
			form.elements,
			screen.getByLabelText( 'Day' )
		);

		expect( monthInputIndex > dayInputIndex ).toBe( true );
	} );

	it( 'Should set a time when passed a null currentTime', () => {
		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime={ null }
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const monthInput = screen.getByLabelText( 'Month' ).value;
		const dayInput = screen.getByLabelText( 'Day' ).value;
		const yearInput = screen.getByLabelText( 'Year' ).value;
		const hoursInput = screen.getByLabelText( 'Hours' ).value;
		const minutesInput = screen.getByLabelText( 'Minutes' ).value;

		expect( Number.isNaN( parseInt( monthInput, 10 ) ) ).toBe( false );
		expect( Number.isNaN( parseInt( dayInput, 10 ) ) ).toBe( false );
		expect( Number.isNaN( parseInt( yearInput, 10 ) ) ).toBe( false );
		expect( Number.isNaN( parseInt( hoursInput, 10 ) ) ).toBe( false );
		expect( Number.isNaN( parseInt( minutesInput, 10 ) ) ).toBe( false );
	} );
} );
