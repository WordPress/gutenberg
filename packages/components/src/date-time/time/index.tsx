/**
 * External dependencies
 */
import { startOfMinute } from 'date-fns';

/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { date as formatDate } from '@wordpress/date';

/**
 * Internal dependencies
 */
import BaseControl from '../../base-control';
import { VisuallyHidden } from '../../visually-hidden';
import SelectControl from '../../select-control';
import TimeZone from './timezone';
import type { TimeInputValue, TimePickerProps } from '../types';
import {
	Wrapper,
	Fieldset,
	MonthSelectWrapper,
	DayInput,
	YearInput,
} from './styles';
import { HStack } from '../../h-stack';
import { Spacer } from '../../spacer';
import type { InputChangeCallback } from '../../input-control/types';
import {
	inputToDate,
	buildPadInputStateReducer,
	validateInputElementTarget,
	setInConfiguredTimezone,
	isValidDate,
	getDaysInMonth,
} from '../utils';
import { TIMEZONELESS_FORMAT } from '../constants';
import { TimeInput } from './time-input';

const VALID_DATE_ORDERS = [ 'dmy', 'mdy', 'ymd' ];

/**
 * TimePicker is a React component that renders a clock for time selection.
 *
 * ```jsx
 * import { TimePicker } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyTimePicker = () => {
 *   const [ time, setTime ] = useState( new Date() );
 *
 *   return (
 *     <TimePicker
 *       currentTime={ date }
 *       onChange={ ( newTime ) => setTime( newTime ) }
 *       is12Hour
 *     />
 *   );
 * };
 * ```
 */
