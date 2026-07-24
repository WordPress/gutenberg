/**
 * External dependencies
 */
import {
	isSameDay,
	subMonths,
	addMonths,
	isEqual,
	addDays,
	subDays,
	subWeeks,
	addWeeks,
	isSameMonth,
} from 'date-fns';
import type { KeyboardEventHandler } from 'react';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf, isRTL } from '@wordpress/i18n';
import { arrowLeft, arrowRight } from '@wordpress/icons';
import { dateI18n, date as formatDate, getSettings } from '@wordpress/date';
import { useState, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useLilius } from './use-lilius';
import type { DatePickerProps } from '../types';
import {
	Wrapper,
	Navigator,
	ViewPreviousMonthButton,
	ViewNextMonthButton,
	NavigatorHeading,
	Calendar,
	DayOfWeek,
	DayButton,
} from './styles';
import {
	inputToDate,
	setInConfiguredTimezone,
	startOfDayInConfiguredTimezone,
} from '../utils';
import { TIMEZONELESS_FORMAT } from '../constants';

/**
 * DatePicker is a React component that renders a calendar for date selection.
 *
 * ```jsx
 * import { DatePicker } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyDatePicker = () => {
 *   const [ date, setDate ] = useState( new Date() );
 *
 *   return (
 *     <DatePicker
 *       currentDate={ date }
 *       onChange={ ( newDate ) => setDate( newDate ) }
 *     />
 *   );
 * };
 * ```
 */
export function DatePicker( {
	currentDate,
	onChange,
	events = [],
	isInvalidDate,
	onMonthPreviewed,
	startOfWeek: weekStartsOn = 0,
}: DatePickerProps ) {
	const date = inputToDate( currentDate ?? new Date() );

	const {
		calendar,
		viewing,
		setSelected,
		setViewing,
		isSelected,
		viewPreviousMonth,
		viewNextMonth,
	} = useLilius( {
		selected: [ startOfDayInConfiguredTimezone( date ) ],
		viewing: startOfDayInConfiguredTimezone( date ),
		weekStartsOn,
	} );

	// Used to implement a roving tab index. Tracks the day that receives focus
	// when the user tabs into the calendar.
	const [ focusable, setFocusable ] = useState(
		startOfDayInConfiguredTimezone( date )
	);

	// Allows us to only programmatically focus() a day when focus was already
	// within the calendar. This stops us stealing focus from e.g. a TimePicker
	// input.
	const [ isFocusWithinCalendar, setIsFocusWithinCalendar ] =
		useState( false );

	// Update internal state when currentDate prop changes.
	const [ prevCurrentDate, setPrevCurrentDate ] = useState( currentDate );
	if ( currentDate !== prevCurrentDate ) {
		setPrevCurrentDate( currentDate );
		setSelected( [ startOfDayInConfiguredTimezone( date ) ] );
		setViewing( startOfDayInConfiguredTimezone( date ) );
		setFocusable( startOfDayInConfiguredTimezone( date ) );
	}

	return (
		<Wrapper
			className="components-datetime__date"
			role="application"
			aria-label={ __( 'Calendar' ) }
		>
			<Navigator>
				<ViewPreviousMonthButton
					icon={ isRTL() ? arrowRight : arrowLeft }
					variant="tertiary"
					aria-label={ __( 'View previous month' ) }
					onClick={ () => {
						viewPreviousMonth();
						setFocusable( subMonths( focusable, 1 ) );
						const prevMonth = subMonths( viewing, 1 );
						onMonthPreviewed?.(
							dateI18n(
								TIMEZONELESS_FORMAT,
								prevMonth,
								-prevMonth.getTimezoneOffset()
							)
						);
					} }
					size="compact"
				/>
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
				<ViewNextMonthButton
					icon={ isRTL() ? arrowLeft : arrowRight }
					variant="tertiary"
					aria-label={ __( 'View next month' ) }
					onClick={ () => {
						viewNextMonth();
						setFocusable( addMonths( focusable, 1 ) );
						const nextMonth = addMonths( viewing, 1 );
						onMonthPreviewed?.(
							dateI18n(
								TIMEZONELESS_FORMAT,
								nextMonth,
								-nextMonth.getTimezoneOffset()
							)
						);
					} }
					size="compact"
				/>
			</Navigator>
			<Calendar
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
								isToday={ isSameDay(
									day,
									startOfDayInConfiguredTimezone( new Date() )
								) }
								isInvalid={
									isInvalidDate ? isInvalidDate( day ) : false
								}
								numEvents={
									events.filter( ( event ) =>
										isSameDay( event.date, day )
									).length
								}
								onClick={ () => {
									setSelected( [ day ] );
									setFocusable( day );
									const newDate = setInConfiguredTimezone(
										date,
										{
											year: day.getFullYear(),
											month: day.getMonth(),
											date: day.getDate(),
										}
									);
									onChange?.(
										formatDate(
											TIMEZONELESS_FORMAT,
											newDate
										)
									);
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
										const dayOfWeek = day.getDay();
										const daysToSubtract =
											( dayOfWeek - weekStartsOn + 7 ) %
											7;
										nextFocusable = subDays(
											day,
											daysToSubtract
										);
									}
									if ( event.key === 'End' ) {
										const dayOfWeek = day.getDay();
										const daysToAdd =
											( weekStartsOn + 6 - dayOfWeek ) %
											7;
										nextFocusable = addDays(
											day,
											daysToAdd
										);
									}
									if ( nextFocusable ) {
										event.preventDefault();
										setFocusable( nextFocusable );
										if (
											! isSameMonth(
												nextFocusable,
												viewing
											)
										) {
											setViewing( nextFocusable );
											onMonthPreviewed?.(
												dateI18n(
													TIMEZONELESS_FORMAT,
													nextFocusable,
													-nextFocusable.getTimezoneOffset()
												)
											);
										}
									}
								} }
							/>
						);
					} )
				) }
			</Calendar>
		</Wrapper>
	);
}

