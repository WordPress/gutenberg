/**
 * External dependencies
 */
import moment from 'moment';
import { DayPickerSingleDateController } from 'react-dates';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Module Constants
 */
const TIMEZONELESS_FORMAT = 'YYYY-MM-DDTHH:mm:ss';
const isRTL = () => document.documentElement.dir === 'rtl';

class DatePicker extends Component {
	constructor() {
		super( ...arguments );

		this.onChangeMoment = this.onChangeMoment.bind( this );
	}

	onChangeMoment( newDate ) {
		const { currentDate, onChange } = this.props;

		const momentDate = currentDate ? moment( currentDate ) : moment();
		const momentTime = {
			hours: momentDate.hours(),
			minutes: momentDate.minutes(),
			seconds: momentDate.seconds(),
		};

		onChange( newDate.set( momentTime ).format( TIMEZONELESS_FORMAT ) );
	}

	render() {
		const { currentDate, isInvalidDate } = this.props;

		const momentDate = currentDate ? moment( currentDate ) : moment();

		return (
			<div className="components-datetime__date">
				<DayPickerSingleDateController
					date={ momentDate }
					daySize={ 30 }
					focused
					hideKeyboardShortcutsPanel
					// This is a hack to force the calendar to update on month or year change
					// https://github.com/airbnb/react-dates/issues/240#issuecomment-361776665
					key={ `datepicker-controller-${ momentDate.format( 'MM-YYYY' ) }` }
					noBorder
					numberOfMonths={ 1 }
					onDateChange={ this.onChangeMoment }
					transitionDuration={ 0 }
					weekDayFormat="ddd"
					isRTL={ isRTL() }
					isOutsideRange={ ( date ) => {
						return isInvalidDate && isInvalidDate( date.toDate() );
					} }
				/>
			</div>
		);
	}
}

export default DatePicker;
