/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
	} );

	afterAll( () => {
		setSettings( originalSettings );
	} );

	it( 'should display and select dates correctly when timezones match', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		jest.spyOn( Date.prototype, 'getTimezoneOffset' ).mockImplementation(
			() => 300
		);

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
		).toBeInTheDocument();

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
		).toBeInTheDocument();
	} );

	describe( 'timezone differences between browser and site', () => {
		it( 'should not shift to previous day when browser is behind site timezone', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			// Browser in GMT (UTC+0), site in EST (UTC-5)
			// Nov 1 00:00 GMT would be Oct 31 19:00 EST if converted
			jest.spyOn(
				Date.prototype,
				'getTimezoneOffset'
			).mockImplementation( () => 0 );

			const { rerender } = render(
				<DateTimePicker
					currentDate="2025-11-01T00:00:00"
					onChange={ onChange }
				/>
			);

			// Calendar should only show dates from November, not October
			expect(
				screen.queryByRole( 'button', { name: 'October 31, 2025' } )
			).not.toBeInTheDocument();

			// Should show Nov 1 as selected, not Oct 31
			expect(
				screen.getByRole( 'button', {
					name: 'November 1, 2025. Selected',
				} )
			).toBeInTheDocument();

			onChange.mockImplementation( ( newDate ) => {
				rerender(
					<DateTimePicker
						currentDate={ newDate }
						onChange={ onChange }
					/>
				);
			} );

			await user.click(
				screen.getByRole( 'button', { name: 'November 2, 2025' } )
			);

			expect( screen.getByLabelText( 'Day' ) ).toHaveValue( 2 );
			expect( onChange ).toHaveBeenCalledWith( '2025-11-02T00:00:00' );
			expect(
				screen.getByRole( 'button', {
					name: 'November 2, 2025. Selected',
				} )
			).toBeInTheDocument();
		} );

		it( 'should not shift to next day when browser is ahead of site timezone', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			// Browser in Tokyo (UTC+9), site in EST (UTC-5)
			// If incorrectly handled, March 10 00:00 could display as March 9
			jest.spyOn(
				Date.prototype,
				'getTimezoneOffset'
			).mockImplementation( () => -540 );

			const { rerender } = render(
				<DateTimePicker
					currentDate="2025-03-10T00:00:00"
					onChange={ onChange }
				/>
			);

			// Calendar should only show dates from March, not February or April
			expect(
				screen.queryByRole( 'button', { name: 'February 28, 2025' } )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: 'April 1, 2025' } )
			).not.toBeInTheDocument();

			// Should show March 10 as selected, not shifted to March 9
			expect(
				screen.getByRole( 'button', {
					name: 'March 10, 2025. Selected',
				} )
			).toBeInTheDocument();

			onChange.mockImplementation( ( newDate ) => {
				rerender(
					<DateTimePicker
						currentDate={ newDate }
						onChange={ onChange }
					/>
				);
			} );

			await user.click(
				screen.getByRole( 'button', { name: 'March 15, 2025' } )
			);

			expect( screen.getByLabelText( 'Day' ) ).toHaveValue( 15 );
			expect( onChange ).toHaveBeenCalledWith( '2025-03-15T00:00:00' );
			expect(
				screen.getByRole( 'button', {
					name: 'March 15, 2025. Selected',
				} )
			).toBeInTheDocument();
		} );
	} );

	it( 'should preserve time when changing date', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		jest.spyOn( Date.prototype, 'getTimezoneOffset' ).mockImplementation(
			() => 0
		);

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
