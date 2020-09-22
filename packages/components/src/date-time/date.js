/**
 * External dependencies
 */
import ReactDatePicker from 'react-datepicker';
import { isSameDay, format, set, getDate } from 'date-fns';
import { map, filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, Tooltip } from '../';

/**
 * Module Constants
 */
const TIMEZONELESS_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";
const isRTL = () => document.documentElement.dir === 'rtl';

const DatePickerHeader = ( { date, decreaseMonth, increaseMonth, locale } ) => (
	<div className={ 'components-datetime__date-header' }>
		<Button
			className={ `components-datetime__date-header-month-button is-previous-month` }
			icon={ 'arrow-left-alt' }
			isSmall={ true }
			onClick={ decreaseMonth }
		/>
		<div className={ 'components-datetime__date-header-month' }>
			<strong>{ format( date, 'MMMM yyyy', { locale } ) }</strong>
		</div>
		<Button
			className={ `components-datetime__date-header-month-button is-previous-month` }
			icon={ 'arrow-right-alt' }
			isSmall={ true }
			onClick={ increaseMonth }
		/>
	</div>
);

const renderTooltipContent = ( events ) => {
	const needToPrune = events?.length > 3;
	const eventsToRender = needToPrune ? events.slice( 0, 3 ) : events;
	if ( needToPrune ) {
		eventsToRender.push( {
			title: __( '… and more' ),
		} );
	}

	return (
		<div className="components-datetime__date--day-events">
			<ul>
				{ map( eventsToRender, ( event ) => (
					<li key={ format( event.date, 'T' ) }>{ event.title || __( 'No title' ) }</li>
				) ) }
			</ul>
		</div>
	);
};

const renderDayContents = ( date, events ) => {
	const eventsByDay = filter( events, ( ev ) => isSameDay( date, ev.date ) );
	if ( ! eventsByDay?.length ) {
		return getDate( date );
	}

	return (
		<Tooltip text={ renderTooltipContent( eventsByDay ) }>
			<span>{ getDate( date ).toString() }</span>
		</Tooltip>
	);
};

const handleChange = ( newDate, currentDate, onChange ) => {
	// If currentDate is null, use now as momentTime to designate hours, minutes, seconds.
	const momentDate = new Date( currentDate ?? null );
	const momentTime = {
		hours: momentDate.getHours(),
		minutes: momentDate.getMinutes(),
		seconds: 0,
		milliseconds: 0,
	};

	onChange( format( set( newDate, momentTime ), TIMEZONELESS_FORMAT ) );
};

const DatePicker = ( {
	onMonthChange,
	currentDate,
	isInvalidDate,
	locale,
	events,
	onChange,
} ) => {
	const currentDateObj =
		currentDate instanceof Date
			? currentDate
			: new Date( currentDate ?? null );

	const highlightDates = events?.length ? map( events, 'date' ) : [];
	return (
		<div
			className="components-datetime__date"
			dir={ isRTL() ? 'rtl' : 'ltr' }
		>
			<ReactDatePicker
				calendarClassName={ 'components-datetime__date' }
				selected={ currentDateObj }
				onChange={ ( newDate ) =>
					handleChange( newDate, currentDate, onChange )
				}
				filterDate={ ( date ) => {
					return ! isInvalidDate || ! isInvalidDate( date );
				} }
				inline
				renderCustomHeader={ ( props ) => (
					<DatePickerHeader { ...props } locale={ locale } />
				) }
				renderDayContents={ ( _, date ) =>
					renderDayContents( date, events )
				}
				useWeekdaysShort={ true }
				locale={ locale }
				highlightDates={ highlightDates }
				onMonthChange={ onMonthChange }
			/>
		</div>
	);
};

export default DatePicker;
