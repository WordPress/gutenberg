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
import DateTimePicker from '..';

describe( 'DateTimePicker', () => {
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
		jest.restoreAllMocks();
		timezoneMock.unregister();
	} );

	afterAll( () => {
		setSettings( originalSettings );
	} );

	it( 'should display and select dates correctly when timezones match', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		timezoneMock.register( 'US/Eastern' );

		const { rerender } = render(
			<DateTimePicker
				currentDate="2025-11-15T00:00:00"
				onChange={ onChange }
			/>
		);

		expect(
			screen.getByRole( 'button', {
				name: 'November 15, 2025. Selected',
			} )
		).toBeVisible();

		await user.click(
			screen.getByRole( 'button', { name: 'November 20, 2025' } )
		);

		expect( onChange ).toHaveBeenCalledWith( '2025-11-20T00:00:00' );

		const nextDate = onChange.mock.calls[ 0 ][ 0 ];
		rerender(
			<DateTimePicker currentDate={ nextDate } onChange={ onChange } />
		);

		expect(
			screen.getByRole( 'button', {
				name: 'November 20, 2025. Selected',
			} )
		).toBeVisible();
	} );

	describe( 'timezone differences between browser and site', () => {
		describe.each( [
			{
				direction: 'browser behind site',
				timezone: 'US/Pacific' as const,
				time: '21:00:00', // Evening: shifts to next day UTC
			},
			{
				// Test a scenario where local time is UTC time, to verify that
				// using gmdateI18n (UTC) for formatting works correctly when
				// the browser's timezone already has no offset from UTC.
				direction: 'browser matches UTC (zero offset)',
				timezone: 'UTC' as const,
				time: '00:00:00',
			},
			{
				direction: 'browser ahead of site',
				timezone: 'Australia/Adelaide' as const,
				time: '00:00:00', // Midnight: shifts to previous day UTC
			},
		] )( '$direction', ( { timezone, time } ) => {
			describe.each( [
				{
					period: 'DST start',
					initialDate: `2025-03-10T${ time }`,
					initialButton: 'March 10, 2025. Selected',
					clickButton: 'March 11, 2025',
					expectedDay: 11,
					expectedDate: `2025-03-11T${ time }`,
					selectedButton: 'March 11, 2025. Selected',
					wrongMonthButton: 'February 28, 2025',
				},
				{
					period: 'DST end',
					initialDate: `2025-11-01T${ time }`,
					initialButton: 'November 1, 2025. Selected',
					clickButton: 'November 2, 2025',
					expectedDay: 2,
					expectedDate: `2025-11-02T${ time }`,
					selectedButton: 'November 2, 2025. Selected',
					wrongMonthButton: 'October 31, 2025',
				},
			] )(
				'$period',
				( {
					initialDate,
					initialButton,
					clickButton,
					expectedDay,
					expectedDate,
					selectedButton,
					wrongMonthButton,
				} ) => {
					it( 'should display and select dates correctly', async () => {
						const user = userEvent.setup();
						const onChange = jest.fn();

						timezoneMock.register( timezone );

						const { rerender } = render(
							<DateTimePicker
								currentDate={ initialDate }
								onChange={ onChange }
							/>
						);

						// Calendar should not show dates from wrong month
						expect(
							screen.queryByRole( 'button', {
								name: wrongMonthButton,
							} )
						).not.toBeInTheDocument();

						// Should show correct initial date as selected
						expect(
							screen.getByRole( 'button', {
								name: initialButton,
							} )
						).toBeVisible();

						await user.click(
							screen.getByRole( 'button', { name: clickButton } )
						);

						expect( onChange ).toHaveBeenCalledWith( expectedDate );

						const nextDate = onChange.mock.calls[ 0 ][ 0 ];
						rerender(
							<DateTimePicker
								currentDate={ nextDate }
								onChange={ onChange }
							/>
						);

						expect( screen.getByLabelText( 'Day' ) ).toHaveValue(
							expectedDay
						);
						expect(
							screen.getByRole( 'button', {
								name: selectedButton,
							} )
						).toBeVisible();
					} );

					it( 'should display event indicators correctly', () => {
						// Test event indicators, where Date objects constructed
						// from timezoneless strings are passed to the component
						// and thus are interpreted in browser timezone.

						timezoneMock.register( timezone );

						render(
							<DateTimePicker
								currentDate={ initialDate }
								events={ [ { date: new Date( initialDate ) } ] }
							/>
						);

						expect(
							screen.getByRole( 'button', {
								name: `${ initialButton }. There is 1 event`,
							} )
						).toBeVisible();
					} );
				}
			);
		} );
	} );

	describe( 'input types with timezone variations', () => {
		afterEach( () => {
			jest.useRealTimers();
			timezoneMock.unregister();
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
				direction: 'browser behind site',
				timezone: 'US/Pacific' as const,
			},
			{
				direction: 'browser matches site',
				timezone: 'US/Eastern' as const,
			},
			{
				direction: 'browser ahead of site',
				timezone: 'Australia/Adelaide' as const,
			},
		] )( '$direction', ( { timezone } ) => {
			// Input types should be treated assuming the timezone offset configured
			// through `@wordpress/date` settings, i.e. the site's timezone. Inputs
			// representing the same site timezone time should display and output
			// identically. The site timezone in these tests is UTC-5 (set in
			// beforeAll), where 20:00 site time = 01:00 UTC the next day.
			describe.each( [
				{
					type: 'timezoneless string',
					initialDate: '2025-11-15T20:00:00',
					transformOnChange: ( nextValue: string ) => nextValue,
				},
				{
					type: 'string with timezone',
					initialDate: '2025-11-16T01:00:00Z',
					transformOnChange: ( nextValue: string ) =>
						transformOnChangeToDate( nextValue ).toISOString(),
				},
				{
					type: 'Date object',
					initialDate: new Date( Date.UTC( 2025, 10, 16, 1, 0, 0 ) ),
					transformOnChange: transformOnChangeToDate,
				},
				{
					type: 'timestamp',
					initialDate: Date.UTC( 2025, 10, 16, 1, 0, 0 ),
					transformOnChange: ( nextValue: string ) =>
						transformOnChangeToDate( nextValue ).getTime(),
				},
				{
					type: 'undefined',
					initialDate: undefined,
					transformOnChange: ( nextValue: string ) => nextValue,
				},
			] )( 'with $type', ( { initialDate, transformOnChange } ) => {
				it( 'should display and select dates according to site timezone', async () => {
					timezoneMock.register( timezone );

					// Normalize "current" time to the same time, so we can
					// assert the same behavior between undefined or explicitly
					// set initial dates.
					let user: ReturnType< typeof userEvent.setup >;
					if ( initialDate === undefined ) {
						jest.useFakeTimers();
						jest.setSystemTime( Date.UTC( 2025, 10, 16, 1, 0, 0 ) );
						user = userEvent.setup( {
							advanceTimers: jest.advanceTimersByTime,
						} );
					} else {
						user = userEvent.setup();
					}

					const onChange = jest.fn();
					const { rerender } = render(
						<DateTimePicker
							currentDate={ initialDate }
							onChange={ onChange }
						/>
					);

					// Should display the correct initial date and time assuming
					// settings for the current site. If incorrectly using UTC,
					// this would show Nov 16 at 01:00 instead of Nov 15 at 20:00.
					//
					// When initialDate is undefined, the fake time is set to
					// Nov 16 01:00 UTC (Nov 15 20:00 site time), in which case the
					// current date of Nov 15 is both "Selected" and "Today".
					expect(
						screen.getByRole( 'button', {
							name:
								initialDate === undefined
									? 'November 15, 2025. Selected. Today'
									: 'November 15, 2025. Selected',
						} )
					).toBeVisible();
					expect( screen.getByLabelText( 'Hours' ) ).toHaveValue(
						20
					);
					expect( screen.getByLabelText( 'Minutes' ) ).toHaveValue(
						0
					);

					await user.click(
						screen.getByRole( 'button', {
							name: 'November 20, 2025',
						} )
					);

					// Changing date should preserve the time, calling onChange with
					// a timezoneless string. The timezoneless string is assumed to
					// represent the site timezone.
					expect( onChange ).toHaveBeenCalledWith(
						'2025-11-20T20:00:00'
					);

					let nextDate = onChange.mock.calls[ 0 ][ 0 ];
					rerender(
						<DateTimePicker
							currentDate={ transformOnChange( nextDate ) }
							onChange={ onChange }
						/>
					);

					expect(
						screen.getByRole( 'button', {
							name: 'November 20, 2025. Selected',
						} )
					).toBeVisible();
					expect( screen.getByLabelText( 'Hours' ) ).toHaveValue(
						20
					);
					expect( screen.getByLabelText( 'Minutes' ) ).toHaveValue(
						0
					);

					// Changing the time should output timezoneless string with
					// only the updated hour, and not changing the date.
					onChange.mockClear();
					const hoursInput = screen.getByLabelText( 'Hours' );
					await user.clear( hoursInput );
					await user.type( hoursInput, '22' );
					await user.keyboard( '{Tab}' );
					expect( onChange ).toHaveBeenCalledWith(
						'2025-11-20T22:00:00'
					);

					nextDate = onChange.mock.calls[ 0 ][ 0 ];
					rerender(
						<DateTimePicker
							currentDate={ transformOnChange( nextDate ) }
							onChange={ onChange }
						/>
					);

					expect( screen.getByLabelText( 'Hours' ) ).toHaveValue(
						22
					);
					expect( screen.getByLabelText( 'Minutes' ) ).toHaveValue(
						0
					);

					// Ensure week boundaries keyboard navigation is calculated
					// correctly in the configured timezone, not the browser's.
					await user.click(
						screen.getByRole( 'button', {
							name: 'November 20, 2025. Selected',
						} )
					);
					await user.keyboard( '{Home}' );
					expect(
						screen.getByRole( 'button', {
							name: 'November 16, 2025',
						} )
					).toHaveFocus();
					await user.keyboard( '{End}' );
					expect(
						screen.getByRole( 'button', {
							name: 'November 22, 2025',
						} )
					).toHaveFocus();
				} );
			} );
		} );
	} );

	it( 'should preserve time when changing date', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		timezoneMock.register( 'UTC' );

		render(
			<DateTimePicker
				currentDate="2025-11-15T14:30:00"
				onChange={ onChange }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'November 20, 2025' } )
		);

		expect( onChange ).toHaveBeenCalledWith( '2025-11-20T14:30:00' );
	} );
} );