type DayProps = {
	day: Date;
	column: number;
	isSelected: boolean;
	isFocusable: boolean;
	isFocusAllowed: boolean;
	isToday: boolean;
	numEvents: number;
	isInvalid: boolean;
	onClick: () => void;
	onKeyDown: KeyboardEventHandler;
};

function Day( {
	day,
	column,
	isSelected,
	isFocusable,
	isFocusAllowed,
	isToday,
	isInvalid,
	numEvents,
	onClick,
	onKeyDown,
}: DayProps ) {
	const ref = useRef< HTMLButtonElement >( null );

	// Focus the day when it becomes focusable, e.g. because an arrow key is
	// pressed. Only do this if focus is allowed - this stops us stealing focus
	// from e.g. a TimePicker input.
	useEffect( () => {
		if ( ref.current && isFocusable && isFocusAllowed ) {
			ref.current.focus();
		}
		// isFocusAllowed is not a dep as there is no point calling focus() on
		// an already focused element.
	}, [ isFocusable ] );

	return (
		<DayButton
			__next40pxDefaultSize
			ref={ ref }
			className="components-datetime__date__day" // Unused, for backwards compatibility.
			disabled={ isInvalid }
			tabIndex={ isFocusable ? 0 : -1 }
			aria-label={ getDayLabel( day, isSelected, isToday, numEvents ) }
			column={ column }
			isSelected={ isSelected }
			isToday={ isToday }
			hasEvents={ numEvents > 0 }
			onClick={ onClick }
			onKeyDown={ onKeyDown }
		>
			{ dateI18n( 'j', day, -day.getTimezoneOffset() ) }
		</DayButton>
	);
}

function getDayLabel(
	date: Date,
	isSelected: boolean,
	isToday: boolean,
	numEvents: number
) {
	const { formats } = getSettings();
	const localizedDate = dateI18n(
		formats.date,
		date,
		-date.getTimezoneOffset()
	);

	const parts = [ localizedDate ];

	if ( isSelected ) {
		parts.push( __( 'Selected' ) );
	}

	if ( isToday ) {
		parts.push( __( 'Today' ) );
	}

	if ( numEvents > 0 ) {
		parts.push(
			sprintf(
				// translators: %d: Number of events on the calendar date.
				_n( 'There is %d event', 'There are %d events', numEvents ),
				numEvents
			)
		);
	}

	return parts.join( '. ' );
}

export default DatePicker;
