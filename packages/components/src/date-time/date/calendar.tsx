/**
 * External dependencies
 */
import {
	isSameDay,
	subMonths,
	addMonths,
	startOfDay,
	isEqual,
	addDays,
	subWeeks,
	addWeeks,
	isSameMonth,
	startOfWeek,
	endOfWeek,
} from 'date-fns';

/**
 * WordPress dependencies
 */
import { isRTL } from '@wordpress/i18n';
import { dateI18n } from '@wordpress/date';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Day from './day';
import { Calendar as StyledCalendar, DayOfWeek } from './styles';

type CalendarProps = {
	calendar: Date[][][];
	isInvalidDate?: ( date: Date ) => boolean;
	viewing: Date;
	isSelected: ( date: Date ) => boolean;
	onDayClick?: ( date: Date ) => void;
	onDayKeyDown?: ( date: Date ) => void;
	focusable: Date;
	events: { date: Date }[];
};

export function Calendar( {
	calendar,
	isInvalidDate,
	viewing,
	isSelected,
	onDayClick,
	onDayKeyDown,
	focusable,
	events,
}: CalendarProps ) {
	// Allows us to only programmatically focus() a day when focus was already
	// within the calendar. This stops us stealing focus from e.g. a TimePicker
	// input.
	const [ isFocusWithinCalendar, setIsFocusWithinCalendar ] =
		useState( false );

	return (
		<StyledCalendar
			onFocus={ () => setIsFocusWithinCalendar( true ) }
			onBlur={ () => setIsFocusWithinCalendar( false ) }
		>
			{ calendar[ 0 ][ 0 ].map( ( day ) => (
				<DayOfWeek key={ day.toString() }>
					{ dateI18n( 'D', day, -day.getTimezoneOffset() ) }
				</DayOfWeek>
			) ) }
			{ calendar[ 0 ].map( ( week ) =>
				week.map( ( day, index ) => {
					if ( ! isSameMonth( day, viewing ) ) {
						return null;
					}
					return (
						<Day
							key={ day.toString() }
							day={ day }
							column={ index + 1 }
							isSelected={ isSelected( day ) }
							isFocusable={ isEqual( day, focusable ) }
							isFocusAllowed={ isFocusWithinCalendar }
							isToday={ isSameDay( day, new Date() ) }
							isInvalid={
								isInvalidDate ? isInvalidDate( day ) : false
							}
							numEvents={
								events.filter( ( event ) =>
									isSameDay( event.date, day )
								).length
							}
							onClick={ () => {
								onDayClick?.( day );
							} }
							onKeyDown={ ( event ) => {
								let nextFocusable;
								if ( event.key === 'ArrowLeft' ) {
									nextFocusable = addDays(
										day,
										isRTL() ? 1 : -1
									);
								}
								if ( event.key === 'ArrowRight' ) {
									nextFocusable = addDays(
										day,
										isRTL() ? -1 : 1
									);
								}
								if ( event.key === 'ArrowUp' ) {
									nextFocusable = subWeeks( day, 1 );
								}
								if ( event.key === 'ArrowDown' ) {
									nextFocusable = addWeeks( day, 1 );
								}
								if ( event.key === 'PageUp' ) {
									nextFocusable = subMonths( day, 1 );
								}
								if ( event.key === 'PageDown' ) {
									nextFocusable = addMonths( day, 1 );
								}
								if ( event.key === 'Home' ) {
									nextFocusable = startOfWeek( day );
								}
								if ( event.key === 'End' ) {
									nextFocusable = startOfDay(
										endOfWeek( day )
									);
								}
								if ( nextFocusable ) {
									event.preventDefault();
									onDayKeyDown?.( nextFocusable );
								}
							} }
						/>
					);
				} )
			) }
		</StyledCalendar>
	);
}

export default Calendar;
