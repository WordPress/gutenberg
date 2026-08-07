import { format, isValid as isValidDate, parseISO } from 'date-fns';
import {
	BaseControl,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { Stack } from '@wordpress/ui';
import type { DataFormControlProps, FormatDatetime } from '../../types';
import { OPERATOR_IN_THE_PAST, OPERATOR_OVER } from '../../constants';
import RelativeDateControl from './utils/relative-date-control';
import useDisabledDateMatchers from './utils/use-disabled-date-matchers';
import getCustomValidity from './utils/get-custom-validity';
import { unlock } from '../../lock-unlock';

const { DateCalendar, ValidatedInputControl } = unlock( componentsPrivateApis );

const formatDateTime = ( value?: string ): string => {
	if ( ! value ) {
		return '';
	}
	// Format in WordPress timezone for datetime-local input: YYYY-MM-DDTHH:mm
	return dateI18n( 'Y-m-d\\TH:i', getDate( value ) );
};

/**
 * Turns a stored value into the `Date` the calendar should work with.
 *
 * The value is an instant, but the control edits it as a wall clock in the
 * WordPress timezone, while the calendar reads and reports the plain `Date`s it
 * is given in the browser timezone. Re-anchoring the wall clock to the browser
 * timezone puts both in the same frame, so the day the calendar shows and
 * reports is the day the field holds.
 *
 * @param value Stored value, parsable by `getDate`.
 *
 * @return The calendar's date, or `null` if the value is missing or invalid.
 */
const getCalendarDate = ( value?: string ): Date | null => {
	const wallClock = formatDateTime( value );
	if ( ! wallClock ) {
		return null;
	}
	const date = parseISO( wallClock );
	return isValidDate( date ) ? date : null;
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
		const parsedDate = getCalendarDate( value );
		return parsedDate || new Date(); // Default to current month
	} );

	const inputControlRef = useRef< HTMLInputElement >( null );
	const validationTimeoutRef =
		useRef< ReturnType< typeof setTimeout > >( undefined );
	const previousFocusRef = useRef< Element | null >( null );

	const { minConstraint, maxConstraint, disabledMatchers } =
		useDisabledDateMatchers( isValid, getCalendarDate );

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
				// Read the day the calendar reported, rather than re-anchoring
				// the instant to the WordPress timezone, which lands on the
				// adjacent day whenever the two timezones disagree.
				const wpDate = format( newDate, 'yyyy-MM-dd' );

				// Preserve the time from the current value; a value set for the
				// first time starts at the beginning of the day.
				const wpTime = value
					? dateI18n( 'H:i', getDate( value ) )
					: '00:00';

				// Combine date and time in WP timezone and convert to ISO
				const finalDateTime = getDate( `${ wpDate }T${ wpTime }` );
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
				// Interpret the datetime-local value in WordPress timezone
				const dateTime = getDate( newValue );
				onChangeCallback( dateTime.toISOString() );

				// Update calendar month to match
				const parsedDate = getCalendarDate( dateTime.toISOString() );
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
					<DateCalendar
						style={ { width: '100%' } }
						selected={ getCalendarDate( value ) || undefined }
						onSelect={ onSelectDate }
						month={ calendarMonth }
						onMonthChange={ setCalendarMonth }
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
