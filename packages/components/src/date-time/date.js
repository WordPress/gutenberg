/**
 * External dependencies
 */
import ReactDatePicker, { registerLocale } from 'react-datepicker';
import { isSameDay, format, getDate } from 'date-fns';
import { map, filter } from 'lodash';
import * as locales from 'date-fns/esm/locale';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalGetSettings as getSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import { Button, Tooltip } from '../';
import { mapLocaleCode } from './utils';

/**
 * Module Constants
 */
const TIMEZONELESS_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
const isRTL = () => document.documentElement.dir === 'rtl';

/*
 * Register locale
 */
const settings = getSettings();
const siteLocale = settings?.l10n?.locale || 'en';
const _l = mapLocaleCode( siteLocale );
const localeObject = locales[ _l ] ? locales[ _l ] : locales.en_US;
registerLocale( _l, localeObject );

const renderDatePickerHeader = ( { date, decreaseMonth, increaseMonth } ) => (
	<div className={ 'components-datetime__date-header' }>
		<Button
			className={ `components-datetime__date-header-month-button is-previous-month` }
			icon={ 'arrow-left-alt' }
			isSmall={ true }
			onClick={ decreaseMonth }
		/>
		<div className={ 'components-datetime__date-header-month' }>
			<strong>
				{ format( date, 'MMMM yyyy', { locale: localeObject } ) }
			</strong>
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
					<li>{ event.title || __( 'No title' ) }</li>
				) ) }
			</ul>
		</div>
	);
};

const renderDayContents = ( day, date, events ) => {
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

const DatePicker = ( {
	onChange,
	onMonthChange,
	currentDate,
	isInvalidDate,
	events,
} ) => {
	const selected = typeof currentDate === 'string' ? new Date( currentDate ) : currentDate;
	const highlightDates = events?.length ? map( events, 'date' ) : [];

	return (
		<ReactDatePicker
			calendarClassName={ 'components-datetime__date' }
			selected={ selected }
			onChange={ onChange }
			inline
			renderCustomHeader={ renderDatePickerHeader }
			renderDayContents={ ( ...props ) =>
				renderDayContents( ...props, events )
			}
			useWeekdaysShort={ true }
			highlightDates={ highlightDates }
			onMonthChange={ onMonthChange }
			locale={ _l }
		/>
	);
};

export default DatePicker;
