/**
 * External dependencies
 */
import { isSameDay, format, set } from 'date-fns';

/**
 * WordPress dependencies
 */
import { _n } from '@wordpress/i18n';
import { arrowLeft, arrowRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import type { DatePickerProps } from '../types';
import Icon from '../../icon';
import { StyledCalendar } from './styles';

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
	events,
	isInvalidDate,
	onMonthPreviewed,
}: DatePickerProps ) {
	let date: Date | null;
	if ( currentDate === undefined ) {
		date = new Date();
	} else if ( currentDate instanceof Date ) {
		date = currentDate;
	} else if ( currentDate === null ) {
		date = null;
	} else {
		date = new Date( currentDate );
	}

	return (
		<div className="components-datetime__date">
			<StyledCalendar
				value={ date }
				minDetail="month"
				showNeighboringMonth={ false }
				prevLabel={ <Icon icon={ arrowLeft } /> }
				prev2Label={ null }
				nextLabel={ <Icon icon={ arrowRight } /> }
				next2Label={ null }
				tileClassName={ ( { date: candidateDate } ) =>
					events?.some( ( event ) =>
						isSameDay( event.date, candidateDate )
					)
						? 'has-events'
						: null
				}
				onChange={ ( nextDate: Date ) => {
					const previousDate = date ?? new Date();
					const adjustedDate = set( nextDate, {
						hours: previousDate.getHours(),
						minutes: previousDate.getMinutes(),
						seconds: previousDate.getSeconds(),
					} );
					onChange?.(
						format( adjustedDate, "yyyy-MM-dd'T'hh:mm:ss" )
					);
				} }
				onActiveStartDateChange={ ( { activeStartDate } ) =>
					onMonthPreviewed?.(
						format( activeStartDate, "yyyy-MM-dd'T'hh:mm:ss" )
					)
				}
				tileDisabled={ ( { date: candidateDate } ) =>
					isInvalidDate?.( candidateDate ) ?? false
				}
			/>
		</div>
	);
}

export default DatePicker;
