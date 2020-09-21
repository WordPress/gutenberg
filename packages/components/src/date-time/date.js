/**
 * External dependencies
 */
import ReactDatePicker from 'react-datepicker';
import { isSameDay, format, setMonth, getMonth, getYear, getDate } from 'date-fns';
import { map, filter } from 'lodash';
import * as locales from 'date-fns/esm/locale';

/**
 * WordPress dependencies
 */
import { Icon, Button, Tooltip } from '../';
import { __, _n } from '@wordpress/i18n';

/**
 * Module Constants
 */
const TIMEZONELESS_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
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
			title: __( '… and more', 'gutenberg' )
		} );
	}

	return (
		<div className="components-datetime__date--day-events">
			<ul>
				{ map( eventsToRender, ( event ) => (
					<li>{ event.title || __( 'No title', 'gutenberg' ) }</li>
				) ) }
			</ul>
		</div>
	)
};

const renderDayContents = ( day, date, events ) => {
	const eventsByDay = filter( events, ( ev ) => isSameDay( date, ev.date ) );
	if ( ! eventsByDay?.length ) {
		return getDate( date );
	}
	
	return <>
		<Tooltip text={ renderTooltipContent( eventsByDay ) }>
			<span>{ getDate( date ).toString() }</span>
		</Tooltip>
	</>;
};

const DatePicker = ( {
	onChange,
	onMonthChange,
	currentDate,
	isInvalidDate,
	locale = 'en',
	events,
} ) => {
	const selected = typeof currentDate === 'string' ? new Date( currentDate ) : currentDate;
	const highlightDates = events?.length ? map( events, 'date' ) : [];
	const localeObject = locales[ locale ] ? locales[ locale ] : locales[ 'en' ];
	
	return (
		<ReactDatePicker
			calendarClassName={ 'components-datetime__date' }
			selected={ selected }
			onChange={ onChange }
			inline
			renderCustomHeader={ ( props ) =>
				<DatePickerHeader { ...props } locale={ localeObject } />
			}
			renderDayContents={ ( ...props ) =>
				renderDayContents( ...props, events )
			}
			useWeekdaysShort={ true }
			highlightDates={ highlightDates }
			onMonthChange={ onMonthChange }
		/>
	);
};

export default DatePicker;

