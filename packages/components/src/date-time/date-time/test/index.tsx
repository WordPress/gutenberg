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

		onChange.mockImplementation( ( newDate ) => {
			rerender(
				<DateTimePicker currentDate={ newDate } onChange={ onChange } />
			);
		} );

		await user.click(
			screen.getByRole( 'button', { name: 'November 20, 2025' } )
		);

		expect( onChange ).toHaveBeenCalledWith( '2025-11-20T00:00:00' );
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

						onChange.mockImplementation( ( newDate ) => {
							rerender(
								<DateTimePicker
									currentDate={ newDate }
									onChange={ onChange }
								/>
							);
						} );

						await user.click(
							screen.getByRole( 'button', { name: clickButton } )
						);

						expect( screen.getByLabelText( 'Day' ) ).toHaveValue(
							expectedDay
						);
						expect( onChange ).toHaveBeenCalledWith( expectedDate );
						expect(
							screen.getByRole( 'button', {
								name: selectedButton,
							} )
						).toBeVisible();
					} );
				}
			);
		} );
	} );

	describe( 'different input types', () => {
		// Input types should be treated assuming the timezone offset configured
		// through `@wordpress/date` settings, i.e. the site's timezone. Inputs
		// representing the same site timezone time should display and output
		// identically. The site timezone in these tests is UTC-5 (set in
		// beforeAll), where 20:00 site time = 01:00 UTC the next day.
		describe.each( [
			{
				type: 'timezoneless string (20:00 site time)',
				initialDate: '2025-11-15T20:00:00',
			},
			{
				type: 'Date object (01:00 UTC Nov 16 = 20:00 site time Nov 15)',
				initialDate: new Date( Date.UTC( 2025, 10, 16, 1, 0, 0 ) ),
			},
			{
				type: 'timestamp (01:00 UTC Nov 16 = 20:00 site time Nov 15)',
				initialDate: Date.UTC( 2025, 10, 16, 1, 0, 0 ),
			},
		] )( '$type', ( { initialDate } ) => {
			it( 'should display and select dates according to site timezone', async () => {
				const user = userEvent.setup();
				const onChange = jest.fn();

				timezoneMock.register( 'US/Pacific' );

				const { rerender } = render(
					<DateTimePicker
						currentDate={ initialDate }
						onChange={ onChange }
					/>
				);

				// Should display the correct initial date and time assuming
				// settings for the current site. If incorrectly using UTC,
				// this would show Nov 16 at 01:00 instead of Nov 15 at 20:00.
				expect(
					screen.getByRole( 'button', {
						name: 'November 15, 2025. Selected',
					} )
				).toBeVisible();
				expect( screen.getByLabelText( 'Hours' ) ).toHaveValue( 20 );
				expect( screen.getByLabelText( 'Minutes' ) ).toHaveValue( 0 );

				onChange.mockImplementation( ( newDate ) => {
					rerender(
						<DateTimePicker
							currentDate={ newDate }
							onChange={ onChange }
						/>
					);
				} );

				await user.click(
					screen.getByRole( 'button', { name: 'November 20, 2025' } )
				);

				// Changing date should preserve the time, calling onChange with
				// a timezoneless string. The timezoneless string is assumed to
				// represent the site timezone.
				expect( onChange ).toHaveBeenCalledWith(
					'2025-11-20T20:00:00'
				);
				expect(
					screen.getByRole( 'button', {
						name: 'November 20, 2025. Selected',
					} )
				).toBeVisible();
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

	it( 'should be stable when onChange strings are converted to Date and passed back', async () => {
		// When the site timezone is configured to match the browser timezone,
		// converting onChange strings to Date objects (via new Date(string))
		// and passing them back should produce stable results. This is a common
		// pattern when the consumer wants to work with browser-local times.

		const user = userEvent.setup();
		const onChange = jest.fn();

		// Configure site timezone to match browser
		timezoneMock.register( 'US/Pacific' );
		setSettings( {
			...originalSettings,
			timezone: {
				offset: -8,
				offsetFormatted: '-8',
				string: 'America/Los_Angeles',
				abbr: 'PST',
			},
		} );

		let currentDate: string | Date = '2025-11-15T14:30:00';

		const { rerender } = render(
			<DateTimePicker currentDate={ currentDate } onChange={ onChange } />
		);

		// Simulate converting onChange string to Date and passing back
		onChange.mockImplementation( ( newDateString: string ) => {
			currentDate = new Date( newDateString );
			rerender(
				<DateTimePicker
					currentDate={ currentDate }
					onChange={ onChange }
				/>
			);
		} );

		await user.click(
			screen.getByRole( 'button', { name: 'November 20, 2025' } )
		);
		expect( onChange ).toHaveBeenLastCalledWith( '2025-11-20T14:30:00' );

		// Second interaction should produce identical output (no drift)
		await user.click(
			screen.getByRole( 'button', {
				name: 'November 20, 2025. Selected',
			} )
		);
		expect( onChange ).toHaveBeenLastCalledWith( '2025-11-20T14:30:00' );
	} );
} );
