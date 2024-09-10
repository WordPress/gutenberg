/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
import { addYears, getYear, set, startOfToday, subYears } from 'date-fns';

/**
 * Internal dependencies
 */
import { Month, useLilius } from '../use-lilius';

const getDate = ( {
	year = 1999,
	month = Month.NOVEMBER,
	date = 24,
	hours = 0,
	minutes = 0,
	seconds = 0,
	milliseconds = 0,
}: {
	year?: number;
	month?: number;
	date?: number;
	hours?: number;
	minutes?: number;
	seconds?: number;
	milliseconds?: number;
} = {} ) => {
	return set( new Date(), {
		year,
		month,
		date,
		hours,
		minutes,
		seconds,
		milliseconds,
	} );
};

describe( 'helpers', () => {
	describe( 'clearTime', () => {
		it( 'returns a copy of the given date with the time set to 00:00:00:00', () => {
			const { result } = renderHook( () => useLilius() );

			const date = getDate( { hours: 7, minutes: 30 } );

			expect( result.current.clearTime( date ) ).toStrictEqual(
				set( date, {
					hours: 0,
					minutes: 0,
					seconds: 0,
					milliseconds: 0,
				} )
			);
		} );
	} );

	describe( 'inRange', () => {
		it( 'returns whether or not a date is between 2 other dates (inclusive)', () => {
			const { result } = renderHook( () => useLilius() );

			const date = getDate();
			const min = subYears( date, 1 );
			const max = addYears( date, 1 );

			expect( result.current.inRange( date, min, max ) ).toBe( true );
			expect(
				result.current.inRange( addYears( date, 10 ), min, max )
			).toBe( false );
		} );
	} );
} );

describe( 'viewing', () => {
	describe( 'viewing', () => {
		it( 'returns the date represented in the calendar matrix', () => {
			const date = getDate();

			const { result } = renderHook( () =>
				useLilius( { viewing: date } )
			);

			expect( result.current.viewing ).toStrictEqual( date );
		} );
	} );

	describe( 'setViewing', () => {
		it( 'sets the date represented in the calendar matrix', () => {
			const { result } = renderHook( () => useLilius() );

			const date = getDate();

			act( () => result.current.setViewing( date ) );
			expect( result.current.viewing ).toStrictEqual( date );
		} );
	} );

	describe( 'viewToday', () => {
		it( 'sets the viewing date to today', () => {
			const { result } = renderHook( () =>
				useLilius( { viewing: getDate( { year: 1999 } ) } )
			);

			act( () => result.current.viewToday() );
			expect( result.current.viewing ).toStrictEqual( startOfToday() );
		} );
	} );

	describe( 'viewMonth', () => {
		it( 'sets the viewing date to the given month', () => {
			const date = getDate( { month: Month.JANUARY } );

			const { result } = renderHook( () =>
				useLilius( { viewing: date } )
			);

			act( () => result.current.viewMonth( Month.FEBRUARY ) );
			expect( result.current.viewing ).toStrictEqual(
				set( date, { month: Month.FEBRUARY } )
			);
		} );
	} );

	describe( 'viewPreviousMonth', () => {
		it( 'sets the viewing date to the month before the current', () => {
			const { result } = renderHook( () => useLilius() );

			const date = getDate( { month: Month.OCTOBER } );

			act( () => result.current.setViewing( date ) );
			act( () => result.current.viewPreviousMonth() );
			expect( result.current.viewing ).toStrictEqual(
				set( date, { month: Month.SEPTEMBER } )
			);
		} );

		it( 'wraps to december of the previous year if the current month is january', () => {
			const { result } = renderHook( () => useLilius() );

			const date = getDate( { month: Month.JANUARY } );

			act( () => result.current.setViewing( date ) );
			act( () => result.current.viewPreviousMonth() );
			expect( result.current.viewing ).toStrictEqual(
				set( date, {
					month: Month.DECEMBER,
					year: getYear( date ) - 1,
				} )
			);
		} );
	} );

	describe( 'viewNextMonth', () => {
		it( 'sets the viewing date to the month after the current', () => {
			const { result } = renderHook( () => useLilius() );

			const date = getDate( { month: Month.OCTOBER } );

			act( () => result.current.setViewing( date ) );
			act( () => result.current.viewNextMonth() );
			expect( result.current.viewing ).toStrictEqual(
				set( date, { month: Month.NOVEMBER } )
			);
		} );

		it( 'wraps to january of the next year if the current month is december', () => {
			const { result } = renderHook( () => useLilius() );

			const date = getDate( { month: Month.DECEMBER } );

			act( () => result.current.setViewing( date ) );
			act( () => result.current.viewNextMonth() );
			expect( result.current.viewing ).toStrictEqual(
				set( date, { month: Month.JANUARY, year: getYear( date ) + 1 } )
			);
		} );
	} );

	describe( 'viewYear', () => {
		it( 'sets the viewing date to the given year', () => {
			const date = getDate( { year: 1999 } );

			const { result } = renderHook( () =>
				useLilius( { viewing: date } )
			);

			act( () => result.current.viewYear( 1997 ) );
			expect( result.current.viewing ).toStrictEqual(
				set( date, { year: 1997 } )
			);
		} );
	} );

	describe( 'viewPreviousYear', () => {
		it( 'sets the viewing date to the year before the current', () => {
			const date = getDate( { year: 1999 } );

			const { result } = renderHook( () =>
				useLilius( { viewing: date } )
			);

			act( () => result.current.viewPreviousYear() );
			expect( result.current.viewing ).toStrictEqual(
				set( date, { year: 1998 } )
			);
		} );
	} );

	describe( 'viewNextYear', () => {
		it( 'sets the viewing date to the year after the current', () => {
			const date = getDate( { year: 1999 } );

			const { result } = renderHook( () =>
				useLilius( { viewing: date } )
			);

			act( () => result.current.viewNextYear() );
			expect( result.current.viewing ).toStrictEqual(
				set( date, { year: 2000 } )
			);
		} );
	} );
} );

