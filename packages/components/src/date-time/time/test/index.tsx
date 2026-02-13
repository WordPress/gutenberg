/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import timezoneMock from 'timezone-mock';

/**
 * WordPress dependencies
 */
import { getSettings, setSettings, type DateSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import TimePicker from '..';

describe( 'TimePicker', () => {
	it( 'should call onChange with updated date values', async () => {
		const user = userEvent.setup();

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

		await user.selectOptions( monthInput, '12' );
		await user.keyboard( '{Tab}' );

		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-12-18T11:00:00' );
		onChangeSpy.mockClear();

		await user.clear( dayInput );
		await user.type( dayInput, '22' );
		await user.keyboard( '{Tab}' );

		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-12-22T11:00:00' );
		onChangeSpy.mockClear();

		await user.clear( yearInput );
		await user.type( yearInput, '2018' );
		await user.keyboard( '{Tab}' );

		expect( onChangeSpy ).toHaveBeenCalledWith( '2018-12-22T11:00:00' );
		onChangeSpy.mockClear();

		await user.clear( hoursInput );
		await user.type( hoursInput, '12' );
		await user.keyboard( '{Tab}' );

		expect( onChangeSpy ).toHaveBeenCalledWith( '2018-12-22T00:00:00' );
		onChangeSpy.mockClear();

		await user.clear( minutesInput );
		await user.type( minutesInput, '35' );
		await user.keyboard( '{Tab}' );

		expect( onChangeSpy ).toHaveBeenCalledWith( '2018-12-22T00:35:00' );
		onChangeSpy.mockClear();
	} );

	it( 'should call onChange with an updated hour (12-hour clock)', async () => {
		const user = userEvent.setup();

		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T11:00:00"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const hoursInput = screen.getByLabelText( 'Hours' );

		await user.clear( hoursInput );
		await user.type( hoursInput, '10' );
		await user.keyboard( '{Tab}' );

		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T10:00:00' );
	} );

	it( 'should call onChange with a bounded hour (12-hour clock) if the hour is out of bounds', async () => {
		const user = userEvent.setup();

		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T11:00:00"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const hoursInput = screen.getByLabelText( 'Hours' );

		await user.clear( hoursInput );
		await user.type( hoursInput, '22' );
		await user.keyboard( '{Tab}' );

		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T00:00:00' );
	} );

	it( 'should call onChange with an updated hour (24-hour clock)', async () => {
		const user = userEvent.setup();

		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T11:00:00"
				onChange={ onChangeSpy }
				is12Hour={ false }
			/>
		);

		const hoursInput = screen.getByLabelText( 'Hours' );

		await user.clear( hoursInput );
		await user.type( hoursInput, '22' );
		await user.keyboard( '{Tab}' );

		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T22:00:00' );
	} );

	it( 'should call onChange with a bounded minute if out of bounds', async () => {
		const user = userEvent.setup();

		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T11:00:00"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const minutesInput = screen.getByLabelText( 'Minutes' );

		await user.clear( minutesInput );
		await user.type( minutesInput, '99' );
		await user.keyboard( '{Tab}' );

		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T11:59:00' );
	} );

	it( 'should switch to PM correctly', async () => {
		const user = userEvent.setup();

		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T11:00:00"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const pmButton = screen.getByText( 'PM' );

		await user.click( pmButton );

		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T23:00:00' );
	} );

	it( 'should switch to AM correctly', async () => {
		const user = userEvent.setup();

		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T23:00:00"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const amButton = screen.getByText( 'AM' );

		await user.click( amButton );

		expect( onChangeSpy ).toHaveBeenCalledWith( '1986-10-18T11:00:00' );
	} );

	it( 'should allow to set the time correctly when the PM period is selected', async () => {
		const user = userEvent.setup();

		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T11:00:00"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const pmButton = screen.getByText( 'PM' );
		await user.click( pmButton );

		const hoursInput = screen.getByLabelText( 'Hours' );
		await user.clear( hoursInput );
		await user.type( hoursInput, '6' );
		await user.keyboard( '{Tab}' );

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

	it( 'should truncate at the minutes on change', async () => {
		const user = userEvent.setup();

		const onChangeSpy = jest.fn();

		render(
			<TimePicker
				currentTime="1986-10-18T23:12:35"
				onChange={ onChangeSpy }
				is12Hour
			/>
		);

		const minutesInput = screen.getByLabelText( 'Minutes' );

		await user.clear( minutesInput );
		await user.type( minutesInput, '22' );
		await user.keyboard( '{Tab}' );

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

		expect(
			( screen.getByLabelText( 'Month' ) as HTMLInputElement ).value
		).toBe( '07' );
		expect(
			( screen.getByLabelText( 'Day' ) as HTMLInputElement ).value
		).toBe( '13' );
		expect(
			( screen.getByLabelText( 'Year' ) as HTMLInputElement ).value
		).toBe( '2020' );
		expect(
			( screen.getByLabelText( 'Hours' ) as HTMLInputElement ).value
		).toBe( '06' );
		expect(
			( screen.getByLabelText( 'Minutes' ) as HTMLInputElement ).value
		).toBe( '00' );

		expect( screen.getByRole( 'radio', { name: 'AM' } ) ).not.toBeChecked();
		expect( screen.getByRole( 'radio', { name: 'PM' } ) ).toBeChecked();
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

		const form = screen.getByRole( 'form' ) as HTMLFormElement;

		let monthInputIndex = Array.from( form.elements ).indexOf(
			screen.getByLabelText( 'Month' )
		);
		let dayInputIndex = Array.from( form.elements ).indexOf(
			screen.getByLabelText( 'Day' )
		);

		expect( monthInputIndex > dayInputIndex ).toBe( true );

		rerender(
			<form aria-label="form">
				<TimePicker
					currentTime="1986-10-18T11:00:00"
					onChange={ onChangeSpy }
					is12Hour
				/>
			</form>
		);

		monthInputIndex = Array.from( form.elements ).indexOf(
			screen.getByLabelText( 'Month' )
		);
		dayInputIndex = Array.from( form.elements ).indexOf(
			screen.getByLabelText( 'Day' )
		);

		expect( monthInputIndex < dayInputIndex ).toBe( true );
	} );

	it( 'Should change layouts/orders when `dateOrder` prop is passed', () => {
		const onChangeSpy = jest.fn();

		render(
			<form aria-label="form">
				<TimePicker
					currentTime="1986-10-18T11:00:00"
					onChange={ onChangeSpy }
					dateOrder="ymd"
				/>
			</form>
		);

		const form = screen.getByRole( 'form' ) as HTMLFormElement;

		const yearInputIndex = Array.from( form.elements ).indexOf(
			screen.getByLabelText( 'Year' )
		);

		const monthInputIndex = Array.from( form.elements ).indexOf(
			screen.getByLabelText( 'Month' )
		);
		const dayInputIndex = Array.from( form.elements ).indexOf(
			screen.getByLabelText( 'Day' )
		);

		expect( monthInputIndex > yearInputIndex ).toBe( true );
		expect( dayInputIndex > monthInputIndex ).toBe( true );
	} );

	it( 'Should ignore `is12Hour` prop setting when `dateOrder` prop is explicitly passed', () => {
		const onChangeSpy = jest.fn();

		render(
			<form aria-label="form">
				<TimePicker
					currentTime="1986-10-18T11:00:00"
					onChange={ onChangeSpy }
					dateOrder="ymd"
					is12Hour
				/>
			</form>
		);

		const form = screen.getByRole( 'form' ) as HTMLFormElement;

		const yearInputIndex = Array.from( form.elements ).indexOf(
			screen.getByLabelText( 'Year' )
		);

		const monthInputIndex = Array.from( form.elements ).indexOf(
			screen.getByLabelText( 'Month' )
		);
		const dayInputIndex = Array.from( form.elements ).indexOf(
			screen.getByLabelText( 'Day' )
		);

		expect( monthInputIndex > yearInputIndex ).toBe( true );
		expect( dayInputIndex > monthInputIndex ).toBe( true );
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

		const monthInput = (
			screen.getByLabelText( 'Month' ) as HTMLInputElement
		 ).value;
		const dayInput = ( screen.getByLabelText( 'Day' ) as HTMLInputElement )
			.value;
		const yearInput = (
			screen.getByLabelText( 'Year' ) as HTMLInputElement
		 ).value;
		const hoursInput = (
			screen.getByLabelText( 'Hours' ) as HTMLInputElement
		 ).value;
		const minutesInput = (
			screen.getByLabelText( 'Minutes' ) as HTMLInputElement
		 ).value;

		expect( Number.isNaN( parseInt( monthInput, 10 ) ) ).toBe( false );
		expect( Number.isNaN( parseInt( dayInput, 10 ) ) ).toBe( false );
		expect( Number.isNaN( parseInt( yearInput, 10 ) ) ).toBe( false );
		expect( Number.isNaN( parseInt( hoursInput, 10 ) ) ).toBe( false );
		expect( Number.isNaN( parseInt( minutesInput, 10 ) ) ).toBe( false );
	} );

	describe( 'input types with timezone variations', () => {
		let originalSettings: DateSettings;

		beforeAll( () => {
			originalSettings = getSettings();
			setSettings( {
				...originalSettings,
				timezone: {
					offset: -5,
					offsetFormatted: '-5',
					string: 'America/New_York',
					abbr: 'EST',
				},
			} );
		} );

		afterEach( () => {
			jest.useRealTimers();
			timezoneMock.unregister();
		} );

		afterAll( () => {
			setSettings( originalSettings );
		} );

		describe.each( [
			{
				direction: 'browser behind site',
				timezone: 'US/Pacific' as const,
			},
			{
				direction: 'browser matches UTC (zero offset)',
				timezone: 'UTC' as const,
			},
			{
				direction: 'browser ahead of site',
				timezone: 'Australia/Adelaide' as const,
			},
		] )( '$direction', ( { timezone } ) => {
			beforeEach( () => {
				timezoneMock.register( timezone );
			} );

			function transformOnChangeToDate( nextValue: string ): Date {
				// Timezoneless string represents site timezone. Convert to UTC
				// instant in site timezone. In typical usage, consumers should
				// align `@wordpress/date` settings to match their browser timezone
				// when working with dates, to avoid having to manage this
				// conversion themselves.
				const settings = getSettings();
				const offsetMs = settings.timezone.offset * 60 * 60 * 1000;
				const asUTC = new Date( nextValue + 'Z' );
				return new Date( asUTC.getTime() - offsetMs );
			}

			describe.each( [
				{
					type: 'timezoneless string',
					initialTime: '2025-12-18T07:00:00',
					transformOnChange: ( nextValue: string ) => nextValue,
				},
				{
					type: 'string with timezone',
					initialTime: '2025-12-18T12:00:00Z',
					transformOnChange: ( nextValue: string ) =>
						transformOnChangeToDate( nextValue ).toISOString(),
				},
				{
					type: 'Date object',
					initialTime: new Date( Date.UTC( 2025, 11, 18, 12, 0, 0 ) ),
					transformOnChange: transformOnChangeToDate,
				},
				{
					type: 'timestamp',
					initialTime: Date.UTC( 2025, 11, 18, 12, 0, 0 ),
					transformOnChange: ( nextValue: string ) =>
						transformOnChangeToDate( nextValue ).getTime(),
				},
				{
					type: 'undefined',
					initialTime: undefined,
					transformOnChange: ( nextValue: string ) => nextValue,
				},
			] )( 'with $type', ( { initialTime, transformOnChange } ) => {
				it( 'should output timezoneless string matching displayed time', async () => {
					// For undefined, set fake system time to get a known current time
					let user: ReturnType< typeof userEvent.setup >;
					if ( initialTime === undefined ) {
						jest.useFakeTimers();
						// Set system time to 12:00 UTC
						jest.setSystemTime(
							Date.UTC( 2025, 11, 18, 12, 0, 0 )
						);
						user = userEvent.setup( {
							advanceTimers: jest.advanceTimersByTime,
						} );
					} else {
						user = userEvent.setup();
					}

					const onChange = jest.fn();

					const { rerender } = render(
						<TimePicker
							currentTime={ initialTime }
							onChange={ onChange }
						/>
					);

					// Should display the correct initial date and time assuming
					// settings for the current site.
					expect( screen.getByLabelText( 'Hours' ) ).toHaveValue( 7 );
					expect( screen.getByLabelText( 'Minutes' ) ).toHaveValue(
						0
					);
					expect( screen.getByLabelText( 'Day' ) ).toHaveValue( 18 );

					// Changing the hours by one should adjust just the hour.
					await user.clear( screen.getByLabelText( 'Hours' ) );
					await user.type( screen.getByLabelText( 'Hours' ), '08' );
					await user.keyboard( '{Tab}' );
					expect( onChange ).toHaveBeenCalledWith(
						'2025-12-18T08:00:00'
					);

					// Test round-trip by passing onChange output back as input
					let nextDate = onChange.mock.calls[ 0 ][ 0 ];
					rerender(
						<TimePicker
							currentTime={ transformOnChange( nextDate ) }
							onChange={ onChange }
						/>
					);
					expect( screen.getByLabelText( 'Hours' ) ).toHaveValue( 8 );
					expect( screen.getByLabelText( 'Day' ) ).toHaveValue( 18 );
					onChange.mockClear();

					// Changing the minutes should adjust just the minutes.
					await user.clear( screen.getByLabelText( 'Minutes' ) );
					await user.type( screen.getByLabelText( 'Minutes' ), '30' );
					await user.keyboard( '{Tab}' );
					expect( onChange ).toHaveBeenCalledWith(
						'2025-12-18T08:30:00'
					);

					// Test round-trip by passing onChange output back as input
					nextDate = onChange.mock.calls[ 0 ][ 0 ];
					rerender(
						<TimePicker
							currentTime={ transformOnChange( nextDate ) }
							onChange={ onChange }
						/>
					);
					expect( screen.getByLabelText( 'Minutes' ) ).toHaveValue(
						30
					);
					expect( screen.getByLabelText( 'Day' ) ).toHaveValue( 18 );
				} );
			} );
		} );
	} );

	describe( 'ISO 8601 compliance', () => {
		it( 'should handle years below 1000 with zero-padded output', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="0999-10-18T11:00:00"
					onChange={ onChangeSpy }
					is12Hour
				/>
			);

			const yearInput = screen.getByLabelText( 'Year' );

			// Verify initial input displays correctly
			expect( yearInput ).toHaveValue( 999 );

			// Change to year 500
			await user.clear( yearInput );
			await user.type( yearInput, '500' );
			await user.keyboard( '{Tab}' );

			// Verify input field value after change (human-readable, not zero-padded)
			expect( yearInput ).toHaveValue( 500 );

			// Verify onChange emits zero-padded ISO 8601 format
			expect( onChangeSpy ).toHaveBeenCalled();
			const lastCall =
				onChangeSpy.mock.calls[ onChangeSpy.mock.calls.length - 1 ];
			const outputDate = lastCall[ 0 ];

			// Extract year from output and verify it's zero-padded to 4 digits
			const yearMatch = outputDate.match( /^(\d{4})-/ );
			expect( yearMatch ).not.toBeNull();
			expect( yearMatch[ 1 ] ).toBe( '0500' ); // Explicitly verify zero-padded year

			expect( outputDate ).not.toContain( 'NaN' );
			expect( outputDate ).not.toContain( 'Invalid' );
		} );
	} );
} );
