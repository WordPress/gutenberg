/**
 * External dependencies
 */
import { useLilius } from 'use-lilius';
import {
	format,
	subMonths,
	addMonths,
	startOfDay,
	isSameMonth,
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
import Calendar from './calendar';
import type { DatePickerProps } from '../types';
import { Wrapper, Navigator, NavigatorHeading } from './styles';
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
	startOfWeek: weekStartsOn = 0,
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
		weekStartsOn,
	} );

	// Used to implement a roving tab index. Tracks the day that receives focus
	// when the user tabs into the calendar.
	const [ focusable, setFocusable ] = useState( startOfDay( date ) );

	// Update internal state when currentDate prop changes.
	const [ prevCurrentDate, setPrevCurrentDate ] = useState( currentDate );
	if ( currentDate !== prevCurrentDate ) {
		setPrevCurrentDate( currentDate );
		setSelected( [ startOfDay( date ) ] );
		setViewing( startOfDay( date ) );
		setFocusable( startOfDay( date ) );
	}

	return (
		<Wrapper
			className="components-datetime__date"
			role="application"
			aria-label={ __( 'Calendar' ) }
		>
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
				calendar={ calendar }
				isInvalidDate={ isInvalidDate }
				viewing={ viewing }
				isSelected={ isSelected }
				events={ events }
				onDayClick={ ( day ) => {
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
				onDayKeyDown={ ( nextFocusable ) => {
					setFocusable( nextFocusable );
					if ( ! isSameMonth( nextFocusable, viewing ) ) {
						setViewing( nextFocusable );
						onMonthPreviewed?.(
							format( nextFocusable, TIMEZONELESS_FORMAT )
						);
					}
				} }
				focusable={ focusable }
			/>
		</Wrapper>
	);
}

export default DatePicker;
