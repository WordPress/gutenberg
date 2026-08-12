import { format, isValid as isValidDate, parseISO } from 'date-fns';
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

	// The calendar reads and reports the `Date`s it is given in the timezone of
	// its `timeZone` prop, falling back to the browser's when it has none, while
	// the value is edited as a wall clock in the WordPress timezone. The two
	// have to be kept in the same frame, or they disagree on which day a value
	// holds and on which day was clicked.
	//
	// A site with a named timezone hands it to the calendar, which then works in
	// the site frame and marks the site's today — matching the date picker used
	// outside DataForm. A site configured with a manual UTC offset has no name to
	// hand over: the calendar formats its labels through `Intl`, which accepts a
	// `±HH:MM` identifier only on the newest engines, so the calendar keeps
	// working in the browser frame and the wall clock is re-anchored to it.
	const { timezone, l10n } = getSettings();
	const timeZone = timezone.string || undefined;

	/**
	 * Turns a stored value into the `Date` the calendar should work with.
	 *
	 * @param dateTimeValue Stored value, parsable by `getDate`.
	 *
	 * @return The calendar's date, or `null` if the value is missing or invalid.
	 */
	const getCalendarDate = useCallback(
		( dateTimeValue?: string ): Date | null => {
			if ( ! dateTimeValue ) {
				return null;
			}
			// A calendar working in the site frame re-anchors the instant
			// itself; one working in the browser frame is handed the site wall
			// clock re-anchored to that frame.
			const date = timeZone
				? getDate( dateTimeValue )
				: parseISO( formatDateTime( dateTimeValue ) );
			return isValidDate( date ) ? date : null;
		},
		[ timeZone ]
	);

	const [ calendarMonth, setCalendarMonth ] = useState< Date >( () => {
		const parsedDate = getCalendarDate( value );
		return parsedDate || new Date(); // Default to current month
	} );

	const inputControlRef = useRef< HTMLInputElement >( null );
	const validationTimeoutRef =
		useRef< ReturnType< typeof setTimeout > >( undefined );

	const { minConstraint, maxConstraint, disabledMatchers } =
		useDisabledDateMatchers( isValid, getCalendarDate );

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
				// Read the day the calendar reported in the frame it reported it
				// in — re-anchoring across frames lands on the adjacent day
				// whenever the two disagree on the date.
				const wpDate = timeZone
					? dateI18n( 'Y-m-d', newDate )
					: format( newDate, 'yyyy-MM-dd' );

				// Preserve the time from the current value; a value set for the
				// first time starts at the beginning of the day.
				const wpTime = value
					? dateI18n( 'H:i', getDate( value ) )
					: '00:00';

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
		[ onChangeCallback, timeZone, value ]
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
		[ getCalendarDate, onChangeCallback ]
	);

	const { format: fieldFormat } = field;
	const weekStartsOn =
		( fieldFormat as FormatDatetime ).weekStartsOn ?? l10n.startOfWeek;

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
						value={ getCalendarDate( value ) }
						onValueChange={ onSelectDate }
						month={ calendarMonth }
						onMonthChange={ setCalendarMonth }
						timeZone={ timeZone }
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