export function TimePicker( {
	is12Hour,
	currentTime,
	onChange,
	dateOrder: dateOrderProp,
	hideLabelFromVision = false,
}: TimePickerProps ) {
	const [ date, setDate ] = useState( () =>
		// Truncate the date at the minutes, see: #15495.
		startOfMinute( inputToDate( currentTime ?? new Date() ) )
	);

	// Key to force re-render of inputs when values are clamped.
	// Incrementing this remounts the input, resetting its internal state to match the controlled value.
	const [ inputResetKey, setInputResetKey ] = useState( 0 );

	// Reset the state when currentTime changed.
	// TODO: useEffect() shouldn't be used like this, causes an unnecessary render
	useEffect( () => {
		setDate( startOfMinute( inputToDate( currentTime ?? new Date() ) ) );
	}, [ currentTime ] );

	const monthOptions = [
		{ value: '01', label: __( 'January' ) },
		{ value: '02', label: __( 'February' ) },
		{ value: '03', label: __( 'March' ) },
		{ value: '04', label: __( 'April' ) },
		{ value: '05', label: __( 'May' ) },
		{ value: '06', label: __( 'June' ) },
		{ value: '07', label: __( 'July' ) },
		{ value: '08', label: __( 'August' ) },
		{ value: '09', label: __( 'September' ) },
		{ value: '10', label: __( 'October' ) },
		{ value: '11', label: __( 'November' ) },
		{ value: '12', label: __( 'December' ) },
	] as const;

	const { day, month, year, minutes, hours } = useMemo(
		() => ( {
			day: formatDate( 'd', date ),
			month: formatDate(
				'm',
				date
			) as ( typeof monthOptions )[ number ][ 'value' ],
			year: formatDate( 'Y', date ),
			minutes: formatDate( 'i', date ),
			hours: formatDate( 'H', date ),
		} ),
		[ date ]
	);

	const buildNumberControlChangeCallback = ( method: 'date' | 'year' ) => {
		const callback: InputChangeCallback = ( value, { event } ) => {
			if ( ! validateInputElementTarget( event ) ) {
				return;
			}

			const stringValue = String( value ).trim();
			const numberValue = Number( value );

			// Get current date components in configured timezone.
			const currentMonth = Number( formatDate( 'n', date ) );
			const currentYear = Number( formatDate( 'Y', date ) );
			const currentDay = Number( formatDate( 'j', date ) );

			// Detect if field was cleared (empty or browser set to min).
			// When a number input is cleared and blurred, the browser sets it to min.
			// We detect this by checking if the new value is the HTML min attribute value
			// AND the previous controlled value was different.
			const htmlMin = method === 'date' ? 1 : 1; // Both have min=1
			const previousValue = method === 'date' ? currentDay : currentYear;

			const isCleared =
				stringValue === '' ||
				( method === 'year' && numberValue < 1000 ) ||
				( numberValue === htmlMin && previousValue !== htmlMin );

			if ( isCleared ) {
				setInputResetKey( ( key ) => key + 1 );
				return;
			}

			let updates: { date?: number; year?: number } = {};
			let wasClamped = false;

			if ( method === 'date' ) {
				// Validate day: must be 1-31 and valid for current month/year.
				// Clamp to valid range (consistent with hour/minute behavior).
				const maxDays = getDaysInMonth( currentYear, currentMonth );
				if ( isNaN( numberValue ) ) {
					setInputResetKey( ( key ) => key + 1 );
					return;
				}
				const clampedDay = Math.max( 1, Math.min( numberValue, maxDays ) );
				wasClamped = clampedDay !== numberValue;
				updates = { date: clampedDay };
			}

			if ( method === 'year' ) {
				// Validate year: must be 1000-9999.
				// Clamp to valid range (consistent with hour/minute behavior).
				if ( isNaN( numberValue ) ) {
					setInputResetKey( ( key ) => key + 1 );
					return;
				}
				const clampedYear = Math.max( 1000, Math.min( numberValue, 9999 ) );
				wasClamped = clampedYear !== numberValue;

				// Re-validate day for new year (leap year handling).
				// If current day exceeds max days in the new year/month, clamp it.
				const maxDays = getDaysInMonth( clampedYear, currentMonth );
				const validDay = Math.min( currentDay, maxDays );

				updates = { year: clampedYear };
				if ( validDay !== currentDay ) {
					updates.date = validDay;
					wasClamped = true;
				}
			}

			// Internal date is UTC-normalized, but the field should be updated
			// as if in the configured timezone.
			const newDate = setInConfiguredTimezone( date, updates );

			// Only update if the new date is valid.
			if ( isValidDate( newDate ) ) {
				setDate( newDate );
				onChange?.( formatDate( TIMEZONELESS_FORMAT, newDate ) );

				// If value was clamped, force re-render of inputs to show corrected value.
				if ( wasClamped ) {
					setInputResetKey( ( key ) => key + 1 );
				}
			}
		};
		return callback;
	};

	const onTimeInputChangeCallback = ( {
		hours: newHours,
		minutes: newMinutes,
	}: TimeInputValue ) => {
		// Internal date is UTC-normalized, but the field should be updated
		// as if in the configured timezone.
		const newDate = setInConfiguredTimezone( date, {
			hours: newHours,
			minutes: newMinutes,
		} );
		setDate( newDate );
		onChange?.( formatDate( TIMEZONELESS_FORMAT, newDate ) );
	};

	const dayField = (
		<DayInput
			key={ `day-${ inputResetKey }` }
			className="components-datetime__time-field components-datetime__time-field-day" // Unused, for backwards compatibility.
			label={ __( 'Day' ) }
			hideLabelFromVision
			__next40pxDefaultSize
			value={ day }
			step={ 1 }
			min={ 1 }
			max={ 31 }
			required
			spinControls="none"
			isPressEnterToChange
			isDragEnabled={ false }
			isShiftStepEnabled={ false }
			onChange={ buildNumberControlChangeCallback( 'date' ) }
			__unstableStateReducer={ buildPadInputStateReducer( 2 ) }
		/>
	);

	const monthField = (
		<MonthSelectWrapper key="month">
			<SelectControl
				className="components-datetime__time-field components-datetime__time-field-month" // Unused, for backwards compatibility.
				label={ __( 'Month' ) }
				hideLabelFromVision
				__next40pxDefaultSize
				value={ month }
				options={ monthOptions }
				onChange={ ( value ) => {
					const newMonth = Number( value );
					const currentDay = Number( formatDate( 'j', date ) );
					const currentYear = Number( formatDate( 'Y', date ) );

					// Check if current day is valid for new month.
					// Clamp day to max valid day for the new month (e.g., Jan 31 -> Feb 28).
					const maxDays = getDaysInMonth( currentYear, newMonth );
					const validDay = Math.min( currentDay, maxDays );

					// Internal date is UTC-normalized, but the field should be updated
					// as if in the configured timezone.
					const newDate = setInConfiguredTimezone( date, {
						month: newMonth - 1,
						date: validDay,
					} );

					// Only update if the new date is valid.
					if ( isValidDate( newDate ) ) {
						setDate( newDate );
						onChange?.( formatDate( TIMEZONELESS_FORMAT, newDate ) );
					}
				} }
			/>
		</MonthSelectWrapper>
	);

	const yearField = (
		<YearInput
			key={ `year-${ inputResetKey }` }
			className="components-datetime__time-field components-datetime__time-field-year" // Unused, for backwards compatibility.
			label={ __( 'Year' ) }
			hideLabelFromVision
			__next40pxDefaultSize
			value={ year }
			step={ 1 }
			min={ 1 }
			max={ 9999 }
			required
			spinControls="none"
			isPressEnterToChange
			isDragEnabled={ false }
			isShiftStepEnabled={ false }
			onChange={ buildNumberControlChangeCallback( 'year' ) }
			__unstableStateReducer={ buildPadInputStateReducer( 4 ) }
		/>
	);

	const defaultDateOrder = is12Hour ? 'mdy' : 'dmy';
	const dateOrder =
		dateOrderProp && VALID_DATE_ORDERS.includes( dateOrderProp )
			? dateOrderProp
			: defaultDateOrder;

	const fields = dateOrder.split( '' ).map( ( field ) => {
		switch ( field ) {
			case 'd':
				return dayField;
			case 'm':
				return monthField;
			case 'y':
				return yearField;
			default:
				return null;
		}
	} );

	return (
		<Wrapper
			className="components-datetime__time" // Unused, for backwards compatibility.
		>
			<Fieldset>
				{ hideLabelFromVision ? (
					<VisuallyHidden as="legend">
						{ __( 'Time' ) }
					</VisuallyHidden>
				) : (
					<BaseControl.VisualLabel
						as="legend"
						className="components-datetime__time-legend" // Unused, for backwards compatibility.
					>
						{ __( 'Time' ) }
					</BaseControl.VisualLabel>
				) }
				<HStack
					className="components-datetime__time-wrapper" // Unused, for backwards compatibility.
				>
					<TimeInput
						value={ {
							hours: Number( hours ),
							minutes: Number( minutes ),
						} }
						is12Hour={ is12Hour }
						onChange={ onTimeInputChangeCallback }
					/>
					<Spacer />
					<TimeZone />
				</HStack>
			</Fieldset>
			<Fieldset>
				{ hideLabelFromVision ? (
					<VisuallyHidden as="legend">
						{ __( 'Date' ) }
					</VisuallyHidden>
				) : (
					<BaseControl.VisualLabel
						as="legend"
						className="components-datetime__time-legend" // Unused, for backwards compatibility.
					>
						{ __( 'Date' ) }
					</BaseControl.VisualLabel>
				) }
				<HStack
					className="components-datetime__time-wrapper" // Unused, for backwards compatibility.
				>
					{ fields }
				</HStack>
			</Fieldset>
		</Wrapper>
	);
}

/**
 * A component to input a time.
 *
 * Values are passed as an object in 24-hour format (`{ hours: number, minutes: number }`).
 *
 * ```jsx
 * import { TimePicker } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyTimeInput = () => {
 * 	const [ time, setTime ] = useState( { hours: 13, minutes: 30 } );
 *
 * 	return (
 * 		<TimePicker.TimeInput
 * 			value={ time }
 * 			onChange={ setTime }
 * 			label="Time"
 * 		/>
 * 	);
 * };
 * ```
 */
TimePicker.TimeInput = TimeInput;
Object.assign( TimePicker.TimeInput, { displayName: 'TimePicker.TimeInput' } );

export default TimePicker;
