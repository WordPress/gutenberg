/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Button,
	privateApis as componentsPrivateApis,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getDate, getSettings } from '@wordpress/date';

/**
 * External dependencies
 */
import deepMerge from 'deepmerge';
import {
	format,
	isValid,
	subMonths,
	subDays,
	subYears,
	startOfMonth,
	startOfYear,
} from 'date-fns';

/**
 * Internal dependencies
 */
import RelativeDateControl, {
	TIME_UNITS_OPTIONS,
	type DateRelative,
} from './relative-date-control';
import {
	OPERATOR_IN_THE_PAST,
	OPERATOR_OVER,
	OPERATOR_BETWEEN,
} from '../constants';
import { unlock } from '../lock-unlock';
import type { DataFormControlProps } from '../types';

const { DateCalendar, DateRangeCalendar, ValidatedInputControl } = unlock(
	componentsPrivateApis
);

type DateRange = [ string, string ] | undefined;

const DATE_PRESETS: {
	id: string;
	label: string;
	getValue: () => Date;
}[] = [
	{
		id: 'today',
		label: __( 'Today' ),
		getValue: () => getDate( null ),
	},
	{
		id: 'yesterday',
		label: __( 'Yesterday' ),
		getValue: () => {
			const today = getDate( null );
			return subDays( today, 1 );
		},
	},
	{
		id: 'past-week',
		label: __( 'Past week' ),
		getValue: () => {
			const today = getDate( null );
			return subDays( today, 7 );
		},
	},
	{
		id: 'past-month',
		label: __( 'Past month' ),
		getValue: () => {
			const today = getDate( null );
			return subMonths( today, 1 );
		},
	},
];

const DATE_RANGE_PRESETS = [
	{
		id: 'last-7-days',
		label: __( 'Last 7 days' ),
		getValue: () => {
			const today = getDate( null );
			return [ subDays( today, 7 ), today ];
		},
	},
	{
		id: 'last-30-days',
		label: __( 'Last 30 days' ),
		getValue: () => {
			const today = getDate( null );
			return [ subDays( today, 30 ), today ];
		},
	},
	{
		id: 'month-to-date',
		label: __( 'Month to date' ),
		getValue: () => {
			const today = getDate( null );
			return [ startOfMonth( today ), today ];
		},
	},
	{
		id: 'last-year',
		label: __( 'Last year' ),
		getValue: () => {
			const today = getDate( null );
			return [ subYears( today, 1 ), today ];
		},
	},
	{
		id: 'year-to-date',
		label: __( 'Year to date' ),
		getValue: () => {
			const today = getDate( null );
			return [ startOfYear( today ), today ];
		},
	},
];

const parseDate = ( dateString?: string ): Date | null => {
	if ( ! dateString ) {
		return null;
	}
	const parsed = getDate( dateString );
	return parsed && isValid( parsed ) ? parsed : null;
};

const formatDate = ( date?: Date | string ): string => {
	if ( ! date ) {
		return '';
	}
	return typeof date === 'string' ? date : format( date, 'yyyy-MM-dd' );
};

