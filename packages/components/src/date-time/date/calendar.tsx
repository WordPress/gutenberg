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
	format,
} from 'date-fns';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { arrowLeft, arrowRight } from '@wordpress/icons';
import { dateI18n } from '@wordpress/date';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Day from './day';
import {
	Calendar as StyledCalendar,
	DayOfWeek,
	Navigator,
	NavigatorHeading,
} from './styles';
import { TIMEZONELESS_FORMAT } from '../constants';
import Button from '../../button';

type CalendarProps = {
	calendar: Date[][][];
	isInvalidDate?: ( date: Date ) => boolean;
	viewing: Date;
	isSelected: ( date: Date ) => boolean;
	onDayClick?: ( date: Date ) => void;
	onDayKeyDown?: ( date: Date ) => void;
	focusable: Date;
	events: { date: Date }[];
	viewPreviousMonth: () => void;
	viewNextMonth: () => void;
	setFocusable: React.Dispatch< React.SetStateAction< Date > >;
	onMonthPreviewed?: ( date: string ) => void;
	calendarIndex?: number;
	numberOfMonths?: number;
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
	viewPreviousMonth,
	viewNextMonth,
	setFocusable,
	onMonthPreviewed,
	calendarIndex = 0,
	numberOfMonths = 1,
}: CalendarProps ) {
	// Allows us to only programmatically focus() a day when focus was already
	// within the calendar. This stops us stealing focus from e.g. a TimePicker
	// input.
	const [ isFocusWithinCalendar, setIsFocusWithinCalendar ] =
		useState( false );

	return (
		<>
			<Navigator>
				{ calendarIndex === 0 && (
					<Button
						icon={ isRTL() ? arrowRight : arrowLeft }
						variant="tertiary"
						aria-label={ __( 'View previous month' ) }
						onClick={ () => {
							viewPreviousMonth();
							setFocusable( subMonths( focusable, 1 ) );
							onMonthPreviewed?.(
								format(
									subMonths( viewing, 1 ),
									TIMEZONELESS_FORMAT
								)
							);
						} }
					/>
				) }
				<NavigatorHeading level={ 3 }>
					<strong>
						{ dateI18n(
							'F',
							viewing,
							-viewing.getTimezoneOffset()
						) }
					</strong>{ ' ' }
					{ dateI18n( 'Y', viewing, -viewing.getTimezoneOffset() ) }
				</NavigatorHeading>
				{ calendarIndex === numberOfMonths - 1 && (
					<Button
						icon={ isRTL() ? arrowLeft : arrowRight }
						variant="tertiary"
						aria-label={ __( 'View next month' ) }
						onClick={ () => {
							viewNextMonth();
							setFocusable( addMonths( focusable, 1 ) );
							onMonthPreviewed?.(
								format(
									addMonths( viewing, 1 ),
									TIMEZONELESS_FORMAT
								)
							);
						} }
					/>
				) }
			</Navigator>
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
									setFocusable?.( day );
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
										setFocusable( nextFocusable );
										onDayKeyDown?.( nextFocusable );
									}
								} }
							/>
						);
					} )
				) }
			</StyledCalendar>
		</>
	);
}

export default Calendar;
