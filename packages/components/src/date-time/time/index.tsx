/**
 * External dependencies
 */
import classnames from 'classnames';
import { isInteger } from 'lodash';
import moment from 'moment';
import type { FocusEvent } from 'react';
import type { Moment } from 'moment';

/**
 * WordPress dependencies
 */
import {
	createElement,
	useState,
	useMemo,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../../button';
import ButtonGroup from '../../button-group';
import TimeZone from '../timezone';
import type { WordPressComponentProps } from '../../ui/context';
import type {
	UpdateOnBlurAsIntegerFieldProps,
	TimePickerProps,
} from '../types';
import {
	Wrapper,
	Fieldset,
	Legend,
	hoursField,
	TimeSeparator,
	minutesField,
	monthField as monthFieldStyles,
	dayField as dayFieldStyles,
	yearField,
	TimeWrapper,
} from './styles';
import { HStack } from '../../h-stack';
import { Spacer } from '../../spacer';
import { useCx } from '../../utils';

const TIMEZONELESS_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

function from12hTo24h( hours: number, isPm: boolean ) {
	return isPm ? ( ( hours % 12 ) + 12 ) % 24 : hours % 12;
}

/**
 * A shared component to parse, validate, and handle remounting of the
 * underlying form field element like <input> and <select>.
 */
function UpdateOnBlurAsIntegerField( {
	as,
	value,
	onUpdate,
	className,
	...props
}: WordPressComponentProps< UpdateOnBlurAsIntegerFieldProps, 'input', true > ) {
	function handleBlur( event: FocusEvent< HTMLInputElement > ) {
		const { target } = event;

		if ( String( value ) === target.value ) {
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
			target.value = String( value );
		} else {
			// Otherwise, it's valid, call onUpdate.
			onUpdate( parsedValue );
		}
	}

	return createElement( as || 'input', {
		// Re-mount the input value to accept the latest value as the defaultValue.
		key: value,
		defaultValue: value,
		onBlur: handleBlur,
		className: classnames(
			'components-datetime__time-field-integer-field',
			className
		),
		...props,
	} );
}

export function TimePicker( {
	is12Hour,
	currentTime,
	onChange,
}: TimePickerProps ) {
	const [ date, setDate ] = useState( () =>
		// Truncate the date at the minutes, see: #15495.
		currentTime ? moment( currentTime ).startOf( 'minutes' ) : moment()
	);

	// Reset the state when currentTime changed.
	useEffect( () => {
		setDate(
			currentTime ? moment( currentTime ).startOf( 'minutes' ) : moment()
		);
	}, [ currentTime ] );

	const { day, month, year, minutes, hours, am } = useMemo(
		() => ( {
			day: date.format( 'DD' ),
			month: date.format( 'MM' ),
			year: date.format( 'YYYY' ),
			minutes: date.format( 'mm' ),
			hours: date.format( is12Hour ? 'hh' : 'HH' ),
			am: Number( date.format( 'H' ) ) <= 11 ? 'AM' : 'PM',
		} ),
		[ date, is12Hour ]
	);

	const cx = useCx();

	/**
	 * Function that sets the date state and calls the onChange with a new date.
	 * The date is truncated at the minutes.
	 *
	 * @param {Moment} newDate The date object.
	 */
	function changeDate( newDate: Moment ) {
		setDate( newDate );
		onChange?.( newDate.format( TIMEZONELESS_FORMAT ) );
	}

	function update( name: 'date' | 'month' | 'year' | 'hours' | 'minutes' ) {
		return ( value: number ) => {
			// If the 12-hour format is being used and the 'PM' period is selected, then
			// the incoming value (which ranges 1-12) should be increased by 12 to match
			// the expected 24-hour format.
			let adjustedValue = value;
			if ( name === 'hours' && is12Hour ) {
				adjustedValue = from12hTo24h( value, am === 'PM' );
			}

			// Clone the date and call the specific setter function according to `name`.
			const newDate = date.clone()[ name ]( adjustedValue );
			changeDate( newDate );
		};
	}

	function updateAmPm( value: 'AM' | 'PM' ) {
		return () => {
			if ( am === value ) {
				return;
			}

			const parsedHours = parseInt( hours, 10 );

			const newDate = date
				.clone()
				.hours( from12hTo24h( parsedHours, value === 'PM' ) );

			changeDate( newDate );
		};
	}

	const dayField = (
		// <div className="components-datetime__time-field components-datetime__time-field-day">
		<UpdateOnBlurAsIntegerField
			className={ cx( dayFieldStyles ) }
			aria-label={ __( 'Day' ) }
			// className="components-datetime__time-field-day-input"
			type="number"
			// The correct function to call in moment.js is "date" not "day".
			name="date"
			value={ day }
			step={ 1 }
			min={ 1 }
			max={ 31 }
			onUpdate={ update( 'date' ) }
		/>
		// </div>
	);

	const monthField = (
		// <div className="components-datetime__time-field components-datetime__time-field-month">
		<UpdateOnBlurAsIntegerField
			as="select"
			className={ cx( monthFieldStyles ) }
			aria-label={ __( 'Month' ) }
			// className="components-datetime__time-field-month-select"
			name="month"
			value={ month }
			// The value starts from 0, so we have to -1 when setting month.
			onUpdate={ ( value ) => update( 'month' )( value - 1 ) }
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
		</UpdateOnBlurAsIntegerField>
		// </div>
	);

	// const dayMonthFormat = is12Hour ? (
	// 	<>
	// 		{ monthFormat }
	// 		{ dayFormat }
	// 	</>
	// ) : (
	// 	<>
	// 		{ dayFormat }
	// 		{ monthFormat }
	// 	</>
	// );

	// TODO:
	// - add back classNames (how many do we need for BC?)
	// - audit the original CSS to see I didn't miss any important styles

	return (
		<Wrapper>
			<Fieldset>
				<Legend>{ __( 'Time' ) }</Legend>
				<HStack>
					<TimeWrapper>
						<UpdateOnBlurAsIntegerField
							className={ cx( hoursField ) }
							aria-label={ __( 'Hours' ) }
							type="number"
							name="hours"
							step={ 1 }
							min={ is12Hour ? 1 : 0 }
							max={ is12Hour ? 12 : 23 }
							value={ hours }
							onUpdate={ update( 'hours' ) }
						/>
						<TimeSeparator aria-hidden="true">:</TimeSeparator>
						<UpdateOnBlurAsIntegerField
							className={ cx( minutesField ) }
							aria-label={ __( 'Minutes' ) }
							type="number"
							name="minutes"
							step={ 1 }
							min={ 0 }
							max={ 59 }
							value={ minutes }
							onUpdate={ update( 'minutes' ) }
						/>
					</TimeWrapper>
					{ is12Hour && (
						<ButtonGroup>
							<Button
								variant={
									am === 'AM' ? 'primary' : 'secondary'
								}
								onClick={ updateAmPm( 'AM' ) }
							>
								{ __( 'AM' ) }
							</Button>
							<Button
								variant={
									am === 'PM' ? 'primary' : 'secondary'
								}
								onClick={ updateAmPm( 'PM' ) }
							>
								{ __( 'PM' ) }
							</Button>
						</ButtonGroup>
					) }
					<Spacer />
					<TimeZone />
				</HStack>
			</Fieldset>
			<Fieldset>
				<Legend>{ __( 'Date' ) }</Legend>
				<HStack>
					{ is12Hour ? (
						<>
							{ monthField }
							{ dayField }
						</>
					) : (
						<>
							{ dayField }
							{ monthField }
						</>
					) }
					<UpdateOnBlurAsIntegerField
						className={ cx( yearField ) }
						aria-label={ __( 'Year' ) }
						type="number"
						name="year"
						step={ 1 }
						min={ 0 }
						max={ 9999 }
						value={ year }
						onUpdate={ update( 'year' ) }
					/>
				</HStack>
			</Fieldset>
		</Wrapper>
	);

	// return (
	// 	<div className={ classnames( 'components-datetime__time' ) }>
	// 		<fieldset>
	// 			<legend className="components-datetime__time-legend invisible">
	// 				{ __( 'Date' ) }
	// 			</legend>
	// 			<div className="components-datetime__time-wrapper">
	// 				{ dayMonthFormat }

	// 				<div className="components-datetime__time-field components-datetime__time-field-year">
	// 					<UpdateOnBlurAsIntegerField
	// 						aria-label={ __( 'Year' ) }
	// 						className="components-datetime__time-field-year-input"
	// 						type="number"
	// 						name="year"
	// 						step={ 1 }
	// 						min={ 0 }
	// 						max={ 9999 }
	// 						value={ year }
	// 						onUpdate={ update( 'year' ) }
	// 					/>
	// 				</div>
	// 			</div>
	// 		</fieldset>

	// 		<fieldset>
	// 			<legend className="components-datetime__time-legend invisible">
	// 				{ __( 'Time' ) }
	// 			</legend>
	// 			<div className="components-datetime__time-wrapper">
	// 				<div className="components-datetime__time-field components-datetime__time-field-time">
	// 					<UpdateOnBlurAsIntegerField
	// 						aria-label={ __( 'Hours' ) }
	// 						className="components-datetime__time-field-hours-input"
	// 						type="number"
	// 						name="hours"
	// 						step={ 1 }
	// 						min={ is12Hour ? 1 : 0 }
	// 						max={ is12Hour ? 12 : 23 }
	// 						value={ hours }
	// 						onUpdate={ update( 'hours' ) }
	// 					/>
	// 					<span
	// 						className="components-datetime__time-separator"
	// 						aria-hidden="true"
	// 					>
	// 						:
	// 					</span>
	// 					<UpdateOnBlurAsIntegerField
	// 						aria-label={ __( 'Minutes' ) }
	// 						className="components-datetime__time-field-minutes-input"
	// 						type="number"
	// 						name="minutes"
	// 						step={ 1 }
	// 						min={ 0 }
	// 						max={ 59 }
	// 						value={ minutes }
	// 						onUpdate={ update( 'minutes' ) }
	// 					/>
	// 				</div>
	// 				{ is12Hour && (
	// 					<ButtonGroup className="components-datetime__time-field components-datetime__time-field-am-pm">
	// 						<Button
	// 							variant={
	// 								am === 'AM' ? 'primary' : 'secondary'
	// 							}
	// 							onClick={ updateAmPm( 'AM' ) }
	// 							className="components-datetime__time-am-button"
	// 						>
	// 							{ __( 'AM' ) }
	// 						</Button>
	// 						<Button
	// 							variant={
	// 								am === 'PM' ? 'primary' : 'secondary'
	// 							}
	// 							onClick={ updateAmPm( 'PM' ) }
	// 							className="components-datetime__time-pm-button"
	// 						>
	// 							{ __( 'PM' ) }
	// 						</Button>
	// 					</ButtonGroup>
	// 				) }

	// 				<TimeZone />
	// 			</div>
	// 		</fieldset>
	// 	</div>
	// );
}

export default TimePicker;
