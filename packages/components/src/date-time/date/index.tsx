/**
 * External dependencies
 */
import { useLilius } from 'use-lilius';
import {
	format,
	isSameDay,
	startOfMonth,
	endOfMonth,
	subMonths,
	addMonths,
} from 'date-fns';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { arrowLeft, arrowRight } from '@wordpress/icons';
import { dateI18n, __experimentalGetSettings } from '@wordpress/date';
import { useState } from '@wordpress/element';

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
		inRange,
		isSelected,
		viewPreviousMonth,
		viewNextMonth,
	} = useLilius( {
		selected: [ date ],
		viewing: date,
		weekStartsOn: startOfWeek,
	} );

	// Update the month being viewed when currentDate changes.
	const [ prevCurrentDate, setPrevCurrentDate ] = useState( currentDate );
	if ( currentDate !== prevCurrentDate ) {
		setPrevCurrentDate( currentDate );
		setViewing( date );
	}

	return (
		<div className="components-datetime__date">
			<Navigator>
				<Button
					icon={ arrowLeft }
					variant="tertiary"
					aria-label={ __( 'View previous month' ) }
					onClick={ () => {
						viewPreviousMonth();
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
					icon={ arrowRight }
					variant="tertiary"
					aria-label={ __( 'View next month' ) }
					onClick={ () => {
						viewNextMonth();
						onMonthPreviewed?.(
							format(
								addMonths( viewing, 1 ),
								TIMEZONELESS_FORMAT
							)
						);
					} }
				/>
			</Navigator>
			<Calendar>
				{ calendar[ 0 ][ 0 ].map( ( day ) => (
					<DayOfWeek key={ day.toString() }>
						{ dateI18n( 'D', day, -day.getTimezoneOffset() ) }
					</DayOfWeek>
				) ) }
				{ calendar[ 0 ].map( ( week ) =>
					week.map( ( day, index ) => {
						const isInRange = inRange(
							day,
							startOfMonth( viewing ),
							endOfMonth( viewing )
						);
						if ( ! isInRange ) {
							return null;
						}
						const numEvents = events.filter( ( event ) =>
							isSameDay( event.date, day )
						).length;
						return (
							<DayButton
								key={ day.toString() }
								className="components-datetime__date__day" // Unused, for backwards compatibility.
								disabled={
									isInvalidDate ? isInvalidDate( day ) : false
								}
								aria-label={ getDayLabel( day, numEvents ) }
								column={ index + 1 }
								isSelected={ isSelected( day ) }
								isToday={ isSameDay( day, new Date() ) }
								hasEvents={ numEvents > 0 }
								onClick={ () => {
									setSelected( [ day ] );
									onChange?.(
										format( day, TIMEZONELESS_FORMAT )
									);
								} }
							>
								{ dateI18n(
									'j',
									day,
									-day.getTimezoneOffset()
								) }
							</DayButton>
						);
					} )
				) }
			</Calendar>
		</div>
	);
}

function getDayLabel( date: Date, numEvents: number ) {
	const { formats } = __experimentalGetSettings();
	const label = dateI18n( formats.date, date, -date.getTimezoneOffset() );
	if ( ! numEvents ) {
		return label;
	}
	return sprintf(
		// translators: 1: A date, 2: Number of events on that day.
		_n(
			'%1$s. There is %2$d event.',
			'%1$s. There are %2$d events.',
			numEvents
		),
		label,
		numEvents
	);
}

export default DatePicker;
