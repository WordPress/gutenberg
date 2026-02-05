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

	describe( 'date validation', () => {
		it( 'should clamp day when month changes to shorter month', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2025-01-31T10:00:00" // Jan 31
					onChange={ onChangeSpy }
				/>
			);

			const monthInput = screen.getByLabelText( 'Month' );
			await user.selectOptions( monthInput, '02' ); // Feb (28 days in 2025)

			// Should clamp day to 28 (Feb max in non-leap year)
			expect( onChangeSpy ).toHaveBeenCalledWith( '2025-02-28T10:00:00' );
		} );

		it( 'should clamp day when changing from 31-day month to 30-day month', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2025-03-31T10:00:00" // Mar 31
					onChange={ onChangeSpy }
				/>
			);

			const monthInput = screen.getByLabelText( 'Month' );
			await user.selectOptions( monthInput, '04' ); // April (30 days)

			// Should clamp day to 30 (April max)
			expect( onChangeSpy ).toHaveBeenCalledWith( '2025-04-30T10:00:00' );
		} );

		it( 'should handle leap year day validation when year changes', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2024-02-29T10:00:00" // Leap year Feb 29
					onChange={ onChangeSpy }
				/>
			);

			const yearInput = screen.getByLabelText( 'Year' );
			await user.clear( yearInput );
			await user.type( yearInput, '2025' ); // Non-leap year
			await user.keyboard( '{Tab}' );

			// Should clamp day to 28 (Feb max in non-leap year)
			expect( onChangeSpy ).toHaveBeenCalledWith( '2025-02-28T10:00:00' );
		} );

		it( 'should not change day when staying within valid range for new month', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2025-01-15T10:00:00" // Jan 15
					onChange={ onChangeSpy }
				/>
			);

			const monthInput = screen.getByLabelText( 'Month' );
			await user.selectOptions( monthInput, '02' ); // Feb (28 days, but 15 is valid)

			// Day 15 is valid for Feb, should not change
			expect( onChangeSpy ).toHaveBeenCalledWith( '2025-02-15T10:00:00' );
		} );

		it( 'should revert year when typing value below minimum (< 1000)', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2025-02-15T10:00:00"
					onChange={ onChangeSpy }
				/>
			);

			const yearInput = screen.getByLabelText( 'Year' );
			await user.clear( yearInput );
			await user.type( yearInput, '999' ); // Invalid: not a 4-digit year
			await user.keyboard( '{Tab}' );

			// Invalid years (<1000) should revert to original, not clamp
			expect( onChangeSpy ).not.toHaveBeenCalled();
			// Input should revert to the original value
			expect( screen.getByLabelText( 'Year' ) ).toHaveValue( 2025 );
		} );

		it( 'should clamp year above maximum (> 9999) to 9999', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2025-02-15T10:00:00"
					onChange={ onChangeSpy }
				/>
			);

			const yearInput = screen.getByLabelText( 'Year' );
			await user.clear( yearInput );
			await user.type( yearInput, '10000' ); // Exceeds max, will be clamped to 9999
			await user.keyboard( '{Tab}' );

			// HTML5 validation clamps to max, so 9999 is emitted
			expect( onChangeSpy ).toHaveBeenCalledWith( '9999-02-15T10:00:00' );
			// Input should show the clamped value
			expect( yearInput ).toHaveValue( 9999 );
		} );

		it( 'should revert day when typing value below minimum (< 1)', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2025-02-15T10:00:00"
					onChange={ onChangeSpy }
				/>
			);

			const dayInput = screen.getByLabelText( 'Day' );
			await user.clear( dayInput );
			await user.type( dayInput, '0' ); // Invalid: 0 is not a valid day
			await user.keyboard( '{Tab}' );

			// Invalid day (0, clamped to 1 by HTML5) should revert to original
			expect( onChangeSpy ).not.toHaveBeenCalled();
			// Input should revert to the original value
			expect( screen.getByLabelText( 'Day' ) ).toHaveValue( 15 );
		} );

		it( 'should clamp day above absolute maximum (> 31) to 31', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2025-01-15T10:00:00" // January has 31 days
					onChange={ onChangeSpy }
				/>
			);

			const dayInput = screen.getByLabelText( 'Day' );
			await user.clear( dayInput );
			await user.type( dayInput, '32' ); // Exceeds max, will be clamped to 31
			await user.keyboard( '{Tab}' );

			// HTML5 validation clamps to max, so 31 is emitted (valid for Jan)
			expect( onChangeSpy ).toHaveBeenCalledWith( '2025-01-31T10:00:00' );
			// Input should show the clamped value
			expect( dayInput ).toHaveValue( 31 );
		} );

		it( 'should clamp day exceeding month maximum to max day', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2025-02-15T10:00:00"
					onChange={ onChangeSpy }
				/>
			);

			const dayInput = screen.getByLabelText( 'Day' );
			await user.clear( dayInput );
			await user.type( dayInput, '30' ); // Exceeds Feb max, will be clamped to 28
			await user.keyboard( '{Tab}' );

			// Should emit onChange with clamped day
			expect( onChangeSpy ).toHaveBeenCalledWith( '2025-02-28T10:00:00' );
			// Input should show the clamped value (key-based reset forces re-render)
			expect( screen.getByLabelText( 'Day' ) ).toHaveValue( 28 );
		} );

		it( 'should clamp day 29 to 28 in February of non-leap year', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2025-02-15T10:00:00" // 2025 is not a leap year
					onChange={ onChangeSpy }
				/>
			);

			const dayInput = screen.getByLabelText( 'Day' );
			await user.clear( dayInput );
			await user.type( dayInput, '29' ); // Exceeds Feb 2025 max, will be clamped to 28
			await user.keyboard( '{Tab}' );

			// Should emit onChange with clamped day
			expect( onChangeSpy ).toHaveBeenCalledWith( '2025-02-28T10:00:00' );
			// Input should show the clamped value (key-based reset forces re-render)
			expect( screen.getByLabelText( 'Day' ) ).toHaveValue( 28 );
		} );

		it( 'should accept day 29 in February of leap year', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2024-02-15T10:00:00" // 2024 is a leap year
					onChange={ onChangeSpy }
				/>
			);

			const dayInput = screen.getByLabelText( 'Day' );
			await user.clear( dayInput );
			await user.type( dayInput, '29' ); // Valid: Feb 2024 has 29 days
			await user.keyboard( '{Tab}' );

			// Should emit onChange - 29 is valid for Feb in leap year
			expect( onChangeSpy ).toHaveBeenCalledWith( '2024-02-29T10:00:00' );
			// Input should show the new valid value
			expect( dayInput ).toHaveValue( 29 );
		} );

		it( 'should clamp day 31 to 30 in 30-day month', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2025-04-15T10:00:00" // April has 30 days
					onChange={ onChangeSpy }
				/>
			);

			const dayInput = screen.getByLabelText( 'Day' );
			await user.clear( dayInput );
			await user.type( dayInput, '31' ); // Exceeds April max, will be clamped to 30
			await user.keyboard( '{Tab}' );

			// Should emit onChange with clamped day
			expect( onChangeSpy ).toHaveBeenCalledWith( '2025-04-30T10:00:00' );
			// Input should show the clamped value (key-based reset forces re-render)
			expect( screen.getByLabelText( 'Day' ) ).toHaveValue( 30 );
		} );

		it( 'should revert year to original when cleared and blurred', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2026-02-15T10:00:00"
					onChange={ onChangeSpy }
				/>
			);

			const yearInput = screen.getByLabelText( 'Year' );
			await user.clear( yearInput );
			await user.keyboard( '{Tab}' );

			// Should not emit onChange when reverting
			expect( onChangeSpy ).not.toHaveBeenCalled();
			// Input should revert to the original value
			expect( screen.getByLabelText( 'Year' ) ).toHaveValue( 2026 );
		} );

		it( 'should revert day to original when cleared and blurred', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2025-02-15T10:00:00"
					onChange={ onChangeSpy }
				/>
			);

			const dayInput = screen.getByLabelText( 'Day' );
			await user.clear( dayInput );
			await user.keyboard( '{Tab}' );

			// Should not emit onChange when reverting
			expect( onChangeSpy ).not.toHaveBeenCalled();
			// Input should revert to the original value
			expect( screen.getByLabelText( 'Day' ) ).toHaveValue( 15 );
		} );

		it( 'should never emit Invalid Date strings', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2025-02-15T10:00:00"
					onChange={ onChangeSpy }
				/>
			);

			// Try various month changes
			const monthInput = screen.getByLabelText( 'Month' );
			await user.selectOptions( monthInput, '03' );
			await user.selectOptions( monthInput, '04' );
			await user.selectOptions( monthInput, '02' );

			// Verify no Invalid Date was emitted in any call
			onChangeSpy.mock.calls.forEach( ( call ) => {
				const dateStr = call[ 0 ] as string;
				expect( dateStr ).not.toContain( 'Invalid' );
				expect( dateStr ).not.toContain( 'NaN' );

				// Also verify it parses to a valid Date
				const parsed = new Date( dateStr );
				expect( Number.isNaN( parsed.getTime() ) ).toBe( false );
			} );
		} );

		it( 'should allow valid day changes', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2025-02-15T10:00:00"
					onChange={ onChangeSpy }
				/>
			);

			const dayInput = screen.getByLabelText( 'Day' );
			await user.clear( dayInput );
			await user.type( dayInput, '20' );
			await user.keyboard( '{Tab}' );

			expect( onChangeSpy ).toHaveBeenCalledWith( '2025-02-20T10:00:00' );
		} );

		it( 'should allow valid year changes', async () => {
			const user = userEvent.setup();
			const onChangeSpy = jest.fn();

			render(
				<TimePicker
					currentTime="2025-02-15T10:00:00"
					onChange={ onChangeSpy }
				/>
			);

			const yearInput = screen.getByLabelText( 'Year' );
			await user.clear( yearInput );
			await user.type( yearInput, '2030' );
			await user.keyboard( '{Tab}' );

			expect( onChangeSpy ).toHaveBeenCalledWith( '2030-02-15T10:00:00' );
		} );
	} );
} );