function CalendarDateControl< Item >( {
	id,
	value,
	onChange,
	label,
	hideLabelFromVision,
	className,
	data,
	field,
}: {
	id: string;
	value: string | undefined;
	onChange: ( value: string | undefined ) => void;
	label: string;
	hideLabelFromVision?: boolean;
	className?: string;
	data: Item;
	field: DataFormControlProps< Item >[ 'field' ];
} ) {
	const [ selectedPresetId, setSelectedPresetId ] = useState< string | null >(
		null
	);
	const [ customValidity, setCustomValidity ] =
		useState<
			React.ComponentProps<
				typeof ValidatedInputControl
			>[ 'customValidity' ]
		>( undefined );

	const [ calendarMonth, setCalendarMonth ] = useState< Date >( () => {
		const parsedDate = parseDate( value );
		return parsedDate || new Date(); // Default to current month
	} );

	const onValidateControl = useCallback(
		( newValue: any ) => {
			// If field is not required and value is empty, clear validation
			if ( ! field.isValid?.required && ! newValue ) {
				setCustomValidity( undefined );
				return;
			}

			const message = field.isValid?.custom?.(
				deepMerge(
					data,
					field.setValue( {
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
		[ data, field ]
	);

	const onSelectDate = useCallback(
		( newDate: Date | undefined | null ) => {
			const dateValue = newDate
				? format( newDate, 'yyyy-MM-dd' )
				: undefined;
			onChange( dateValue );
			setSelectedPresetId( null );
			// Clear validation error when selecting from calendar
			if ( dateValue ) {
				onValidateControl( dateValue );
			} else {
				setCustomValidity( undefined );
			}
		},
		[ onChange, onValidateControl ]
	);

	const handlePresetClick = useCallback(
		( preset: ( typeof DATE_PRESETS )[ 0 ] ) => {
			const presetDate = preset.getValue();
			const dateValue = formatDate( presetDate );

			setCalendarMonth( presetDate );
			onChange( dateValue );
			setSelectedPresetId( preset.id );
			// Clear validation error when selecting preset
			onValidateControl( dateValue );
		},
		[ onChange, onValidateControl ]
	);

	const handleManualDateChange = useCallback(
		( newValue?: string ) => {
			onChange( newValue );
			if ( newValue ) {
				const parsedDate = parseDate( newValue );
				if ( parsedDate ) {
					setCalendarMonth( parsedDate );
				}
			}
			setSelectedPresetId( null );
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
			className={ className }
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
		>
			<VStack spacing={ 4 }>
				{ /* Preset buttons */ }
				<HStack spacing={ 2 } wrap justify="flex-start">
					{ DATE_PRESETS.map( ( preset ) => {
						const isSelected = selectedPresetId === preset.id;
						return (
							<Button
								className="dataviews-controls__date-preset"
								key={ preset.id }
								variant="tertiary"
								isPressed={ isSelected }
								size="small"
								onClick={ () => handlePresetClick( preset ) }
							>
								{ preset.label }
							</Button>
						);
					} ) }
					<Button
						className="dataviews-controls__date-preset"
						variant="tertiary"
						isPressed={ ! selectedPresetId }
						size="small"
						disabled={ !! selectedPresetId }
						accessibleWhenDisabled={ false }
					>
						{ __( 'Custom' ) }
					</Button>
				</HStack>

				{ /* Manual date input */ }
				<ValidatedInputControl
					required={ !! field.isValid?.required }
					onValidate={ onValidateControl }
					customValidity={ customValidity }
					__next40pxDefaultSize
					type="date"
					label={ __( 'Date' ) }
					hideLabelFromVision
					value={ value ?? '' }
					help={ field.description }
					onChange={ handleManualDateChange }
				/>

				{ /* Calendar widget */ }
				<DateCalendar
					style={ { width: '100%' } }
					selected={ value ? parseDate( value ) || undefined : undefined }
					onSelect={ onSelectDate }
					month={ calendarMonth }
					onMonthChange={ setCalendarMonth }
					timeZone={ timezoneString || undefined }
					weekStartsOn={ startOfWeek }
				/>
			</VStack>
		</BaseControl>
	);
}

function CalendarDateRangeControl< Item >( {
	id,
	value,
	onChange,
	label,
	hideLabelFromVision,
	className,
	data,
	field,
}: {
	id: string;
	value: DateRange;
	onChange: ( value: DateRange ) => void;
	label: string;
	hideLabelFromVision?: boolean;
	className?: string;
	data: Item;
	field: DataFormControlProps< Item >[ 'field' ];
} ) {
	const [ selectedPresetId, setSelectedPresetId ] = useState< string | null >(
		null
	);
	const [ customValidityFrom, setCustomValidityFrom ] =
		useState<
			React.ComponentProps<
				typeof ValidatedInputControl
			>[ 'customValidity' ]
		>( undefined );
	const [ customValidityTo, setCustomValidityTo ] =
		useState<
			React.ComponentProps<
				typeof ValidatedInputControl
			>[ 'customValidity' ]
		>( undefined );

	const selectedRange = useMemo( () => {
		if ( ! value ) {
			return { from: undefined, to: undefined };
		}

		const [ from, to ] = value;
		return {
			from: parseDate( from ) || undefined,
			to: parseDate( to ) || undefined,
		};
	}, [ value ] );

	const [ calendarMonth, setCalendarMonth ] = useState< Date >( () => {
		return selectedRange.from || new Date();
	} );

	const updateDateRange = useCallback(
		( fromDate?: Date | string, toDate?: Date | string ) => {
			if ( fromDate && toDate ) {
				onChange( [ formatDate( fromDate ), formatDate( toDate ) ] );
			} else if ( ! fromDate && ! toDate ) {
				onChange( undefined );
			}
			// Do nothing if only one date is set - wait for both
		},
		[ onChange ]
	);

	const validateRangeValue = useCallback(
		(
			fromValue: string | undefined,
			toValue: string | undefined,
			setValidity: ( validity: any ) => void
		) => {
			const updatedValue = [ fromValue, toValue ];

			// If field is not required and both values are empty, clear validation
			if ( ! field.isValid?.required && ! fromValue && ! toValue ) {
				setValidity( undefined );
				return;
			}

			const message = field.isValid?.custom?.(
				deepMerge(
					data,
					field.setValue( {
						item: data,
						value: updatedValue,
					} ) as Partial< Item >
				),
				field
			);

			if ( message ) {
				setValidity( {
					type: 'invalid',
					message,
				} );
				return;
			}

			setValidity( undefined );
		},
		[ data, field ]
	);

	const onValidateControlFrom = useCallback(
		( newValue: any ) => {
			const [ , currentTo ] = value || [ undefined, undefined ];
			validateRangeValue( newValue, currentTo, setCustomValidityFrom );
		},
		[ value, validateRangeValue ]
	);

	const onValidateControlTo = useCallback(
		( newValue: any ) => {
			const [ currentFrom ] = value || [ undefined, undefined ];
			validateRangeValue( currentFrom, newValue, setCustomValidityTo );
		},
		[ value, validateRangeValue ]
	);

	const onSelectCalendarRange = useCallback(
		(
			newRange:
				| { from: Date | undefined; to?: Date | undefined }
				| undefined
		) => {
			updateDateRange( newRange?.from, newRange?.to );
			setSelectedPresetId( null );
			// Clear validation errors when selecting from calendar
			if ( newRange?.from ) {
				const fromValue = formatDate( newRange.from );
				onValidateControlFrom( fromValue );
			}
			if ( newRange?.to ) {
				const toValue = formatDate( newRange.to );
				onValidateControlTo( toValue );
			}
		},
		[ updateDateRange, onValidateControlFrom, onValidateControlTo ]
	);

	const handlePresetClick = useCallback(
		( preset: ( typeof DATE_RANGE_PRESETS )[ 0 ] ) => {
			const [ startDate, endDate ] = preset.getValue();
			setCalendarMonth( startDate );
			updateDateRange( startDate, endDate );
			setSelectedPresetId( preset.id );
			// Clear validation errors when selecting preset
			const fromValue = formatDate( startDate );
			const toValue = formatDate( endDate );
			onValidateControlFrom( fromValue );
			onValidateControlTo( toValue );
		},
		[ updateDateRange, onValidateControlFrom, onValidateControlTo ]
	);

	const handleManualDateChange = useCallback(
		( fromOrTo: 'from' | 'to', newValue?: string ) => {
			const [ currentFrom, currentTo ] = value || [
				undefined,
				undefined,
			];
			const updatedFrom = fromOrTo === 'from' ? newValue : currentFrom;
			const updatedTo = fromOrTo === 'to' ? newValue : currentTo;

			updateDateRange( updatedFrom, updatedTo );

			if ( newValue ) {
				const parsedDate = parseDate( newValue );
				if ( parsedDate ) {
					setCalendarMonth( parsedDate );
				}
			}

			setSelectedPresetId( null );
		},
		[ value, updateDateRange ]
	);

	const { timezone, l10n } = getSettings();

	return (
		<BaseControl
			__nextHasNoMarginBottom
			id={ id }
			className={ className }
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
		>
			<VStack spacing={ 4 }>
				{ /* Preset buttons */ }
				<HStack spacing={ 2 } wrap justify="flex-start">
					{ DATE_RANGE_PRESETS.map( ( preset ) => {
						const isSelected = selectedPresetId === preset.id;
						return (
							<Button
								className="dataviews-controls__date-preset"
								key={ preset.id }
								variant="tertiary"
								isPressed={ isSelected }
								size="small"
								onClick={ () => handlePresetClick( preset ) }
							>
								{ preset.label }
							</Button>
						);
					} ) }
					<Button
						className="dataviews-controls__date-preset"
						variant="tertiary"
						isPressed={ ! selectedPresetId }
						size="small"
						accessibleWhenDisabled={ false }
						disabled={ !! selectedPresetId }
					>
						{ __( 'Custom' ) }
					</Button>
				</HStack>

				{ /* Manual date range inputs */ }
				<HStack spacing={ 2 }>
					<ValidatedInputControl
						required={ !! field.isValid?.required }
						onValidate={ onValidateControlFrom }
						customValidity={ customValidityFrom }
						__next40pxDefaultSize
						type="date"
						label={ __( 'From' ) }
						hideLabelFromVision
						value={ value?.[ 0 ] ?? '' }
						help={ field.description }
						onChange={ ( newValue: string ) =>
							handleManualDateChange( 'from', newValue )
						}
					/>
					<ValidatedInputControl
						required={ !! field.isValid?.required }
						onValidate={ onValidateControlTo }
						customValidity={ customValidityTo }
						__next40pxDefaultSize
						type="date"
						label={ __( 'To' ) }
						hideLabelFromVision
						value={ value?.[ 1 ] ?? '' }
						help={ field.description }
						onChange={ ( newValue: string ) =>
							handleManualDateChange( 'to', newValue )
						}
					/>
				</HStack>

				<DateRangeCalendar
					style={ { width: '100%' } }
					selected={ selectedRange }
					onSelect={ onSelectCalendarRange }
					month={ calendarMonth }
					onMonthChange={ setCalendarMonth }
					timeZone={ timezone.string || undefined }
					weekStartsOn={ l10n.startOfWeek }
				/>
			</VStack>
		</BaseControl>
	);
}

export default function DateControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	operator,
}: DataFormControlProps< Item > ) {
	const { id, label, getValue, setValue } = field;
	const value = getValue( { item: data } );

	const onChangeRelativeDateControl = useCallback(
		( newValue: DateRelative ) => {
			onChange( setValue( { item: data, value: newValue } ) );
		},
		[ data, onChange, setValue ]
	);

	const onChangeCalendarDateRangeControl = useCallback(
		( newValue: DateRange ) => {
			onChange(
				setValue( {
					item: data,
					value: newValue,
				} )
			);
		},
		[ data, onChange, setValue ]
	);

	const onChangeCalendarDateControl = useCallback(
		( newValue: string | undefined ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	if ( operator === OPERATOR_IN_THE_PAST || operator === OPERATOR_OVER ) {
		return (
			<RelativeDateControl
				className="dataviews-controls__date"
				id={ id }
				value={ value && typeof value === 'object' ? value : {} }
				onChange={ onChangeRelativeDateControl }
				label={ label }
				hideLabelFromVision={ hideLabelFromVision }
				options={ TIME_UNITS_OPTIONS[ operator ] }
			/>
		);
	}

	if ( operator === OPERATOR_BETWEEN ) {
		let dateRangeValue: DateRange;
		if (
			Array.isArray( value ) &&
			value.length === 2 &&
			value.every( ( date ) => typeof date === 'string' )
		) {
			// Ensure the value is expected format
			dateRangeValue = value as DateRange;
		}

		return (
			<CalendarDateRangeControl
				className="dataviews-controls__date"
				id={ id }
				value={ dateRangeValue }
				onChange={ onChangeCalendarDateRangeControl }
				label={ label }
				hideLabelFromVision={ hideLabelFromVision }
				data={ data }
				field={ field }
			/>
		);
	}

	return (
		<CalendarDateControl
			className="dataviews-controls__date"
			id={ id }
			value={ typeof value === 'string' ? value : undefined }
			onChange={ onChangeCalendarDateControl }
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			data={ data }
			field={ field }
		/>
	);
}
