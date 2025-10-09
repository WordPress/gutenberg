/**
 * WordPress dependencies
 */
import {
	BaseControl,
	Button,
	Icon,
	privateApis as componentsPrivateApis,
	__experimentalInputControl as InputControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getDate, getSettings } from '@wordpress/date';
import { error as errorIcon } from '@wordpress/icons';

/**
 * External dependencies
 */
import clsx from 'clsx';
import {
	format,
	isValid,
	subMonths,
	subDays,
	subYears,
	startOfMonth,
	startOfYear,
} from 'date-fns';
import deepMerge from 'deepmerge';

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

const { DateCalendar, DateRangeCalendar } = unlock( componentsPrivateApis );

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

function ValidatedDateControl< Item >( {
	value,
	field,
	data,
	setValue,
	inputRefs,
	isTouched,
	setIsTouched,
	children,
}: {
	value: any;
	field: any;
	data: Item;
	setValue: any;
	inputRefs:
		| React.RefObject< HTMLInputElement >
		| React.RefObject< HTMLInputElement >[];
	isTouched: boolean;
	setIsTouched: ( touched: boolean ) => void;
	children: React.ReactNode;
} ) {
	const [ customValidity, setCustomValidity ] = useState<
		{ type: 'invalid'; message: string } | undefined
	>( undefined );

	const onValidate = useCallback(
		( newValue: any ) => {
			// Check custom validation (only if value exists)
			if ( newValue ) {
				const customMessage = field.isValid?.custom?.(
					deepMerge(
						data,
						setValue( {
							item: data,
							value: newValue,
						} ) as Partial< Item >
					),
					field
				);

				if ( customMessage ) {
					setCustomValidity( {
						type: 'invalid',
						message: customMessage,
					} );
					return;
				}
			}

			// Check HTML5 validity on all refs
			const refs = Array.isArray( inputRefs ) ? inputRefs : [ inputRefs ];
			for ( const ref of refs ) {
				const input = ref.current;
				if ( input && ! input.validity.valid ) {
					setCustomValidity( {
						type: 'invalid',
						message: input.validationMessage,
					} );
					return;
				}
			}

			// No errors
			setCustomValidity( undefined );
		},
		[ data, field, setValue, inputRefs ]
	);

	useEffect( () => {
		if ( isTouched ) {
			const timeoutId = setTimeout( () => {
				onValidate( value );
			}, 0 );
			return () => clearTimeout( timeoutId );
		}
		return undefined;
	}, [ isTouched, value, onValidate ] );

	const onBlur = ( event: React.FocusEvent< HTMLDivElement > ) => {
		if ( isTouched ) {
			return;
		}

		// Only consider "blurred from the component" if focus has fully left the wrapping div.
		// This prevents unnecessary blurs from components with multiple focusable elements.
		if (
			! event.relatedTarget ||
			! event.currentTarget.contains( event.relatedTarget )
		) {
			setIsTouched( true );
		}
	};

	return (
		<div onBlur={ onBlur }>
			{ children }
			<div aria-live="polite">
				{ customValidity && (
					<p
						className={ clsx(
							'components-validated-control__indicator',
							'is-invalid'
						) }
					>
						<Icon
							className="components-validated-control__indicator-icon"
							icon={ errorIcon }
							size={ 16 }
							fill="currentColor"
						/>
						{ customValidity.message }
					</p>
				) }
			</div>
		</div>
	);
}

function CalendarDateControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { id, label, setValue, getValue } = field;
	const [ selectedPresetId, setSelectedPresetId ] = useState< string | null >(
		null
	);

	const fieldValue = getValue( { item: data } );
	const value = typeof fieldValue === 'string' ? fieldValue : undefined;
	const [ calendarMonth, setCalendarMonth ] = useState< Date >( () => {
		const parsedDate = parseDate( value );
		return parsedDate || new Date(); // Default to current month
	} );

	const [ isTouched, setIsTouched ] = useState( false );
	const validityTargetRef = useRef< HTMLInputElement >( null );

	const onChangeCallback = useCallback(
		( newValue: string | undefined ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	const onSelectDate = useCallback(
		( newDate: Date | undefined | null ) => {
			const dateValue = newDate
				? format( newDate, 'yyyy-MM-dd' )
				: undefined;
			onChangeCallback( dateValue );
			setSelectedPresetId( null );
			setIsTouched( true );
		},
		[ onChangeCallback ]
	);

	const handlePresetClick = useCallback(
		( preset: ( typeof DATE_PRESETS )[ 0 ] ) => {
			const presetDate = preset.getValue();
			const dateValue = formatDate( presetDate );

			setCalendarMonth( presetDate );
			onChangeCallback( dateValue );
			setSelectedPresetId( preset.id );
			setIsTouched( true );
		},
		[ onChangeCallback ]
	);

	const handleManualDateChange = useCallback(
		( newValue?: string ) => {
			onChangeCallback( newValue );
			if ( newValue ) {
				const parsedDate = parseDate( newValue );
				if ( parsedDate ) {
					setCalendarMonth( parsedDate );
				}
			}
			setSelectedPresetId( null );
			setIsTouched( true );
		},
		[ onChangeCallback ]
	);

	const {
		timezone: { string: timezoneString },
		l10n: { startOfWeek },
	} = getSettings();

	const displayLabel = field.isValid?.required
		? `${ label } (${ __( 'Required' ) })`
		: label;

	return (
		<ValidatedDateControl
			value={ value }
			field={ field }
			data={ data }
			setValue={ setValue }
			inputRefs={ validityTargetRef }
			isTouched={ isTouched }
			setIsTouched={ setIsTouched }
		>
			<BaseControl
				__nextHasNoMarginBottom
				id={ id }
				className="dataviews-controls__date"
				label={ displayLabel }
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
									onClick={ () =>
										handlePresetClick( preset )
									}
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
					<InputControl
						__next40pxDefaultSize
						ref={ validityTargetRef }
						type="date"
						label={ __( 'Date' ) }
						hideLabelFromVision
						value={ value }
						onChange={ handleManualDateChange }
						required={ !! field.isValid?.required }
					/>

					{ /* Calendar widget */ }
					<DateCalendar
						style={ { width: '100%' } }
						selected={
							value ? parseDate( value ) || undefined : undefined
						}
						onSelect={ onSelectDate }
						month={ calendarMonth }
						onMonthChange={ setCalendarMonth }
						timeZone={ timezoneString || undefined }
						weekStartsOn={ startOfWeek }
					/>
				</VStack>
			</BaseControl>
		</ValidatedDateControl>
	);
}

function CalendarDateRangeControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { id, label, getValue, setValue } = field;
	let value: DateRange;
	const fieldValue = getValue( { item: data } );
	if (
		Array.isArray( fieldValue ) &&
		fieldValue.length === 2 &&
		fieldValue.every( ( date ) => typeof date === 'string' )
	) {
		value = fieldValue as DateRange;
	}

	const onChangeCallback = useCallback(
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

	const [ selectedPresetId, setSelectedPresetId ] = useState< string | null >(
		null
	);

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

	const [ isTouched, setIsTouched ] = useState( false );
	const fromInputRef = useRef< HTMLInputElement >( null );
	const toInputRef = useRef< HTMLInputElement >( null );

	const updateDateRange = useCallback(
		( fromDate?: Date | string, toDate?: Date | string ) => {
			if ( fromDate && toDate ) {
				onChangeCallback( [
					formatDate( fromDate ),
					formatDate( toDate ),
				] );
			} else if ( ! fromDate && ! toDate ) {
				onChangeCallback( undefined );
			}
			// Do nothing if only one date is set - wait for both
		},
		[ onChangeCallback ]
	);

	const onSelectCalendarRange = useCallback(
		(
			newRange:
				| { from: Date | undefined; to?: Date | undefined }
				| undefined
		) => {
			updateDateRange( newRange?.from, newRange?.to );
			setSelectedPresetId( null );
			setIsTouched( true );
		},
		[ updateDateRange ]
	);

	const handlePresetClick = useCallback(
		( preset: ( typeof DATE_RANGE_PRESETS )[ 0 ] ) => {
			const [ startDate, endDate ] = preset.getValue();
			setCalendarMonth( startDate );
			updateDateRange( startDate, endDate );
			setSelectedPresetId( preset.id );
			setIsTouched( true );
		},
		[ updateDateRange ]
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
			setIsTouched( true );
		},
		[ value, updateDateRange ]
	);

	const { timezone, l10n } = getSettings();

	const displayLabel = field.isValid?.required
		? `${ label } (${ __( 'Required' ) })`
		: label;

	return (
		<ValidatedDateControl
			value={ value }
			field={ field }
			data={ data }
			setValue={ setValue }
			inputRefs={ [ fromInputRef, toInputRef ] }
			isTouched={ isTouched }
			setIsTouched={ setIsTouched }
		>
			<BaseControl
				__nextHasNoMarginBottom
				id={ id }
				className="dataviews-controls__date"
				label={ displayLabel }
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
									onClick={ () =>
										handlePresetClick( preset )
									}
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
						<InputControl
							__next40pxDefaultSize
							ref={ fromInputRef }
							type="date"
							label={ __( 'From' ) }
							hideLabelFromVision
							value={ value?.[ 0 ] }
							onChange={ ( newValue ) =>
								handleManualDateChange( 'from', newValue )
							}
							required={ !! field.isValid?.required }
						/>
						<InputControl
							__next40pxDefaultSize
							ref={ toInputRef }
							type="date"
							label={ __( 'To' ) }
							hideLabelFromVision
							value={ value?.[ 1 ] }
							onChange={ ( newValue ) =>
								handleManualDateChange( 'to', newValue )
							}
							required={ !! field.isValid?.required }
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
		</ValidatedDateControl>
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
		return (
			<CalendarDateRangeControl
				data={ data }
				field={ field }
				onChange={ onChange }
				hideLabelFromVision={ hideLabelFromVision }
			/>
		);
	}

	return (
		<CalendarDateControl
			data={ data }
			field={ field }
			onChange={ onChange }
			hideLabelFromVision={ hideLabelFromVision }
		/>
	);
}
