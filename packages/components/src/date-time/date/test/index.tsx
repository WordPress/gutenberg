/**
 * External dependencies
 */
import moment from 'moment';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'react-dates/initialize';

/**
 * Internal dependencies
 */
import DatePicker from '..';

describe( 'DatePicker', () => {
	it( 'should highlight the current date', () => {
		render( <DatePicker currentDate="2022-05-02T11:00:00" /> );

		expect(
			screen.getByRole( 'button', { name: 'Monday, May 2, 2022' } )
		).toHaveClass( 'CalendarDay__selected' );

		// Expect React deprecation warning due to 'react-dates' using outdated
		// React lifecycle methods.
		// https://github.com/react-dates/react-dates/issues/1748
		expect( console ).toHaveWarned();
	} );

	it( "should highlight today's date when not provided a currentDate", () => {
		render( <DatePicker /> );

		const todayDescription = moment().format( 'dddd, MMM D, YYYY' );
		expect(
			screen.getByRole( 'button', { name: todayDescription } )
		).toHaveClass( 'CalendarDay__selected' );
	} );

	it( 'should call onChange when a day is selected', async () => {
		const user = userEvent.setup( { delay: null } );

		const onChange = jest.fn();

		render(
			<DatePicker
				currentDate="2022-05-02T11:00:00"
				onChange={ onChange }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Friday, May 20, 2022' } )
		);

		expect( onChange ).toHaveBeenCalledWith( '2022-05-20T11:00:00' );
	} );

	it( 'should call onMonthPreviewed and onChange when a day in a different month is selected', async () => {
		const user = userEvent.setup( { delay: null } );

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
				name: 'Move forward to switch to the next month.',
			} )
		);

		expect( onMonthPreviewed ).toHaveBeenCalledWith(
			expect.stringMatching( /^2022-06/ )
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Monday, June 20, 2022' } )
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
				.getAllByLabelText( 'There is 1 event.', { exact: false } )
				.map( ( day ) => day.getAttribute( 'aria-label' ) )
		).toEqual( [
			'Wednesday, May 4, 2022. There is 1 event.',
			'Thursday, May 19, 2022. There is 1 event.',
		] );
	} );

	it( 'should not allow invalid date to be selected', async () => {
		const user = userEvent.setup( { delay: null } );

		const onChange = jest.fn();

		render(
			<DatePicker
				currentDate="2022-05-02T11:00:00"
				onChange={ onChange }
				isInvalidDate={ ( date ) => date.getDate() === 20 }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Friday, May 20, 2022' } )
		);

		expect( onChange ).not.toHaveBeenCalledWith( '2022-05-20T11:00:00' );
	} );
} );