describe( 'selected', () => {
	describe( 'selected', () => {
		it( 'returns the dates currently selected', () => {
			const date = getDate();

			const { result } = renderHook( () =>
				useLilius( {
					selected: [ date ],
				} )
			);

			expect( result.current.selected ).toStrictEqual( [ date ] );
		} );
	} );

	describe( 'clearSelected', () => {
		it( 'resets the selected dates to []', () => {
			const { result } = renderHook( () => useLilius() );

			const date = getDate();

			act( () =>
				result.current.selectRange(
					set( date, { date: 1 } ),
					set( date, { date: 5 } )
				)
			);
			expect( result.current.selected.length ).toBe( 5 );

			act( () => result.current.clearSelected() );
			expect( result.current.selected.length ).toBe( 0 );
		} );
	} );

	describe( 'isSelected', () => {
		it( 'returns whether or not a date has been selected', () => {
			const date = getDate();

			const { result } = renderHook( () =>
				useLilius( {
					selected: [ date ],
				} )
			);

			expect( result.current.isSelected( date ) ).toBe( true );
		} );
	} );

	describe( 'select', () => {
		it( 'selects a date', () => {
			const { result } = renderHook( () => useLilius() );

			const date = getDate();

			act( () => result.current.select( date ) );
			expect( result.current.isSelected( date ) ).toBe( true );
		} );

		it( 'selects multiple dates', () => {
			const { result } = renderHook( () => useLilius() );

			const dateOne = getDate( { date: 1 } );
			const dateTwo = getDate( { date: 2 } );

			act( () => result.current.select( [ dateOne, dateTwo ] ) );
			expect( result.current.isSelected( dateOne ) ).toBe( true );
			expect( result.current.isSelected( dateTwo ) ).toBe( true );
		} );
	} );

	describe( 'deselect', () => {
		it( 'deselects a date', () => {
			const { result } = renderHook( () => useLilius() );

			const date = getDate();

			act( () => result.current.select( date ) );
			act( () => result.current.deselect( date ) );
			expect( result.current.isSelected( date ) ).toBe( false );
		} );

		it( 'deselects multiple dates', () => {
			const { result } = renderHook( () => useLilius() );

			const dateOne = getDate( { date: 1 } );
			const dateTwo = getDate( { date: 2 } );

			act( () => result.current.select( [ dateOne, dateTwo ] ) );
			act( () => result.current.deselect( [ dateOne, dateTwo ] ) );
			expect( result.current.isSelected( dateOne ) ).toBe( false );
			expect( result.current.isSelected( dateTwo ) ).toBe( false );
		} );
	} );

	describe( 'toggle', () => {
		it( 'toggles the selection of a date', () => {
			const { result } = renderHook( () => useLilius() );

			const date = getDate();

			act( () => result.current.toggle( date ) );
			expect( result.current.isSelected( date ) ).toBe( true );

			act( () => result.current.toggle( date ) );
			expect( result.current.isSelected( date ) ).toBe( false );
		} );
	} );

	describe( 'selectRange', () => {
		it( 'selects a range of dates (inclusive)', () => {
			const { result } = renderHook( () => useLilius() );

			const date = getDate();

			const first = set( date, { date: 1 } );
			const second = set( date, { date: 2 } );
			const third = set( date, { date: 3 } );

			act( () => result.current.selectRange( first, third ) );

			expect( result.current.selected.length ).toBe( 3 );
			expect( result.current.isSelected( first ) ).toBe( true );
			expect( result.current.isSelected( second ) ).toBe( true );
			expect( result.current.isSelected( third ) ).toBe( true );
		} );
	} );

	describe( 'deselectRange', () => {
		it( 'deselects a range of dates (inclusive)', () => {
			const { result } = renderHook( () => useLilius() );

			const date = getDate();

			act( () =>
				result.current.selectRange(
					set( date, { date: 1 } ),
					set( date, { date: 3 } )
				)
			);
			act( () =>
				result.current.deselectRange(
					set( date, { date: 1 } ),
					set( date, { date: 3 } )
				)
			);

			expect( result.current.selected.length ).toBe( 0 );
			expect(
				result.current.isSelected( set( date, { date: 1 } ) )
			).toBe( false );
			expect(
				result.current.isSelected( set( date, { date: 2 } ) )
			).toBe( false );
			expect(
				result.current.isSelected( set( date, { date: 3 } ) )
			).toBe( false );
		} );
	} );
} );

