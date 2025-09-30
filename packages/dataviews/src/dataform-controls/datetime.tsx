/**
 * WordPress dependencies
 */
import {
	BaseControl,
	privateApis as componentsPrivateApis,
	__experimentalInputControl as InputControl,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getDate, getSettings } from '@wordpress/date';

/**
 * External dependencies
 */
import { format, isValid } from 'date-fns';

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

const { DateCalendar } = unlock( componentsPrivateApis );

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

function CalendarDateTimeControl( {
	id,
	value,
	onChange,
	label,
	description,
	hideLabelFromVision,
}: {
	id: string;
	value: string | undefined;
	onChange: ( value: string | undefined ) => void;
	label: string;
	description?: string;
	hideLabelFromVision?: boolean;
} ) {
	const [ calendarMonth, setCalendarMonth ] = useState< Date >( () => {
		const parsedDate = parseDateTime( value );
		return parsedDate || new Date(); // Default to current month
	} );

	const onSelectDate = useCallback(
		( newDate: Date | undefined | null ) => {
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

				const dateTimeValue = finalDateTime.toISOString();
				onChange( dateTimeValue );
			} else {
				onChange( undefined );
			}
		},
		[ onChange, value ]
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
				<InputControl
					__next40pxDefaultSize
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
		/>
	);
}
