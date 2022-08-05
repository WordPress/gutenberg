/**
 * External dependencies
 */
import { useLilius } from 'use-lilius';
import {
	format,
	isSameDay,
	subMonths,
	addMonths,
	startOfDay,
	isEqual,
	addDays,
	subWeeks,
	addWeeks,
	isSameMonth,
} from 'date-fns';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf, isRTL } from '@wordpress/i18n';
import { arrowLeft, arrowRight } from '@wordpress/icons';
import { dateI18n, __experimentalGetSettings } from '@wordpress/date';
import { useState, useRef, useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DatePickerProps } from '../types';
import {
	Navigator,
	NavigatorHeading,
	Calendar,
	DayOfWeek,
	DayButton,
} from './styles';
import { inputToDate } from '../utils';
import Button from '../../button';
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
	startOfWeek = 0,
}: DatePickerProps ) {
	const date = currentDate ? inputToDate( currentDate ) : new Date();

	const {
		calendar,
		viewing,
		setSelected,
		setViewing,
		isSelected,
		viewPreviousMonth,
		viewNextMonth,
	} = useLilius( {
		selected: [ startOfDay( date ) ],
		viewing: startOfDay( date ),
		weekStartsOn: startOfWeek,
	} );

	const [ focusable, setFocusable ] = useState( startOfDay( date ) );
	const [ isFocusAllowed, setIsFocusAllowed ] = useState( false );

	// Update selected date and month being viewed when currentDate prop changes.
	const [ prevCurrentDate, setPrevCurrentDate ] = useState( currentDate );
	if ( currentDate !== prevCurrentDate ) {
		setPrevCurrentDate( currentDate );
		setSelected( [ startOfDay( date ) ] );
		setViewing( startOfDay( date ) );
		setFocusable( startOfDay( date ) );
	}

	return (
		<div className="components-datetime__date">
			<Navigator>
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
			</Navigator>
			<Calendar
				onFocus={ () => setIsFocusAllowed( true ) }
				onBlur={ () => setIsFocusAllowed( false ) }
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
								isFocusAllowed={ isFocusAllowed }
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
									setSelected( [ day ] );
									setFocusable( day );
									onChange?.(
										format(
											// Don't change the selected date's time fields.
											new Date(
												day.getFullYear(),
												day.getMonth(),
												day.getDate(),
												date.getHours(),
												date.getMinutes(),
												date.getSeconds(),
												date.getMilliseconds()
											),
											TIMEZONELESS_FORMAT
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
									if ( nextFocusable ) {
										setFocusable( nextFocusable );
										if (
											! isSameMonth(
												nextFocusable,
												viewing
											)
										) {
											setViewing( nextFocusable );
											onMonthPreviewed?.(
												format(
													nextFocusable,
													TIMEZONELESS_FORMAT
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
		</div>
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
	onKeyDown: ( event: KeyboardEvent ) => void;
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
	const ref = useRef< HTMLButtonElement >();

	// Focus the button when an arrow key is pressed, but only when focus was
	// already within the calendar grid. This prevents stealing focus from an
	// external field e.g. one of the TimePicker fields.
	useEffect( () => {
		if ( ref.current && isFocusable && isFocusAllowed ) {
			ref.current.focus();
		}
	}, [ isFocusable ] );

	const label = useMemo(
		() => getDayLabel( day, isSelected, numEvents ),
		[ day, isSelected, numEvents ]
	);

	return (
		<DayButton
			ref={ ref }
			className="components-datetime__date__day" // Unused, for backwards compatibility.
			disabled={ isInvalid }
			tabIndex={ isFocusable ? 0 : -1 }
			aria-label={ label }
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

function getDayLabel( date: Date, isSelected: boolean, numEvents: number ) {
	const parts = [];

	const { formats } = __experimentalGetSettings();
	const datePart = dateI18n( formats.date, date, -date.getTimezoneOffset() );
	parts.push( datePart );

	if ( isSelected ) {
		parts.push( __( 'Selected' ) );
	}

	if ( numEvents > 0 ) {
		parts.push(
			sprintf(
				// translators: %d: Number of events on given calendar day.
				_n( 'There is %d event', 'There are %d events', numEvents ),
				numEvents
			)
		);
	}

	if ( isRTL() ) {
		return parts.reverse().join( ' .' );
	}

	return parts.join( '. ' );
}

export default DatePicker;
