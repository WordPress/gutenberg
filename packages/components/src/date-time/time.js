/**
 * External dependencies
 */
import classnames from 'classnames';
import { isInteger } from 'lodash';
import startOfMinute from 'date-fns/startOfMinute';
import set from 'date-fns/set';
import format from 'date-fns/format';

/**
 * WordPress dependencies
 */
import {
	createElement,
	useMemo,
	useEffect,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../button';
import ButtonGroup from '../button-group';
import TimeZone from './timezone';

/**
 * Module Constants
 */
const TIMEZONELESS_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

/**
 * <IntegerValidatedField>
 * A shared component to parse, validate, and handle remounting of the underlying form field element like <input> and <select>.
 *
 * @param {Object}        props          Component props.
 * @param {string}        props.as       Render the component as specific element tag, defaults to "input".
 * @param {number|string} props.value    The default value of the component which will be parsed to integer.
 * @param {Function}      props.onUpdate Call back when blurred and validated.
 */
function IntegerValidatedField( { as, value, onUpdate, ...props } ) {
	const element = as ?? 'input';

	const [ rawValue, setRawValue ] = useState( value );

	useEffect( () => {
		setRawValue( value );
	}, [ value ] );

	const handleUpdate = ( event ) => {
		const { target } = event;

		if ( value === target.value ) {
			return;
		}

		const parsedValue = parseInt( target.value, 10 );

		// Run basic number validation on the input.
		if (
			! isInteger( parsedValue ) ||
			( typeof props.max !== 'undefined' && parsedValue > props.max ) ||
			( typeof props.min !== 'undefined' && parsedValue < props.min )
		) {
			// If validation failed, reset the value to the previous valid value.
			setRawValue( value );
		} else if ( onUpdate ) {
			// Otherwise, it's valid, call onUpdate.
			onUpdate( target.name, parsedValue );
		}
	};

	const elementProps =
		'input' === element
			? {
					onBlur: handleUpdate,
					onKeyDown: ( event ) => {
						if ( 'Enter' === event.key ) {
							handleUpdate( event );
						}
					},
					onChange: ( e ) => setRawValue( e.target.value ),
			  }
			: {
					onChange: handleUpdate,
			  };

	return createElement( element, {
		value: rawValue,
		...elementProps,
		...props,
	} );
}

/**
 * Takes a WPValidDateTimeFormat and returns a Date object truncated to the nearest minute
 *
 * @param  {WPValidDateTimeFormat} datetime The datetime to truncate
 * @return {Date}                           The date object truncated to the nearest minute
 */
function truncateToMinutes( datetime ) {
	return startOfMinute(
		datetime instanceof Date ? datetime : new Date( datetime )
	);
}

/**
 * <TimePicker>
 *
 * @typedef {Date|string|number} WPValidDateTimeFormat
 *
 * @param {Object}                props             Component props.
 * @param {boolean}               props.is12Hour    Should the time picker showed in 12 hour format or 24 hour format.
 * @param {WPValidDateTimeFormat} props.currentTime The initial current time the time picker should render.
 * @param {Function}              props.onChange    Callback function when the date changed.
 */
export function TimePicker( { is12Hour, currentTime, onChange } ) {
	// Truncate the date at the minutes, see: #15495.
	const date = truncateToMinutes( currentTime ?? new Date() );

	const { day, month, year, minutes, hours, am } = useMemo(
		() => ( {
			day: format( date, 'dd' ),
			month: format( date, 'MM' ),
			year: format( date, 'yyyy' ),
			minutes: format( date, 'mm' ),
			hours: format( date, is12Hour ? 'hh' : 'HH' ),
			am: format( date, 'H' ) <= 11 ? 'AM' : 'PM',
		} ),
		[ date, is12Hour ]
	);

	/**
	 * Function that updates the sepecified date part to a new value, then calls the onChange handler.
	 * The date is truncated at the minutes.
	 *
	 * @param {string} name  Name of the date part to update.
	 * @param {number} value New value for the date part.
	 */
	function update( name, value ) {
		// Clone the date and call the specific setter function according to `name`.
		const newDate = set( date, { [ name ]: value } );
		if ( onChange ) {
			onChange( format( newDate, TIMEZONELESS_FORMAT ) );
		}
	}

	function updateAmPm( value ) {
		return () => {
			if ( am === value ) {
				return;
			}

			const parsedHours = parseInt( hours, 10 );

			const newDate = set( date, {
				hours:
					value === 'PM'
						? ( ( parsedHours % 12 ) + 12 ) % 24
						: parsedHours % 12,
			} );

			if ( onChange ) {
				onChange( format( newDate, TIMEZONELESS_FORMAT ) );
			}
		};
	}

	const dayFormat = (
		<div className="components-datetime__time-field components-datetime__time-field-day">
			<IntegerValidatedField
				aria-label={ __( 'Day' ) }
				className="components-datetime__time-field-day-input"
				type="number"
				// The correct function to call in moment.js is "date" not "day".
				name="date"
				value={ day }
				step={ 1 }
				min={ 1 }
				max={ 31 }
				onUpdate={ update }
			/>
		</div>
	);

	const monthFormat = (
		<div className="components-datetime__time-field components-datetime__time-field-month">
			<IntegerValidatedField
				as="select"
				aria-label={ __( 'Month' ) }
				className="components-datetime__time-field-month-select"
				name="month"
				value={ month }
				// The value starts from 0, so we have to -1 when setting month.
				onUpdate={ ( key, value ) => update( key, value - 1 ) }
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
			</IntegerValidatedField>
		</div>
	);

	const dayMonthFormat = is12Hour ? (
		<>
			{ dayFormat }
			{ monthFormat }
		</>
	) : (
		<>
			{ monthFormat }
			{ dayFormat }
		</>
	);

	return (
		<div className={ classnames( 'components-datetime__time' ) }>
			<fieldset>
				<legend className="components-datetime__time-legend invisible">
					{ __( 'Date' ) }
				</legend>
				<div className="components-datetime__time-wrapper">
					{ dayMonthFormat }

					<div className="components-datetime__time-field components-datetime__time-field-year">
						<IntegerValidatedField
							aria-label={ __( 'Year' ) }
							className="components-datetime__time-field-year-input"
							type="number"
							name="year"
							step={ 1 }
							min={ 0 }
							max={ 9999 }
							value={ year }
							onUpdate={ update }
						/>
					</div>
				</div>
			</fieldset>

			<fieldset>
				<legend className="components-datetime__time-legend invisible">
					{ __( 'Time' ) }
				</legend>
				<div className="components-datetime__time-wrapper">
					<div className="components-datetime__time-field components-datetime__time-field-time">
						<IntegerValidatedField
							aria-label={ __( 'Hours' ) }
							className="components-datetime__time-field-hours-input"
							type="number"
							name="hours"
							step={ 1 }
							min={ is12Hour ? 1 : 0 }
							max={ is12Hour ? 12 : 23 }
							value={ hours }
							onUpdate={ update }
						/>
						<span
							className="components-datetime__time-separator"
							aria-hidden="true"
						>
							:
						</span>
						<IntegerValidatedField
							aria-label={ __( 'Minutes' ) }
							className="components-datetime__time-field-minutes-input"
							type="number"
							name="minutes"
							step={ 1 }
							min={ 0 }
							max={ 59 }
							value={ minutes }
							onUpdate={ update }
						/>
					</div>
					{ is12Hour && (
						<ButtonGroup className="components-datetime__time-field components-datetime__time-field-am-pm">
							<Button
								isPrimary={ am === 'AM' }
								isSecondary={ am !== 'AM' }
								onClick={ updateAmPm( 'AM' ) }
								className="components-datetime__time-am-button"
							>
								{ __( 'AM' ) }
							</Button>
							<Button
								isPrimary={ am === 'PM' }
								isSecondary={ am !== 'PM' }
								onClick={ updateAmPm( 'PM' ) }
								className="components-datetime__time-pm-button"
							>
								{ __( 'PM' ) }
							</Button>
						</ButtonGroup>
					) }

					<TimeZone />
				</div>
			</fieldset>
		</div>
	);
}

export default TimePicker;
