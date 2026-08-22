import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
	startOfDay,
	startOfWeek,
	startOfMonth,
	endOfWeek,
	addDays,
	subDays,
	addWeeks,
	addMonths,
	subMonths,
	subYears,
	addHours,
} from 'date-fns';
import { ar } from 'date-fns/locale';
import { useState } from '@wordpress/element';
import { TZDate } from '@daypicker/react';
import { Calendar } from '..';
import {
	getDateButton,
	getDateCell,
	queryDateCell,
	monthNameFormatter,
} from './__utils__';
import type { CalendarProps } from '../types';

const UncontrolledCalendar = (
	props: CalendarProps & {
		initialSelected?: Date | undefined | null;
		initialMonth?: Date | undefined;
	}
) => {
	return (
		<Calendar
			{ ...props }
			defaultValue={ props.initialSelected ?? undefined }
			defaultMonth={ props.initialMonth }
		/>
	);
};

const ControlledCalendar = (
	props: CalendarProps & {
		initialSelected?: Date | undefined | null;
		initialMonth?: Date | undefined;
	}
) => {
	const [ selected, setSelected ] = useState< Date | null >(
		props.initialSelected ?? null
	);
	const [ month, setMonth ] = useState< Date | undefined >(
		props.initialMonth
	);
	return (
		<Calendar
			{ ...props }
			value={ selected }
			onValueChange={ ( ...args ) => {
				setSelected( args[ 0 ] );
				props.onValueChange?.( ...args );
			} }
			month={ month }
			onMonthChange={ ( newMonth ) => {
				setMonth( newMonth );
				props.onMonthChange?.( newMonth );
			} }
		/>
	);
};

function setupUserEvent() {
	// The `advanceTimersByTime` is needed since we're using jest
	// fake timers to simulate a fixed date for tests.
	const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
	return user;
}

