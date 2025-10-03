/**
 * External dependencies
 */
import deepMerge from 'deepmerge';
import { format, isValid } from 'date-fns';

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
import RelativeDateControl, {
	TIME_UNITS_OPTIONS,
	type DateRelative,
} from './relative-date-control';
import { unlock } from '../lock-unlock';

const { DateCalendar, ValidatedInputControl } = unlock( componentsPrivateApis );

const parseDateTime = ( dateTimeString?: string ): Date | null => {
	if ( ! dateTimeString ) {
		return null;
	}
	const parsed = getDate( dateTimeString );
	return parsed && isValid( parsed ) ? parsed : null;
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
	id,
	value,
	onChange,
	label,
	description,
	hideLabelFromVision,
	data,
	field,
	setValue,
}: {
	id: string;
	value: string | undefined;
	onChange: ( value: string | undefined ) => void;
	label: string;
	description?: string;
	hideLabelFromVision?: boolean;
	data: Item;
	field: any;
	setValue: any;
} ) {
	const [ calendarMonth, setCalendarMonth ] = useState< Date >( () => {
		const parsedDate = parseDateTime( value );
		return parsedDate || new Date(); // Default to current month
	} );

	const [ customValidity, setCustomValidity ] =
		useState<
			React.ComponentProps<
				typeof ValidatedInputControl
			>[ 'customValidity' ]
		>( undefined );

	const inputControlRef = useRef< HTMLInputElement >( null );
	const validationTimeoutRef = useRef< ReturnType< typeof setTimeout > >();
	const previousFocusRef = useRef< Element | null >( null );

	// Cleanup timeout on unmount
	useEffect( () => {
		return () => {
			if ( validationTimeoutRef.current ) {
				clearTimeout( validationTimeoutRef.current );
			}
		};
	}, [] );

	const onValidateControl = useCallback(
		( newValue: any ) => {
			const message = field.isValid?.custom?.(
				deepMerge(
					data,
					setValue( {
						item: data,
						value: newValue,
					} ) as Partial< Item >
				),
				field
			);

			if ( message ) {
				setCustomValidity( {
					type: 'invalid',
					message,
				} );
				return;
			}

			setCustomValidity( undefined );
		},
		[ data, field, setValue ]
	);

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
				onChange( dateTimeValue );
				onValidateControl( dateTimeValue );

				// Clear any existing timeout
				if ( validationTimeoutRef.current ) {
					clearTimeout( validationTimeoutRef.current );
				}
			} else {
				onChange( undefined );
				onValidateControl( undefined );
			}
			// Save the currently focused element
			previousFocusRef.current =
				inputControlRef.current &&
				inputControlRef.current.ownerDocument.activeElement;

			// Trigger validation display by simulating focus and blur and changes
			validationTimeoutRef.current = setTimeout( () => {
				if ( inputControlRef.current ) {
					inputControlRef.current.focus();
					inputControlRef.current.blur();
					onChange( dateTimeValue );
					onValidateControl( dateTimeValue );

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
		[ onChange, value, onValidateControl ]
	);

	const handleManualDateTimeChange = useCallback(
		( newValue?: string ) => {
			if ( newValue ) {
				// Convert from datetime-local format to ISO string
				const dateTime = new Date( newValue );
				onChange( dateTime.toISOString() );

				// Update calendar month to match
				const parsedDate = parseDateTime( dateTime.toISOString() );
				if ( parsedDate ) {
					setCalendarMonth( parsedDate );
				}
			} else {
				onChange( undefined );
			}
		},
		[ onChange ]
	);

	const {
		timezone: { string: timezoneString },
		l10n: { startOfWeek },
	} = getSettings();

	return (
		<BaseControl
			__nextHasNoMarginBottom
			id={ id }
			label={ label }
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
					required={ !! field.isValid?.required }
					onValidate={ onValidateControl }
					customValidity={ customValidity }
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
}: DataFormControlProps< Item > ) {
	const { id, label, description, getValue, setValue } = field;
	const value = getValue( { item: data } );

	const onChangeRelativeDateControl = useCallback(
		( newValue: DateRelative ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	const onChangeCalendarDateTimeControl = useCallback(
		( newValue: string | undefined ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	if ( operator === OPERATOR_IN_THE_PAST || operator === OPERATOR_OVER ) {
		return (
			<RelativeDateControl
				className="dataviews-controls__datetime"
				id={ id }
				value={ value && typeof value === 'object' ? value : {} }
				onChange={ onChangeRelativeDateControl }
				label={ label }
				hideLabelFromVision={ hideLabelFromVision }
				options={ TIME_UNITS_OPTIONS[ operator ] }
			/>
		);
	}

	return (
		<CalendarDateTimeControl
			id={ id }
			value={ typeof value === 'string' ? value : undefined }
			onChange={ onChangeCalendarDateTimeControl }
			label={ label }
			description={ description }
			hideLabelFromVision={ hideLabelFromVision }
			data={ data }
			field={ field }
			setValue={ setValue }
		/>
	);
}
