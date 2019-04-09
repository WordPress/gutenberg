/**
 * External dependencies
 */
import classnames from 'classnames';
import { isInteger } from 'lodash';
import moment from 'moment';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../button';

/**
 * Module Constants
 */
const TIMEZONELESS_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

class TimePicker extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			day: '',
			month: '',
			year: '',
			hours: '',
			minutes: '',
			am: true,
			date: null,
		};
		this.updateMonth = this.updateMonth.bind( this );
		this.onChangeMonth = this.onChangeMonth.bind( this );
		this.updateDay = this.updateDay.bind( this );
		this.onChangeDay = this.onChangeDay.bind( this );
		this.updateYear = this.updateYear.bind( this );
		this.onChangeYear = this.onChangeYear.bind( this );
		this.updateHours = this.updateHours.bind( this );
		this.updateMinutes = this.updateMinutes.bind( this );
		this.onChangeHours = this.onChangeHours.bind( this );
		this.onChangeMinutes = this.onChangeMinutes.bind( this );
		this.renderMonth = this.renderMonth.bind( this );
		this.renderDay = this.renderDay.bind( this );
		this.renderDayMonthFormat = this.renderDayMonthFormat.bind( this );
	}

	componentDidMount() {
		this.syncState( this.props );
	}

	componentDidUpdate( prevProps ) {
		const { currentTime, is12Hour } = this.props;
		if (
			currentTime !== prevProps.currentTime ||
			is12Hour !== prevProps.is12Hour
		) {
			this.syncState( this.props );
		}
	}

	getMaxHours() {
		return this.props.is12Hour ? 12 : 23;
	}

	getMinHours() {
		return this.props.is12Hour ? 1 : 0;
	}

	syncState( { currentTime, is12Hour } ) {
		const selected = currentTime ? moment( currentTime ) : moment();
		const day = selected.format( 'DD' );
		const month = selected.format( 'MM' );
		const year = selected.format( 'YYYY' );
		const minutes = selected.format( 'mm' );
		const am = selected.format( 'A' );
		const hours = selected.format( is12Hour ? 'hh' : 'HH' );
		const date = currentTime ? moment( currentTime ) : moment();
		this.setState( { day, month, year, minutes, hours, am, date } );
	}

	updateHours() {
		const { is12Hour, onChange } = this.props;
		const { am, hours, date } = this.state;
		const value = parseInt( hours, 10 );
		if (
			! isInteger( value ) ||
			( is12Hour && ( value < 1 || value > 12 ) ) ||
			( ! is12Hour && ( value < 0 || value > 23 ) )
		) {
			this.syncState( this.props );
			return;
		}

		const newDate = is12Hour ?
			date.clone().hours( am === 'AM' ? value % 12 : ( ( ( value % 12 ) + 12 ) % 24 ) ) :
			date.clone().hours( value );
		this.setState( { date: newDate } );
		onChange( newDate.format( TIMEZONELESS_FORMAT ) );
	}

	updateMinutes() {
		const { onChange } = this.props;
		const { minutes, date } = this.state;
		const value = parseInt( minutes, 10 );
		if ( ! isInteger( value ) || value < 0 || value > 59 ) {
			this.syncState( this.props );
			return;
		}
		const newDate = date.clone().minutes( value );
		this.setState( { date: newDate } );
		onChange( newDate.format( TIMEZONELESS_FORMAT ) );
	}

	updateDay() {
		const { onChange } = this.props;
		const { day, date } = this.state;
		const value = parseInt( day, 10 );
		if ( ! isInteger( value ) || value < 1 || value > 31 ) {
			this.syncState( this.props );
			return;
		}
		const newDate = date.clone().date( value );
		this.setState( { date: newDate } );
		onChange( newDate.format( TIMEZONELESS_FORMAT ) );
	}

	updateMonth() {
		const { onChange } = this.props;
		const { month, date } = this.state;
		const value = parseInt( month, 10 );
		if ( ! isInteger( value ) || value < 1 || value > 12 ) {
			this.syncState( this.props );
			return;
		}
		const newDate = date.clone().month( value - 1 );
		this.setState( { date: newDate } );
		onChange( newDate.format( TIMEZONELESS_FORMAT ) );
	}

	updateYear() {
		const { onChange } = this.props;
		const { year, date } = this.state;
		const value = parseInt( year, 10 );
		if ( ! isInteger( value ) || value < 0 || value > 9999 ) {
			this.syncState( this.props );
			return;
		}
		const newDate = date.clone().year( value );
		this.setState( { date: newDate } );
		onChange( newDate.format( TIMEZONELESS_FORMAT ) );
	}

	updateAmPm( value ) {
		return () => {
			const { onChange } = this.props;
			const { am, date, hours } = this.state;
			if ( am === value ) {
				return;
			}
			let newDate;
			if ( value === 'PM' ) {
				newDate = date.clone().hours( ( ( parseInt( hours, 10 ) % 12 ) + 12 ) % 24 );
			} else {
				newDate = date.clone().hours( parseInt( hours, 10 ) % 12 );
			}
			this.setState( { date: newDate } );
			onChange( newDate.format( TIMEZONELESS_FORMAT ) );
		};
	}

	onChangeDay( event ) {
		this.setState( { day: event.target.value } );
	}

	onChangeMonth( event ) {
		this.setState( { month: event.target.value } );
	}

	onChangeYear( event ) {
		this.setState( { year: event.target.value } );
	}

	onChangeHours( event ) {
		this.setState( { hours: event.target.value } );
	}

	onChangeMinutes( event ) {
		this.setState( { minutes: event.target.value } );
	}

	renderMonth( month ) {
		return (
			<div key="render-month" className="components-datetime__time-field components-datetime__time-field-month">
				<select
					aria-label={ __( 'Month' ) }
					className="components-datetime__time-field-month-select"
					value={ month }
					onChange={ this.onChangeMonth }
					onBlur={ this.updateMonth }
				>
					<option value="01">{ __( 'January' ) }</option>
					<option value="02">{ __( 'February' ) }</option>
					<option value="03">{ __( 'March' ) }</option>
					<option value="04">{ __( 'April' ) }</option>
					<option value="05">{ __( 'May' ) }</option>
					<option value="06">{ __( 'June' ) }</option>
					<option value="07">{ __( 'July' ) }</option>
					<option value="08">{ __( 'August' ) }</option>
					<option value="09">{ __( 'September' ) }</option>
					<option value="10">{ __( 'October' ) }</option>
					<option value="11">{ __( 'November' ) }</option>
					<option value="12">{ __( 'December' ) }</option>
				</select>
			</div>
		);
	}

	renderDay( day ) {
		return (
			<div key="render-day" className="components-datetime__time-field components-datetime__time-field-day">
				<input
					aria-label={ __( 'Day' ) }
					className="components-datetime__time-field-day-input"
					type="number"
					value={ day }
					step={ 1 }
					min={ 1 }
					onChange={ this.onChangeDay }
					onBlur={ this.updateDay }
				/>
			</div>
		);
	}

	renderDayMonthFormat( is12Hour ) {
		const { day, month } = this.state;
		const layout = [ this.renderDay( day ), this.renderMonth( month ) ];
		return is12Hour ? layout : layout.reverse();
	}

	render() {
		const { is12Hour } = this.props;
		const { year, minutes, hours, am } = this.state;
		return (
			<div className={ classnames( 'components-datetime__time' ) }>
				<fieldset>
					<legend className="components-datetime__time-legend invisible">{ __( 'Date' ) }</legend>
					<div className="components-datetime__time-wrapper">
						{ this.renderDayMonthFormat( is12Hour ) }
						<div className="components-datetime__time-field components-datetime__time-field-year">
							<input
								aria-label={ __( 'Year' ) }
								className="components-datetime__time-field-year-input"
								type="number"
								step={ 1 }
								value={ year }
								onChange={ this.onChangeYear }
								onBlur={ this.updateYear }
							/>
						</div>
					</div>
				</fieldset>

				<fieldset>
					<legend className="components-datetime__time-legend invisible">{ __( 'Time' ) }</legend>
					<div className="components-datetime__time-wrapper">
						<div className="components-datetime__time-field components-datetime__time-field-time">
							<input
								aria-label={ __( 'Hours' ) }
								className="components-datetime__time-field-hours-input"
								type="number"
								step={ 1 }
								min={ this.getMinHours() }
								max={ this.getMaxHours() }
								value={ hours }
								onChange={ this.onChangeHours }
								onBlur={ this.updateHours }
							/>
							<span
								className="components-datetime__time-separator"
								aria-hidden="true">:</span>
							<input
								aria-label={ __( 'Minutes' ) }
								className="components-datetime__time-field-minutes-input"
								type="number"
								min={ 0 }
								max={ 59 }
								value={ minutes }
								onChange={ this.onChangeMinutes }
								onBlur={ this.updateMinutes }
							/>
						</div>
						{ is12Hour && (
							<div className="components-datetime__time-field components-datetime__time-field-am-pm">
								<Button
									aria-pressed={ am === 'AM' }
									isDefault
									className="components-datetime__time-am-button"
									isToggled={ am === 'AM' }
									onClick={ this.updateAmPm( 'AM' ) }
								>
									{ __( 'AM' ) }
								</Button>
								<Button
									aria-pressed={ am === 'PM' }
									isDefault
									className="components-datetime__time-pm-button"
									isToggled={ am === 'PM' }
									onClick={ this.updateAmPm( 'PM' ) }
								>
									{ __( 'PM' ) }
								</Button>
							</div>
						) }
					</div>
				</fieldset>
			</div>
		);
	}
}

export default TimePicker;
