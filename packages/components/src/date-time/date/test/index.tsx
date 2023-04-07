/**
 * External dependencies
 */
import { format } from 'date-fns';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import DatePicker from '..';

describe( 'DatePicker', () => {
	it( 'should highlight the current date', () => {
		render( <DatePicker currentDate="2022-05-02T11:00:00" /> );

		expect(
			screen.getByRole( 'button', { name: 'May 2, 2022. Selected' } )
		).toBeInTheDocument();
	} );

	it( "should highlight today's date when not provided a currentDate", () => {
		render( <DatePicker /> );

		const todayDescription = format( new Date(), 'MMMM d, yyyy' );
		expect(
			screen.getByRole( 'button', {
				name: `${ todayDescription }. Selected`,
			} )
		).toBeInTheDocument();
	} );

	it( 'should call onChange when a day is selected', async () => {
		const user = userEvent.setup();

		const onChange = jest.fn();

		render(
			<DatePicker
				currentDate="2022-05-02T11:00:00"
				onChange={ onChange }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'May 20, 2022' } )
		);

		expect( onChange ).toHaveBeenCalledWith( '2022-05-20T11:00:00' );
	} );

	it( 'should call onMonthPreviewed and onChange when a day in a different month is selected', async () => {
		const user = userEvent.setup();

		const onMonthPreviewed = jest.fn();
		const onChange = jest.fn();

		render(
			<DatePicker
				currentDate="2022-05-02T11:00:00"
				onMonthPreviewed={ onMonthPreviewed }
				onChange={ onChange }
			/>
		);

		await user.click(
			screen.getByRole( 'button', {
				name: 'View next month',
			} )
		);

		expect( onMonthPreviewed ).toHaveBeenCalledWith(
			expect.stringMatching( /^2022-06/ )
		);

		await user.click(
			screen.getByRole( 'button', { name: 'June 20, 2022' } )
		);

		expect( onChange ).toHaveBeenCalledWith( '2022-06-20T11:00:00' );
	} );

	it( 'should highlight events on the calendar', () => {
		render(
			<DatePicker
				currentDate="2022-05-02T11:00:00"
				events={ [
					{ date: new Date( '2022-05-04T00:00:00' ) },
					{ date: new Date( '2022-05-19T00:00:00' ) },
				] }
			/>
		);

		expect(
			screen
				.getAllByLabelText( 'There is 1 event', { exact: false } )
				.map( ( day ) => day.getAttribute( 'aria-label' ) )
		).toEqual( [
			'May 4, 2022. There is 1 event',
			'May 19, 2022. There is 1 event',
		] );
	} );

	it( 'should not allow invalid date to be selected', async () => {
		render(
			<DatePicker
				currentDate="2022-05-02T11:00:00"
				isInvalidDate={ ( date ) => date.getDate() === 20 }
			/>
		);

		const button = screen.getByRole( 'button', {
			name: 'May 20, 2022',
		} ) as HTMLButtonElement;
		expect( button.disabled ).toBe( true );
	} );
} );