describe( 'Calendar', () => {
	let today: Date;
	let tomorrow: Date;
	let yesterday: Date;
	let currentMonth: Date;
	let nextMonth: Date;
	let nextNextMonth: Date;
	let prevMonth: Date;
	let prevPrevMonth: Date;

	beforeAll( () => {
		jest.useFakeTimers();
		// For consistent tests, set the system time to a fixed date:
		// Thursday, May 15, 2025, 20:00 UTC
		jest.setSystemTime( 1747339200000 );
		today = startOfDay( new Date() );
		tomorrow = startOfDay( addDays( today, 1 ) );
		yesterday = startOfDay( subDays( today, 1 ) );
		currentMonth = startOfMonth( today );
		nextMonth = startOfMonth( addMonths( today, 1 ) );
		nextNextMonth = startOfMonth( addMonths( today, 2 ) );
		prevMonth = startOfMonth( subMonths( today, 1 ) );
		prevPrevMonth = startOfMonth( subMonths( today, 2 ) );
	} );

	afterAll( () => {
		jest.useRealTimers();
	} );

	describe( 'Semantics and basic behavior', () => {
		it( 'should apply the correct roles, semantics and attributes', async () => {
			render( <Calendar /> );

			expect(
				screen.getByRole( 'application', { name: 'Date calendar' } )
			).toBeVisible();

			const tableGrid = screen.getByRole( 'grid', {
				name: monthNameFormatter( 'en-US' ).format( today ),
			} );
			expect( tableGrid ).toBeVisible();
			expect( tableGrid ).toHaveAttribute(
				'aria-multiselectable',
				'false'
			);

			const todayButton = getDateButton( today );
			expect( todayButton ).toBeVisible();
			expect( todayButton ).toHaveAccessibleName( /today/i );
		} );

		it( 'should show multiple months at once via the `numberOfMonths` prop', () => {
			render( <Calendar numberOfMonths={ 2 } /> );

			const grids = screen.getAllByRole( 'grid' );
			expect( grids ).toHaveLength( 2 );
			expect( grids[ 0 ] ).toHaveAccessibleName(
				monthNameFormatter( 'en-US' ).format( today )
			);
			expect( grids[ 1 ] ).toHaveAccessibleName(
				monthNameFormatter( 'en-US' ).format( nextMonth )
			);
		} );
	} );

	describe( 'Date selection', () => {
		it( 'should select an initial date in uncontrolled mode via the `defaultValue` prop', () => {
			render( <Calendar defaultValue={ today } /> );

			expect( getDateCell( today, { selected: true } ) ).toBeVisible();

			const todayButton = getDateButton( today );
			expect( todayButton ).toBeVisible();
			expect( todayButton ).toHaveAccessibleName( /selected/i );
		} );

		it( 'should select an initial date in controlled mode via the `value` prop', () => {
			// Note: the `defaultValue` prop is ignored when the `value` prop is set.
			render( <Calendar defaultValue={ tomorrow } value={ today } /> );

			expect( getDateCell( today, { selected: true } ) ).toBeVisible();

			const todayButton = getDateButton( today );
			expect( todayButton ).toBeVisible();
			expect( todayButton ).toHaveAccessibleName( /selected/i );
		} );

		it( 'should have no date selected in uncontrolled mode when no initial value is provided', () => {
			render( <Calendar /> );

			expect(
				screen.queryByRole( 'gridcell', { selected: true } )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: /selected/i } )
			).not.toBeInTheDocument();
		} );

		it( 'should have no date selected in controlled mode when the `value` prop is set to `null`', () => {
			// Note: the `defaultValue` prop is ignored when the `value` prop is set.
			render( <Calendar defaultValue={ tomorrow } value={ null } /> );

			expect(
				screen.queryByRole( 'gridcell', { selected: true } )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'button', { name: /selected/i } )
			).not.toBeInTheDocument();
		} );

		it( 'should stay controlled when a direct state setter clears the value', async () => {
			const user = setupUserEvent();

			function CalendarWithDirectStateSetter() {
				const [ value, setValue ] = useState< Date | null >( today );
				return <Calendar value={ value } onValueChange={ setValue } />;
			}

			render( <CalendarWithDirectStateSetter /> );
			await user.click( getDateButton( today ) );

			expect(
				screen.queryByRole( 'gridcell', { selected: true } )
			).not.toBeInTheDocument();
		} );

		it( 'should select a date in uncontrolled mode via the `defaultValue` prop even if the date is disabled`', () => {
			render(
				<Calendar defaultValue={ tomorrow } disabled={ tomorrow } />
			);

			expect( getDateCell( tomorrow, { selected: true } ) ).toBeVisible();

			const tomorrowButton = getDateButton( tomorrow );
			expect( tomorrowButton ).toBeVisible();
			expect( tomorrowButton ).toHaveAccessibleName( /selected/i );
			expect( tomorrowButton ).toBeDisabled();
		} );

		it( 'should select a date in controlled mode via the `value` prop even if the date is disabled`', () => {
			render( <Calendar value={ tomorrow } disabled={ tomorrow } /> );

			expect( getDateCell( tomorrow, { selected: true } ) ).toBeVisible();

			const tomorrowButton = getDateButton( tomorrow );
			expect( tomorrowButton ).toBeVisible();
			expect( tomorrowButton ).toHaveAccessibleName( /selected/i );
			expect( tomorrowButton ).toBeDisabled();
		} );

		describe.each( [
			[ 'Uncontrolled', UncontrolledCalendar ],
			[ 'Controlled', ControlledCalendar ],
		] )( '[`%s`]', ( _mode, Component ) => {
			it( 'should select a date when a date button is clicked', async () => {
				const user = setupUserEvent();
				const onValueChange = jest.fn();

				render( <Component onValueChange={ onValueChange } /> );

				const todayButton = getDateButton( today );
				await user.click( todayButton );

				expect( onValueChange ).toHaveBeenCalledTimes( 1 );
				expect( onValueChange ).toHaveBeenCalledWith(
					today,
					today,
					expect.objectContaining( { today: true } ),
					expect.objectContaining( {
						type: 'click',
						target: todayButton,
					} )
				);

				expect(
					getDateCell( today, { selected: true } )
				).toBeVisible();
			} );

			it( 'should not select a disabled date when a date button is clicked', async () => {
				const user = setupUserEvent();
				const onValueChange = jest.fn();

				render(
					<Component
						onValueChange={ onValueChange }
						disabled={ tomorrow }
					/>
				);

				await user.click( getDateButton( tomorrow ) );

				expect( onValueChange ).not.toHaveBeenCalled();
				expect(
					screen.queryByRole( 'button', { name: /selected/i } )
				).not.toBeInTheDocument();
			} );

			it( 'should select a new date when a different date button is clicked', async () => {
				const user = setupUserEvent();
				const onValueChange = jest.fn();

				render(
					<Component
						initialSelected={ today }
						onValueChange={ onValueChange }
					/>
				);

				const tomorrowButton = getDateButton( tomorrow );
				await user.click( tomorrowButton );

				expect( onValueChange ).toHaveBeenCalledTimes( 1 );
				expect( onValueChange ).toHaveBeenCalledWith(
					tomorrow,
					tomorrow,
					expect.objectContaining( { today: false } ),
					expect.objectContaining( {
						type: 'click',
						target: tomorrowButton,
					} )
				);

				expect(
					getDateCell( tomorrow, { selected: true } )
				).toBeVisible();
			} );

			it( 'should de-select the selected date when the selected date button is clicked', async () => {
				const user = setupUserEvent();
				const onValueChange = jest.fn();

				const { rerender } = render(
					<Component
						initialSelected={ today }
						onValueChange={ onValueChange }
					/>
				);

				const todayButton = getDateButton( today );
				await user.click( todayButton );

				expect( onValueChange ).toHaveBeenCalledTimes( 1 );
				expect( onValueChange ).toHaveBeenCalledWith(
					null,
					today,
					expect.objectContaining( { today: true, selected: true } ),
					expect.objectContaining( {
						type: 'click',
						target: todayButton,
					} )
				);

				expect(
					queryDateCell( today, { selected: true } )
				).not.toBeInTheDocument();

				rerender(
					<Component
						initialSelected={ today }
						onValueChange={ onValueChange }
					/>
				);
				expect(
					queryDateCell( today, { selected: true } )
				).not.toBeInTheDocument();
			} );

			it( 'should not de-select the selected date when the selected date button is clicked if the `required` prop is set to `true`', async () => {
				const user = setupUserEvent();
				const onValueChange = jest.fn();

				render(
					<Component
						initialSelected={ today }
						onValueChange={ onValueChange }
						required
					/>
				);

				const todayButton = getDateButton( today );
				await user.click( todayButton );

				expect( onValueChange ).toHaveBeenCalledTimes( 1 );
				expect( onValueChange ).toHaveBeenCalledWith(
					today,
					today,
					expect.objectContaining( { today: true, selected: true } ),
					expect.objectContaining( {
						type: 'click',
						target: todayButton,
					} )
				);
				expect(
					queryDateCell( today, { selected: true } )
				).toBeVisible();
			} );
		} );
	} );

	describe( 'Month navigation', () => {
		it( 'should select an initial month in uncontrolled mode via the `defaultMonth` prop', () => {
			render( <Calendar defaultMonth={ nextMonth } /> );

			expect(
				screen.getByRole( 'grid', {
					name: monthNameFormatter( 'en-US' ).format( nextMonth ),
				} )
			).toBeVisible();
			expect( getDateCell( nextMonth ) ).toBeVisible();
			expect( getDateButton( nextMonth ) ).toBeVisible();
		} );

		it( 'should select an initial month in controlled mode via the `month` prop', () => {
			render( <Calendar month={ nextMonth } /> );

			expect(
				screen.getByRole( 'grid', {
					name: monthNameFormatter( 'en-US' ).format( nextMonth ),
				} )
			).toBeVisible();
			expect( getDateCell( nextMonth ) ).toBeVisible();
			expect( getDateButton( nextMonth ) ).toBeVisible();
		} );

		describe.each( [
			[ 'Uncontrolled', UncontrolledCalendar ],
			[ 'Controlled', ControlledCalendar ],
		] )( '[`%s`]', ( _mode, Component ) => {
			it( 'should navigate to the previous and next months when the previous and next month buttons are clicked', async () => {
				const user = setupUserEvent();
				const onMonthChange = jest.fn();

				render( <Component onMonthChange={ onMonthChange } /> );

				const prevButton = screen.getByRole( 'button', {
					name: /previous month/i,
				} );
				const nextButton = screen.getByRole( 'button', {
					name: /next month/i,
				} );
				await user.click( prevButton );

				expect( onMonthChange ).toHaveBeenCalledTimes( 1 );
				expect( onMonthChange ).toHaveBeenCalledWith( prevMonth );

				expect(
					screen.getByRole( 'grid', {
						name: monthNameFormatter( 'en-US' ).format( prevMonth ),
					} )
				).toBeVisible();
				expect( getDateCell( prevMonth ) ).toBeVisible();
				expect( getDateButton( prevMonth ) ).toBeVisible();

				await user.click( nextButton );

				expect( onMonthChange ).toHaveBeenCalledTimes( 2 );
				expect( onMonthChange ).toHaveBeenCalledWith( currentMonth );

				expect(
					screen.getByRole( 'grid', {
						name: monthNameFormatter( 'en-US' ).format(
							currentMonth
						),
					} )
				).toBeVisible();
				expect( getDateCell( currentMonth ) ).toBeVisible();
				expect( getDateButton( currentMonth ) ).toBeVisible();

				await user.click( nextButton );

				expect( onMonthChange ).toHaveBeenCalledTimes( 3 );
				expect( onMonthChange ).toHaveBeenCalledWith( nextMonth );

				expect(
					screen.getByRole( 'grid', {
						name: monthNameFormatter( 'en-US' ).format( nextMonth ),
					} )
				).toBeVisible();
				expect( getDateCell( nextMonth ) ).toBeVisible();
				expect( getDateButton( nextMonth ) ).toBeVisible();
			} );

			it( 'should not navigate to a month that is before the `startMonth` prop', async () => {
				const user = setupUserEvent();
				const onMonthChange = jest.fn();

				render(
					<Component
						startMonth={ nextMonth }
						onMonthChange={ onMonthChange }
					/>
				);

				const prevButton = screen.getByRole( 'button', {
					name: /previous month/i,
				} );
				const nextButton = screen.getByRole( 'button', {
					name: /next month/i,
				} );

				expect(
					screen.getByRole( 'grid', {
						name: monthNameFormatter( 'en-US' ).format( nextMonth ),
					} )
				).toBeVisible();
				expect( getDateCell( nextMonth ) ).toBeVisible();
				expect( getDateButton( nextMonth ) ).toBeVisible();

				expect( prevButton ).toHaveAttribute( 'aria-disabled', 'true' );

				await user.click( prevButton );

				expect( onMonthChange ).not.toHaveBeenCalled();

				await user.click( nextButton );

				expect( onMonthChange ).toHaveBeenCalledTimes( 1 );
				expect( onMonthChange ).toHaveBeenCalledWith( nextNextMonth );

				expect(
					screen.getByRole( 'grid', {
						name: monthNameFormatter( 'en-US' ).format(
							nextNextMonth
						),
					} )
				).toBeVisible();
				expect( getDateCell( nextNextMonth ) ).toBeVisible();
				expect( getDateButton( nextNextMonth ) ).toBeVisible();

				expect( prevButton ).toHaveAttribute(
					'aria-disabled',
					'false'
				);
			} );

			it( 'should not navigate to a month that is after the `endMonth` prop', async () => {
				const user = setupUserEvent();
				const onMonthChange = jest.fn();

				render(
					<Component
						endMonth={ prevMonth }
						onMonthChange={ onMonthChange }
					/>
				);

				const prevButton = screen.getByRole( 'button', {
					name: /previous month/i,
				} );
				const nextButton = screen.getByRole( 'button', {
					name: /next month/i,
				} );

				expect(
					screen.getByRole( 'grid', {
						name: monthNameFormatter( 'en-US' ).format( prevMonth ),
					} )
				).toBeVisible();
				expect( getDateCell( prevMonth ) ).toBeVisible();
				expect( getDateButton( prevMonth ) ).toBeVisible();

				expect( nextButton ).toHaveAttribute( 'aria-disabled', 'true' );

				await user.click( nextButton );

				expect( onMonthChange ).not.toHaveBeenCalled();

				await user.click( prevButton );

				expect( onMonthChange ).toHaveBeenCalledTimes( 1 );
				expect( onMonthChange ).toHaveBeenCalledWith( prevPrevMonth );

				expect(
					screen.getByRole( 'grid', {
						name: monthNameFormatter( 'en-US' ).format(
							prevPrevMonth
						),
					} )
				).toBeVisible();
				expect( getDateCell( prevPrevMonth ) ).toBeVisible();
				expect( getDateButton( prevPrevMonth ) ).toBeVisible();

				expect( nextButton ).toHaveAttribute(
					'aria-disabled',
					'false'
				);
			} );
		} );
	} );

	describe( 'Keyboard focus and navigation', () => {
		it( 'should keep day focus when the controlled month changes', () => {
			const selectedNextMonth = addMonths( today, 1 );
			const { rerender } = render(
				<Calendar month={ currentMonth } value={ today } />
			);

			act( () => getDateButton( today ).focus() );

			rerender(
				<Calendar month={ nextMonth } value={ selectedNextMonth } />
			);

			expect( getDateButton( selectedNextMonth ) ).toHaveFocus();
		} );

		it( 'should keep tracking focus when the controlled date changes within the displayed month', () => {
			const selectedNextMonth = addMonths( today, 1 );
			const { rerender } = render(
				<Calendar month={ today } value={ today } />
			);

			act( () => getDateButton( today ).focus() );
			rerender( <Calendar month={ tomorrow } value={ tomorrow } /> );
			rerender(
				<Calendar
					month={ selectedNextMonth }
					value={ selectedNextMonth }
				/>
			);

			expect( getDateButton( selectedNextMonth ) ).toHaveFocus();
		} );

		it( 'should keep tracking focus when the focused day remains in a later displayed month', () => {
			const selectedNextMonth = addMonths( today, 1 );
			const { rerender } = render(
				<Calendar
					month={ currentMonth }
					numberOfMonths={ 2 }
					value={ today }
				/>
			);

			act( () => getDateButton( today ).focus() );
			rerender(
				<Calendar
					month={ prevMonth }
					numberOfMonths={ 2 }
					value={ today }
				/>
			);
			expect( getDateButton( today ) ).toHaveFocus();
			rerender(
				<Calendar
					month={ nextMonth }
					numberOfMonths={ 2 }
					value={ selectedNextMonth }
				/>
			);

			expect( getDateButton( selectedNextMonth ) ).toHaveFocus();
		} );

		it( 'should not move outside focus when the controlled month changes', () => {
			const { rerender } = render(
				<>
					<button>Outside control</button>
					<Calendar month={ currentMonth } value={ today } />
				</>
			);
			const outsideControl = screen.getByRole( 'button', {
				name: 'Outside control',
			} );

			act( () => outsideControl.focus() );
			rerender(
				<>
					<button>Outside control</button>
					<Calendar
						month={ nextMonth }
						value={ addMonths( today, 1 ) }
					/>
				</>
			);

			expect( outsideControl ).toHaveFocus();
		} );

		it( 'should keep focus inside the component when the new month has no enabled day', () => {
			const { rerender } = render(
				<Calendar month={ currentMonth } value={ today } />
			);

			act( () => getDateButton( today ).focus() );
			rerender(
				<Calendar
					month={ nextMonth }
					value={ addMonths( today, 1 ) }
					disabled
				/>
			);

			expect(
				screen.getByRole( 'button', { name: /previous month/i } )
			).toHaveFocus();
		} );

		it( 'should keep focus inside when the controlled month changes and the calendar becomes fully disabled', () => {
			const { rerender } = render(
				<Calendar month={ currentMonth } value={ today } />
			);

			act( () => getDateButton( today ).focus() );
			rerender(
				<Calendar
					month={ nextMonth }
					value={ addMonths( today, 1 ) }
					disabled
					disableNavigation
				/>
			);

			expect(
				screen.getByRole( 'button', { name: /previous month/i } )
			).toHaveFocus();
		} );

		it( 'should auto-focus the selected day when the `autoFocus` prop is set to `true`', async () => {
			// eslint-disable-next-line jsx-a11y/no-autofocus
			render( <Calendar autoFocus defaultValue={ tomorrow } /> );
			expect( getDateButton( tomorrow ) ).toHaveFocus();
		} );

		it( "should auto-focus today's date if there is not selected date when the `autoFocus` prop is set to `true`", async () => {
			// eslint-disable-next-line jsx-a11y/no-autofocus
			render( <Calendar autoFocus /> );
			expect( getDateButton( today ) ).toHaveFocus();
		} );

		it( 'should focus each arrow as a tab stop, but treat the grid as a 2d composite widget', async () => {
			const user = setupUserEvent();
			render( <Calendar /> );

			// Focus previous month button
			await user.tab();
			expect(
				screen.getByRole( 'button', { name: /previous month/i } )
			).toHaveFocus();

			// Focus next month button
			await user.tab();
			expect(
				screen.getByRole( 'button', { name: /next month/i } )
			).toHaveFocus();

			// Focus today button
			await user.tab();
			expect( getDateButton( today ) ).toHaveFocus();

			// Focus next day
			await user.keyboard( '{ArrowRight}' );
			expect( getDateButton( addDays( today, 1 ) ) ).toHaveFocus();

			// Focus to next week
			await user.keyboard( '{ArrowDown}' );
			expect( getDateButton( addDays( today, 8 ) ) ).toHaveFocus();

			// Focus previous day
			await user.keyboard( '{ArrowLeft}' );
			expect( getDateButton( addDays( today, 7 ) ) ).toHaveFocus();

			// Focus previous week
			await user.keyboard( '{ArrowUp}' );
			expect( getDateButton( today ) ).toHaveFocus();

			// Focus first day of week
			await user.keyboard( '{Home}' );
			expect( getDateButton( startOfWeek( today ) ) ).toHaveFocus();

			// Focus last day of week
			await user.keyboard( '{End}' );
			expect( getDateButton( endOfWeek( today ) ) ).toHaveFocus();

			// Focus previous month
			await user.keyboard( '{PageUp}' );
			expect(
				getDateButton( subMonths( endOfWeek( today ), 1 ) )
			).toHaveFocus();

			expect(
				screen.getByRole( 'grid', {
					name: monthNameFormatter( 'en-US' ).format(
						subMonths( endOfWeek( today ), 1 )
					),
				} )
			).toBeVisible();

			// Navigate to next month
			await user.keyboard( '{PageDown}' );
			expect( getDateButton( endOfWeek( today ) ) ).toHaveFocus();
			expect(
				screen.getByRole( 'grid', {
					name: monthNameFormatter( 'en-US' ).format(
						endOfWeek( today )
					),
				} )
			).toBeVisible();

			// Focus previous year
			await user.keyboard( '{Shift>}{PageUp}{/Shift}' );
			expect(
				getDateButton( subYears( endOfWeek( today ), 1 ) )
			).toHaveFocus();

			expect(
				screen.getByRole( 'grid', {
					name: monthNameFormatter( 'en-US' ).format(
						subYears( endOfWeek( today ), 1 )
					),
				} )
			).toBeVisible();

			// Focus next year
			await user.keyboard( '{Shift>}{PageDown}{/Shift}' );
			expect( getDateButton( endOfWeek( today ) ) ).toHaveFocus();

			expect(
				screen.getByRole( 'grid', {
					name: monthNameFormatter( 'en-US' ).format(
						endOfWeek( today )
					),
				} )
			).toBeVisible();
		} );

		// Note: the following test is not testing advanced keyboard interactions
		// (pageUp, pageDown, shift+pageUp, shift+pageDown, home, end)
		it( 'should not focus disabled dates and skip over them when navigating using arrow keys', async () => {
			const user = setupUserEvent();

			render(
				<Calendar
					disabled={ [
						tomorrow,
						addWeeks( addDays( tomorrow, 1 ), 1 ),
						addWeeks( today, 2 ),
						addWeeks( tomorrow, 2 ),
					] }
				/>
			);

			await user.tab();
			await user.tab();
			await user.tab();
			expect( getDateButton( today ) ).toHaveFocus();

			await user.keyboard( '{ArrowRight}' );
			expect( getDateButton( addDays( tomorrow, 1 ) ) ).toHaveFocus();

			await user.keyboard( '{ArrowDown}' );
			expect(
				getDateButton( addWeeks( addDays( tomorrow, 1 ), 2 ) )
			).toHaveFocus();

			await user.keyboard( '{ArrowLeft}' );
			expect( getDateButton( addWeeks( yesterday, 2 ) ) ).toHaveFocus();

			await user.keyboard( '{ArrowUp}' );
			expect( getDateButton( addWeeks( yesterday, 1 ) ) ).toHaveFocus();
		} );

		it( 'should focus the selected date when tabbing into the calendar', async () => {
			const user = setupUserEvent();
			render( <Calendar value={ tomorrow } /> );

			// Tab to the calendar grid
			await user.tab();
			await user.tab();
			await user.tab();

			expect( getDateButton( tomorrow ) ).toHaveFocus();
		} );
	} );

	describe( 'Disabled states', () => {
		it( 'should support disabling all dates via the `disabled` prop', async () => {
			const user = setupUserEvent();

			render( <Calendar disabled /> );

			within( screen.getByRole( 'grid' ) )
				.getAllByRole( 'button' )
				.forEach( ( button ) => {
					expect( button ).toBeDisabled();
				} );

			await user.click(
				screen.getByRole( 'button', { name: /previous/i } )
			);

			within( screen.getByRole( 'grid' ) )
				.getAllByRole( 'button' )
				.forEach( ( button ) => {
					expect( button ).toBeDisabled();
				} );

			await user.click( screen.getByRole( 'button', { name: /next/i } ) );
			await user.click( screen.getByRole( 'button', { name: /next/i } ) );

			within( screen.getByRole( 'grid' ) )
				.getAllByRole( 'button' )
				.forEach( ( button ) => {
					expect( button ).toBeDisabled();
				} );
		} );

		it( 'should support disabling single dates via the `disabled` prop', async () => {
			render( <Calendar disabled={ tomorrow } /> );

			expect( getDateButton( tomorrow ) ).toBeDisabled();
		} );

		it( 'should support passing a custom function via the `disabled` prop', async () => {
			const primeNumbers = [ 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31 ];
			render(
				<Calendar
					disabled={ ( date ) =>
						primeNumbers.includes( date.getDate() )
					}
				/>
			);

			for ( const date of primeNumbers ) {
				expect(
					getDateButton(
						new Date( today.getFullYear(), today.getMonth(), date )
					)
				).toBeDisabled();
			}
		} );

		it( 'should support disabling all dates before a certain date via the `disabled` prop', async () => {
			render( <Calendar disabled={ { before: today } } /> );

			for ( let date = 1; date < today.getDate(); date++ ) {
				expect(
					getDateButton(
						new Date( today.getFullYear(), today.getMonth(), date )
					)
				).toBeDisabled();
			}
			expect( getDateButton( today ) ).toBeEnabled();
		} );

		it( 'should support disabling all dates after a certain date via the `disabled` prop', async () => {
			render( <Calendar disabled={ { after: today } } /> );

			for ( let date = today.getDate() + 1; date < 32; date++ ) {
				expect(
					getDateButton(
						new Date( today.getFullYear(), today.getMonth(), date )
					)
				).toBeDisabled();
			}
			expect( getDateButton( today ) ).toBeEnabled();
		} );

		it( 'should support disabling all dates before a certain date and after a certain date via the `disabled` prop', async () => {
			render(
				<Calendar
					disabled={ {
						before: yesterday,
						after: addDays( today, 1 ),
					} }
				/>
			);

			let date;

			for ( date = 1; date < today.getDate() - 1; date++ ) {
				expect(
					getDateButton(
						new Date( today.getFullYear(), today.getMonth(), date )
					)
				).toBeDisabled();
			}
			expect( getDateButton( yesterday ) ).toBeEnabled();
			expect( getDateButton( today ) ).toBeEnabled();
			expect( getDateButton( addDays( today, 1 ) ) ).toBeEnabled();

			for ( date = today.getDate() + 2; date < 32; date++ ) {
				expect(
					getDateButton(
						new Date( today.getFullYear(), today.getMonth(), date )
					)
				).toBeDisabled();
			}
		} );

		it( 'should support disabling all dates within a certain date range via the `disabled` prop', async () => {
			render(
				<Calendar
					disabled={ { from: yesterday, to: addDays( today, 1 ) } }
				/>
			);

			let date;

			for ( date = 1; date < today.getDate() - 1; date++ ) {
				expect(
					getDateButton(
						new Date( today.getFullYear(), today.getMonth(), date )
					)
				).toBeEnabled();
			}
			expect( getDateButton( yesterday ) ).toBeDisabled();
			expect( getDateButton( today ) ).toBeDisabled();
			expect( getDateButton( addDays( today, 1 ) ) ).toBeDisabled();

			for ( date = today.getDate() + 2; date < 32; date++ ) {
				expect(
					getDateButton(
						new Date( today.getFullYear(), today.getMonth(), date )
					)
				).toBeEnabled();
			}
		} );

		it( 'should support disabling specific days of the week via the `disabled` prop', async () => {
			const weekendsInMay = [ 3, 4, 10, 11, 17, 18, 24, 25, 31 ];
			render( <Calendar disabled={ { dayOfWeek: [ 0, 6 ] } } /> );

			for ( const date of weekendsInMay ) {
				expect(
					getDateButton(
						new Date( today.getFullYear(), today.getMonth(), date )
					)
				).toBeDisabled();
			}
		} );

		it( 'should disable the previous and next months buttons if the `disableNavigation` is set to `true`', async () => {
			const user = setupUserEvent();

			render( <Calendar disableNavigation /> );

			expect(
				screen.getByRole( 'button', { name: /previous month/i } )
			).toHaveAttribute( 'aria-disabled', 'true' );
			expect(
				screen.getByRole( 'button', { name: /next month/i } )
			).toHaveAttribute( 'aria-disabled', 'true' );

			await user.tab();
			expect(
				screen.getByRole( 'button', { name: /today/i } )
			).toHaveFocus();
		} );
	} );

	// Note: we're not testing localization of strings. We're only testing
	// that the date formatting, computed dir, and calendar format are correct.
	describe( 'Localization', () => {
		it( 'should localize the calendar based on the `locale` prop', async () => {
			const user = setupUserEvent();

			render( <Calendar locale={ ar } /> );

			// Check computed writing direction
			expect(
				screen.getByRole( 'application', { name: 'Date calendar' } )
			).toHaveAttribute( 'dir', 'rtl' );

			// Check month name
			const grid = screen.getByRole( 'grid', {
				name: monthNameFormatter( 'ar' ).format( today ),
			} );
			expect( grid ).toBeVisible();

			// Check today button
			expect( getDateButton( today, {}, 'ar' ) ).toHaveAccessibleName(
				/today/i
			);

			await user.tab();
			await user.tab();
			await user.tab();
			expect( getDateButton( today, {}, 'ar' ) ).toHaveFocus();

			await user.keyboard( '{Home}' );
			expect(
				getDateButton( startOfWeek( today, { locale: ar } ), {}, 'ar' )
			).toHaveFocus();
		} );

		it( 'should support timezones according to the `timeZone` prop', async () => {
			const user = setupUserEvent();
			const onValueChange = jest.fn();

			render(
				<Calendar
					timeZone="Asia/Tokyo"
					onValueChange={ onValueChange }
				/>
			);

			// For someone in Tokyo, the current time simulated in the test
			// (ie. 20:00 UTC) is the next day.
			expect( getDateButton( tomorrow ) ).toHaveAccessibleName(
				/today/i
			);

			// Select tomorrow's button (which is today in Tokyo)
			const tomorrowButton = getDateButton( tomorrow );
			await user.click( tomorrowButton );

			const tomorrowFromTokyoTimezone = addHours(
				tomorrow,
				new TZDate( tomorrow, 'Asia/Tokyo' ).getTimezoneOffset() / 60
			);

			expect( onValueChange ).toHaveBeenCalledWith(
				tomorrowFromTokyoTimezone,
				tomorrowFromTokyoTimezone,
				expect.objectContaining( { today: true } ),
				expect.objectContaining( {
					type: 'click',
					target: tomorrowButton,
				} )
			);
		} );

		it( 'should handle timezoned dates and convert them to the calendar timezone', async () => {
			// Still the same time from UTC's POV, just expressed in Tokyo time.
			const tomorrowAtMidnightInTokyo = new TZDate(
				tomorrow,
				'Asia/Tokyo'
			);

			render(
				<Calendar
					defaultValue={ tomorrowAtMidnightInTokyo }
					// Note: using "Etc/GMT+2" instead of "-02:00" because support for raw offsets was introduced in Node v22 (while currently the repository still targets Node v20).
					timeZone="Etc/GMT+2"
				/>
			);

			// Changing the calendar timezone to UTC-2 makes the dates become
			// earlier by 1 day (from midnight to 10pm the previous day).
			expect( getDateCell( today, { selected: true } ) ).toBeVisible();
		} );
	} );
} );
