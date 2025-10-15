/**
 * External dependencies
 */
import { format, isValid as isValidDate } from 'date-fns';

/**
 * WordPress dependencies
 */
import {
	BaseControl,
	privateApis as componentsPrivateApis,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getDate, getSettings } from '@wordpress/date';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { OPERATOR_IN_THE_PAST, OPERATOR_OVER } from '../constants';
import RelativeDateControl from './utils/relative-date-control';
import getCustomValidity from './utils/get-custom-validity';
import { unlock } from '../lock-unlock';

const { DateCalendar, ValidatedInputControl } = unlock( componentsPrivateApis );

const parseDateTime = ( dateTimeString?: string ): Date | null => {
	if ( ! dateTimeString ) {
		return null;
	}
	const parsed = getDate( dateTimeString );
	return parsed && isValidDate( parsed ) ? parsed : null;
};

const formatDateTime = ( date?: Date | string ): string => {
	if ( ! date ) {
		return '';
	}
	if ( typeof date === 'string' ) {
		return date;
	}
	// Format as datetime-local input expects: YYYY-MM-DDTHH:mm
	return format( date, "yyyy-MM-dd'T'HH:mm" );
};

function CalendarDateTimeControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const { id, label, description, setValue, getValue, isValid } = field;
	const fieldValue = getValue( { item: data } );
	const value = typeof fieldValue === 'string' ? fieldValue : undefined;

	const [ calendarMonth, setCalendarMonth ] = useState< Date >( () => {
		const parsedDate = parseDateTime( value );
		return parsedDate || new Date(); // Default to current month
	} );

	const inputControlRef = useRef< HTMLInputElement >( null );
	const validationTimeoutRef = useRef< ReturnType< typeof setTimeout > >();
	const previousFocusRef = useRef< Element | null >( null );

	const onChangeCallback = useCallback(
		( newValue: string | undefined ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	// Cleanup timeout on unmount
	useEffect( () => {
		return () => {
			if ( validationTimeoutRef.current ) {
				clearTimeout( validationTimeoutRef.current );
			}
		};
	}, [] );

	const onSelectDate = useCallback(
		( newDate: Date | undefined | null ) => {
			let dateTimeValue: string | undefined;
			if ( newDate ) {
				// Preserve time if it exists in current value, otherwise use current time
				let finalDateTime = newDate;

				if ( value ) {
					const currentDateTime = parseDateTime( value );
					if ( currentDateTime ) {
						// Preserve the time part
						finalDateTime = new Date( newDate );
						finalDateTime.setHours( currentDateTime.getHours() );
						finalDateTime.setMinutes(
							currentDateTime.getMinutes()
						);
					}
				}

				dateTimeValue = finalDateTime.toISOString();
				onChangeCallback( dateTimeValue );

				// Clear any existing timeout
				if ( validationTimeoutRef.current ) {
					clearTimeout( validationTimeoutRef.current );
				}
			} else {
				onChangeCallback( undefined );
			}
			// Save the currently focused element
			previousFocusRef.current =
				inputControlRef.current &&
				inputControlRef.current.ownerDocument.activeElement;

			// Trigger validation display by simulating focus, blur, and changes.
			// Use a timeout to ensure it runs after the value update.
			validationTimeoutRef.current = setTimeout( () => {
				if ( inputControlRef.current ) {
					inputControlRef.current.focus();
					inputControlRef.current.blur();
					onChangeCallback( dateTimeValue );

					// Restore focus to the previously focused element
					if (
						previousFocusRef.current &&
						previousFocusRef.current instanceof HTMLElement
					) {
						previousFocusRef.current.focus();
					}
				}
			}, 0 );
		},
		[ onChangeCallback, value ]
	);

	const handleManualDateTimeChange = useCallback(
		( newValue?: string ) => {
			if ( newValue ) {
				// Convert from datetime-local format to ISO string
				const dateTime = new Date( newValue );
				onChangeCallback( dateTime.toISOString() );

				// Update calendar month to match
				const parsedDate = parseDateTime( dateTime.toISOString() );
				if ( parsedDate ) {
					setCalendarMonth( parsedDate );
				}
			} else {
				onChangeCallback( undefined );
			}
		},
		[ onChangeCallback ]
	);

	const {
		timezone: { string: timezoneString },
		l10n: { startOfWeek },
	} = getSettings();

	const displayLabel =
		isValid?.required && ! hideLabelFromVision
			? `${ label } (${ __( 'Required' ) })`
			: label;

	return (
		<BaseControl
			__nextHasNoMarginBottom
			id={ id }
			label={ displayLabel }
			help={ description }
			hideLabelFromVision={ hideLabelFromVision }
		>
			<VStack spacing={ 4 }>
				{ /* Calendar widget */ }
				<DateCalendar
					style={ { width: '100%' } }
					selected={
						value ? parseDateTime( value ) || undefined : undefined
					}
					onSelect={ onSelectDate }
					month={ calendarMonth }
					onMonthChange={ setCalendarMonth }
					timeZone={ timezoneString || undefined }
					weekStartsOn={ startOfWeek }
				/>
				{ /* Manual datetime input */ }
				<ValidatedInputControl
					ref={ inputControlRef }
					__next40pxDefaultSize
					required={ !! isValid?.required }
					customValidity={ getCustomValidity( isValid, validity ) }
					type="datetime-local"
					label={ __( 'Date time' ) }
					hideLabelFromVision
					value={
						value
							? formatDateTime(
									parseDateTime( value ) || undefined
							  )
							: ''
					}
					onChange={ handleManualDateTimeChange }
				/>
			</VStack>
		</BaseControl>
	);
}

export default function DateTime< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	operator,
	validity,
}: DataFormControlProps< Item > ) {
	if ( operator === OPERATOR_IN_THE_PAST || operator === OPERATOR_OVER ) {
		return (
			<RelativeDateControl
				className="dataviews-controls__datetime"
				data={ data }
				field={ field }
				onChange={ onChange }
				hideLabelFromVision={ hideLabelFromVision }
				operator={ operator }
			/>
		);
	}

	return (
		<CalendarDateTimeControl
			data={ data }
			field={ field }
			onChange={ onChange }
			hideLabelFromVision={ hideLabelFromVision }
			validity={ validity }
		/>
	);
}
