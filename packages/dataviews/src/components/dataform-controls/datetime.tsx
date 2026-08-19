import {
	BaseControl,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { Calendar, Stack } from '@wordpress/ui';
import type { DataFormControlProps, FormatDatetime } from '../../types';
import { OPERATOR_IN_THE_PAST, OPERATOR_OVER } from '../../constants';
import RelativeDateControl from './utils/relative-date-control';
import useDisabledDateMatchers from './utils/use-disabled-date-matchers';
import getCustomValidity from './utils/get-custom-validity';
import parseDateTime from '../../field-types/utils/parse-date-time';
import { unlock } from '../../lock-unlock';

const { ValidatedInputControl } = unlock( componentsPrivateApis );

const formatDateTime = ( value?: string ): string => {
	if ( ! value ) {
		return '';
	}
	// Format in WordPress timezone for datetime-local input: YYYY-MM-DDTHH:mm
	return dateI18n( 'Y-m-d\\TH:i', getDate( value ) );
};

function CalendarDateTimeControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	validity,
	config,
}: DataFormControlProps< Item > ) {
	const { compact } = config || {};
	const { id, label, description, setValue, getValue, isValid } = field;
	const disabled = field.isDisabled( { item: data, field } );
	const fieldValue = getValue( { item: data } );
	const value = typeof fieldValue === 'string' ? fieldValue : undefined;

	const [ calendarMonth, setCalendarMonth ] = useState< Date >( () => {
		const parsedDate = parseDateTime( value );
		return parsedDate || new Date(); // Default to current month
	} );

	const inputControlRef = useRef< HTMLInputElement >( null );
	const validationTimeoutRef =
		useRef< ReturnType< typeof setTimeout > >( undefined );

	const { minConstraint, maxConstraint, disabledMatchers } =
		useDisabledDateMatchers( isValid, parseDateTime );

	const onChangeCallback = useCallback(
		( newValue: string | undefined ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	// Cleanup timeout on unmount
	useEffect( () => {
		return () => clearTimeout( validationTimeoutRef.current );
	}, [] );

	const onSelectDate = useCallback(
		( newDate: Date | null ) => {
			if ( newDate ) {
				// Extract the date part in WP timezone from the calendar selection
				const wpDate = dateI18n( 'Y-m-d', newDate );

				// Preserve time if it exists in current value, otherwise use current time
				let wpTime: string;
				if ( value ) {
					wpTime = dateI18n( 'H:i', getDate( value ) );
				} else {
					wpTime = dateI18n( 'H:i', newDate );
				}

				// Combine date and time in WP timezone and convert to ISO
				const finalDateTime = getDate( `${ wpDate }T${ wpTime }` );
				onChangeCallback( finalDateTime.toISOString() );
			} else {
				onChangeCallback( undefined );
			}

			// A calendar interaction counts as touching the field: reveal the
			// input's validity state by firing a synthetic `invalid` event,
			// which the validated control listens to in order to display its
			// error message without moving focus (unlike `reportValidity()`).
			// The control re-reads the message on this event, so dispatching
			// unconditionally is also what clears a stale error once a valid
			// date is selected.
			// The timeout ensures the input has re-rendered with the new
			// value before its validity is sampled.
			clearTimeout( validationTimeoutRef.current );
			validationTimeoutRef.current = setTimeout( () => {
				const input = inputControlRef.current;
				if ( ! input ) {
					return;
				}
				input.dispatchEvent(
					new Event( 'invalid', { cancelable: true } )
				);
				// Focus stays on the calendar, so announce the message;
				// revealing it alone would go unnoticed by screen readers.
				if ( input.validationMessage ) {
					speak( input.validationMessage );
				}
			}, 0 );
		},
		[ onChangeCallback, value ]
	);

	const handleManualDateTimeChange = useCallback(
		( newValue?: string ) => {
			if ( newValue ) {
				// Interpret the datetime-local value in WordPress timezone
				const dateTime = getDate( newValue );
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

	const { format: fieldFormat } = field;
	const weekStartsOn =
		( fieldFormat as FormatDatetime ).weekStartsOn ??
		getSettings().l10n.startOfWeek;
	const {
		timezone: { string: timezoneString },
	} = getSettings();

	let displayLabel = label;
	if ( isValid?.required && ! markWhenOptional && ! hideLabelFromVision ) {
		displayLabel = `${ label } (${ __( 'Required' ) })`;
	} else if (
		! isValid?.required &&
		markWhenOptional &&
		! hideLabelFromVision
	) {
		displayLabel = `${ label } (${ __( 'Optional' ) })`;
	}

	return (
		<BaseControl
			id={ id }
			label={ displayLabel }
			help={ description }
			hideLabelFromVision={ hideLabelFromVision }
		>
			<Stack direction="column" gap="lg">
				{ /* Manual datetime input */ }
				<ValidatedInputControl
					ref={ inputControlRef }
					required={ !! isValid?.required }
					customValidity={ getCustomValidity( isValid, validity ) }
					type="datetime-local"
					label={ __( 'Date time' ) }
					hideLabelFromVision
					value={ formatDateTime( value ) }
					onChange={ handleManualDateTimeChange }
					disabled={ disabled }
					min={
						minConstraint
							? formatDateTime( minConstraint )
							: undefined
					}
					max={
						maxConstraint
							? formatDateTime( maxConstraint )
							: undefined
					}
				/>
				{ /* Calendar widget */ }
				{ ! compact && (
					<Calendar
						style={ { width: '100%' } }
						value={ value ? parseDateTime( value ) : null }
						onValueChange={ onSelectDate }
						month={ calendarMonth }
						onMonthChange={ setCalendarMonth }
						timeZone={ timezoneString || undefined }
						weekStartsOn={ weekStartsOn }
						disabled={ disabled || disabledMatchers }
					/>
				) }
			</Stack>
		</BaseControl>
	);
}

export default function DateTime< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	operator,
	validity,
	config,
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
			markWhenOptional={ markWhenOptional }
			validity={ validity }
			config={ config }
		/>
	);
}
