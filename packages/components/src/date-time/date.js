/**
 * External dependencies
 */
import moment from 'moment';
import classnames from 'classnames';

// react-dates doesn't tree-shake correctly, so we import from the individual
// component here, to avoid including too much of the library
import DayPickerSingleDateController from 'react-dates/lib/components/DayPickerSingleDateController';

/**
 * WordPress dependencies
 */
import { Component, createRef, useEffect, useRef } from '@wordpress/element';
import { isRTL, _n, sprintf } from '@wordpress/i18n';

/**
 * Module Constants
 */
const TIMEZONELESS_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
const ARIAL_LABEL_TIME_FORMAT = 'dddd, LL';

function DatePickerDay( { day, events = [] } ) {
	const ref = useRef();

	/*
	 * a11y hack to make the `There is/are n events` string
	 * available speaking for readers,
	 * re-defining the aria-label attribute.
	 * This attribute is handled by the react-dates component.
	 */
	useEffect( () => {
		// Bail when no parent node.
		if ( ! ref?.current?.parentNode ) {
			return;
		}

		const { parentNode } = ref.current;
		const dayAriaLabel = moment( day ).format( ARIAL_LABEL_TIME_FORMAT );

		if ( ! events.length ) {
			// Set aria-label without event description.
			parentNode.setAttribute( 'aria-label', dayAriaLabel );
			return;
		}

		const dayWithEventsDescription = sprintf(
			// translators: 1: Calendar day format, 2: Calendar event number.
			_n(
				'%1$s. There is %2$d event.',
				'%1$s. There are %2$d events.',
				events.length
			),
			dayAriaLabel,
			events.length
		);

		parentNode.setAttribute( 'aria-label', dayWithEventsDescription );
	}, [ events.length ] );

	return (
		<div
			ref={ ref }
			className={ classnames( 'components-datetime__date__day', {
				'has-events': events?.length,
			} ) }
		>
			{ day.format( 'D' ) }
		</div>
	);
}

class DatePicker extends Component {
	constructor() {
		super( ...arguments );

		this.onChangeMoment = this.onChangeMoment.bind( this );
		this.nodeRef = createRef();
		this.onMonthPreviewedHandler = this.onMonthPreviewedHandler.bind(
			this
		);
	}

	onMonthPreviewedHandler( newMonthDate ) {
		this.props?.onMonthPreviewed( newMonthDate.toISOString() );
		this.keepFocusInside();
	}

	/*
	 * Todo: We should remove this function ASAP.
	 * It is kept because focus is lost when we click on the previous and next month buttons.
	 * This focus loss closes the date picker popover.
	 * Ideally we should add an upstream commit on react-dates to fix this issue.
	 */
	keepFocusInside() {
		if ( ! this.nodeRef.current ) {
			return;
		}

		const { ownerDocument } = this.nodeRef.current;
		const { activeElement } = ownerDocument;

		// If focus was lost.
		if (
			! activeElement ||
			! this.nodeRef.current.contains( ownerDocument.activeElement )
		) {
			// Retrieve the focus region div.
			const focusRegion = this.nodeRef.current.querySelector(
				'.DayPicker_focusRegion'
			);
			if ( ! focusRegion ) {
				return;
			}
			// Keep the focus on focus region.
			focusRegion.focus();
		}
	}

	onChangeMoment( newDate ) {
		const { currentDate, onChange } = this.props;

		// If currentDate is null, use now as momentTime to designate hours, minutes, seconds.
		const momentDate = currentDate ? moment( currentDate ) : moment();
		const momentTime = {
			hours: momentDate.hours(),
			minutes: momentDate.minutes(),
			seconds: 0,
		};

		onChange( newDate.set( momentTime ).format( TIMEZONELESS_FORMAT ) );

		// Keep focus on the date picker.
		this.keepFocusInside();
	}

	/**
	 * Create a Moment object from a date string. With no currentDate supplied, default to a Moment
	 * object representing now. If a null value is passed, return a null value.
	 *
	 * @param {?string} currentDate Date representing the currently selected date or null to signify no selection.
	 * @return {?moment.Moment} Moment object for selected date or null.
	 */
	getMomentDate( currentDate ) {
		if ( null === currentDate ) {
			return null;
		}
		return currentDate ? moment( currentDate ) : moment();
	}

	getEventsPerDay( day ) {
		if ( ! this.props.events?.length ) {
			return [];
		}

		return this.props.events.filter( ( eventDay ) =>
			day.isSame( eventDay.date, 'day' )
		);
	}

	render() {
		const { currentDate, isInvalidDate } = this.props;
		const momentDate = this.getMomentDate( currentDate );

		return (
			<div className="components-datetime__date" ref={ this.nodeRef }>
				<DayPickerSingleDateController
					date={ momentDate }
					daySize={ 30 }
					focused
					hideKeyboardShortcutsPanel
					// This is a hack to force the calendar to update on month or year change
					// https://github.com/airbnb/react-dates/issues/240#issuecomment-361776665
					key={ `datepicker-controller-${
						momentDate ? momentDate.format( 'MM-YYYY' ) : 'null'
					}` }
					noBorder
					numberOfMonths={ 1 }
					onDateChange={ this.onChangeMoment }
					transitionDuration={ 0 }
					weekDayFormat="ddd"
					dayAriaLabelFormat={ ARIAL_LABEL_TIME_FORMAT }
					isRTL={ isRTL() }
					isOutsideRange={ ( date ) => {
						return isInvalidDate && isInvalidDate( date.toDate() );
					} }
					onPrevMonthClick={ this.onMonthPreviewedHandler }
					onNextMonthClick={ this.onMonthPreviewedHandler }
					renderDayContents={ ( day ) => (
						<DatePickerDay
							day={ day }
							events={ this.getEventsPerDay( day ) }
						/>
					) }
				/>
			</div>
		);
	}
}

export default DatePicker;