describe( 'calendar', () => {
	it( 'returns a matrix of days based on the current viewing date', () => {
		const { result } = renderHook( () =>
			useLilius( { viewing: new Date( 1582, Month.OCTOBER, 1 ) } )
		);

		expect( result.current.calendar![ 0 ][ 0 ][ 0 ] ).toStrictEqual(
			new Date( 1582, Month.SEPTEMBER, 26 )
		);
		expect( result.current.calendar![ 0 ][ 0 ][ 5 ] ).toStrictEqual(
			new Date( 1582, Month.OCTOBER, 1 )
		);
		expect( result.current.calendar![ 0 ][ 5 ][ 6 ] ).toStrictEqual(
			new Date( 1582, Month.NOVEMBER, 6 )
		);
	} );

	it( 'supports returning multiple months', () => {
		const { result } = renderHook( () =>
			useLilius( {
				viewing: new Date( 1582, Month.OCTOBER, 1 ),
				numberOfMonths: 2,
			} )
		);

		expect( result.current.calendar![ 0 ][ 0 ][ 0 ] ).toStrictEqual(
			new Date( 1582, Month.SEPTEMBER, 26 )
		);
		expect( result.current.calendar![ 1 ][ 0 ][ 0 ] ).toStrictEqual(
			new Date( 1582, Month.OCTOBER, 31 )
		);
	} );
} );
