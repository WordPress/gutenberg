import {
	areIntervalsOverlapping,
	endOfMonth,
	format,
	isSameMonth,
	isValid as isValidDate,
	parseISO,
	startOfMonth,
	startOfYear,
	subDays,
	subMonths,
	subYears,
} from 'date-fns';
import {
	BaseControl,
	Button,
	__experimentalInputControl as WCInputControl,
} from '@wordpress/components';
import { speak } from '@wordpress/a11y';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { getDate, getSettings } from '@wordpress/date';
import {
	Calendar,
	RangeCalendar,
	Stack,
	ValidityIndicator,
} from '@wordpress/ui';
import RelativeDateControl from './utils/relative-date-control';
import useDisabledDateMatchers from './utils/use-disabled-date-matchers';
import getCalendarLocale from './utils/get-calendar-locale';
import {
	OPERATOR_IN_THE_PAST,
	OPERATOR_OVER,
	OPERATOR_BETWEEN,
} from '../../constants';
import type {
	DataFormControlProps,
	FieldValidity,
	FormatDate,
	NormalizedField,
} from '../../types';
import getCustomValidity from './utils/get-custom-validity';

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

// A `date` value is a plain calendar day with no timezone attached, and the
// calendar reads and reports the `Date`s it is given in the browser timezone.
// Anchoring the day there keeps the visible day aligned with the field value.
// A native Date cannot represent a civil day skipped by the browser timezone
// (for example, 2011-12-30 in Pacific/Apia). That rare historical edge remains
// outside this browser-frame approach; using a neutral frame would also make
// Calendar's built-in today marker follow that frame instead of the browser.
const parseDate = ( dateString?: string ): Date | null => {
	if ( ! dateString ) {
		return null;
	}
	const parsed = parseISO( dateString );
	return isValidDate( parsed ) ? parsed : null;
};

const formatDate = ( date?: Date | string ): string => {
	if ( ! date ) {
		return '';
	}
	return typeof date === 'string' ? date : format( date, 'yyyy-MM-dd' );
};

function ValidatedDateControl< Item >( {
	field,
	validity,
	inputRefs,
	isTouched,
	setIsTouched,
	children,
}: {
	field: NormalizedField< Item >;
	validity?: FieldValidity;
	inputRefs:
		| React.RefObject< HTMLInputElement | null >
		| React.RefObject< HTMLInputElement | null >[];
	isTouched: boolean;
	setIsTouched: ( touched: boolean ) => void;
	children: React.ReactNode;
} ) {
	const { isValid } = field;
	const [ customValidity, setCustomValidity ] = useState<
		| { type: 'valid' | 'validating' | 'invalid'; message?: string }
		| undefined
	>( undefined );

	const validateRefs = useCallback( () => {
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
	}, [ inputRefs ] );

	// Sync React-level validation to native inputs.
	useEffect( () => {
		const refs = Array.isArray( inputRefs ) ? inputRefs : [ inputRefs ];
		const result = validity
			? getCustomValidity( isValid, validity )
			: undefined;
		for ( const ref of refs ) {
			const input = ref.current;
			if ( input ) {
				input.setCustomValidity(
					result?.type === 'invalid' && result.message
						? result.message
						: ''
				);
			}
		}
	}, [ inputRefs, isValid, validity ] );

	// Listen for 'invalid' events (e.g., dispatched by layouts when a card
	// re-expands or loses focus).
	useEffect( () => {
		const refs = Array.isArray( inputRefs ) ? inputRefs : [ inputRefs ];
		const handleInvalid = ( event: Event ) => {
			event.preventDefault();
			setIsTouched( true );
		};
		for ( const ref of refs ) {
			ref.current?.addEventListener( 'invalid', handleInvalid );
		}
		return () => {
			for ( const ref of refs ) {
				ref.current?.removeEventListener( 'invalid', handleInvalid );
			}
		};
	}, [ inputRefs, setIsTouched ] );

	useEffect( () => {
		if ( ! isTouched ) {
			return;
		}
		const result = validity
			? getCustomValidity( isValid, validity )
			: undefined;
		if ( result ) {
			setCustomValidity( result );
		} else {
			validateRefs();
		}
	}, [ isTouched, isValid, validity, validateRefs ] );

	useEffect( () => {
		if ( isTouched && customValidity?.message ) {
			speak( customValidity.message );
		}
	}, [ isTouched, customValidity?.message ] );

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
		<Stack direction="column" gap="sm" onBlur={ onBlur }>
			{ children }
			{ customValidity && (
				<ValidityIndicator
					type={ customValidity.type }
					message={ customValidity.message }
				/>
			) }
		</Stack>
	);
}

function CalendarDateControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	validity,
}: DataFormControlProps< Item > ) {
	const {
		id,
		label,
		description,
		setValue,
		getValue,
		isValid,
		format: fieldFormat,
	} = field;
	const disabled = field.isDisabled( { item: data, field } );
	const [ selectedPresetId, setSelectedPresetId ] = useState< string | null >(
		null
	);

	const weekStartsOn =
		( fieldFormat as FormatDate ).weekStartsOn ??
		getSettings().l10n.startOfWeek;
	const locale = getCalendarLocale( getSettings().l10n.locale );

	const fieldValue = getValue( { item: data } );
	const value = typeof fieldValue === 'string' ? fieldValue : undefined;
	const [ calendarMonth, setCalendarMonth ] = useState< Date >( () => {
		const parsedDate = parseDate( value );
		return parsedDate || new Date(); // Default to current month
	} );
	// Follow external value changes, such as undo, reset, or switching the
	// edited item. Both dates are already in the browser calendar frame.
	useEffect( () => {
		const parsedDate = parseDate( value );
		if ( parsedDate ) {
			setCalendarMonth( ( currentMonth ) =>
				isSameMonth( parsedDate, currentMonth )
					? currentMonth
					: parsedDate
			);
		}
	}, [ value ] );

	const [ isTouched, setIsTouched ] = useState( false );
	const validityTargetRef = useRef< HTMLInputElement >( null );

	const { minConstraint, maxConstraint, disabledMatchers } =
		useDisabledDateMatchers( isValid, parseDate );

	const onChangeCallback = useCallback(
		( newValue: string | undefined ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	const onSelectDate = useCallback(
		( newDate: Date | null ) => {
			const dateValue = newDate ? formatDate( newDate ) : undefined;
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

	let displayLabel = label;
	if ( isValid?.required && ! markWhenOptional ) {
		displayLabel = `${ label } (${ __( 'Required' ) })`;
	} else if ( ! isValid?.required && markWhenOptional ) {
		displayLabel = `${ label } (${ __( 'Optional' ) })`;
	}

	return (
		<ValidatedDateControl
			field={ field }
			validity={ validity }
			inputRefs={ validityTargetRef }
			isTouched={ isTouched }
			setIsTouched={ setIsTouched }
		>
			<BaseControl
				id={ id }
				className="dataviews-controls__date"
				label={ displayLabel }
				help={ description }
				hideLabelFromVision={ hideLabelFromVision }
			>
				<Stack direction="column" gap="lg">
					{ /* Preset buttons */ }
					<Stack
						direction="row"
						gap="sm"
						wrap="wrap"
						justify="flex-start"
					>
						{ DATE_PRESETS.map( ( preset ) => {
							const isSelected = selectedPresetId === preset.id;
							return (
								<Button
									className="dataviews-controls__date-preset"
									key={ preset.id }
									variant="tertiary"
									isPressed={ isSelected }
									size="small"
									disabled={ disabled }
									accessibleWhenDisabled
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
							disabled={ !! selectedPresetId || disabled }
							accessibleWhenDisabled
						>
							{ __( 'Custom' ) }
						</Button>
					</Stack>

					{ /* Manual date input */ }
					<WCInputControl
						ref={ validityTargetRef }
						type="date"
						label={ __( 'Date' ) }
						hideLabelFromVision
						value={ value }
						onChange={ handleManualDateChange }
						required={ !! field.isValid?.required }
						disabled={ disabled }
						min={ minConstraint }
						max={ maxConstraint }
					/>

					{ /* Calendar widget */ }
					<Calendar
						style={ { width: '100%' } }
						value={ value ? parseDate( value ) : null }
						onValueChange={ onSelectDate }
						month={ calendarMonth }
						onMonthChange={ setCalendarMonth }
						locale={ locale }
						dir={ isRTL() ? 'rtl' : 'ltr' }
						weekStartsOn={ weekStartsOn }
						disabled={ disabled || disabledMatchers }
						disableNavigation={ disabled }
					/>
				</Stack>
			</BaseControl>
		</ValidatedDateControl>
	);
}

function CalendarDateRangeControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	validity,
}: DataFormControlProps< Item > ) {
	const {
		id,
		label,
		description,
		getValue,
		setValue,
		isValid,
		format: fieldFormat,
	} = field;
	const disabled = field.isDisabled( { item: data, field } );
	let value: DateRange;
	const fieldValue = getValue( { item: data } );
	if (
		Array.isArray( fieldValue ) &&
		fieldValue.length === 2 &&
		fieldValue.every( ( date ) => typeof date === 'string' )
	) {
		value = fieldValue as DateRange;
	}

	const weekStartsOn =
		( fieldFormat as FormatDate ).weekStartsOn ??
		getSettings().l10n.startOfWeek;
	const locale = getCalendarLocale( getSettings().l10n.locale );

	const { minConstraint, maxConstraint, disabledMatchers } =
		useDisabledDateMatchers( isValid, parseDate );

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
			return null;
		}

		const [ from, to ] = value;
		return {
			from: parseDate( from ) || undefined,
			to: parseDate( to ) || undefined,
		};
	}, [ value ] );

	const [ calendarMonth, setCalendarMonth ] = useState< Date >( () => {
		return selectedRange?.from || new Date();
	} );
	// Follow external range changes while keeping the current view when it
	// already contains an endpoint or falls between the range endpoints.
	const [ fromValue, toValue ] = value ?? [];
	useEffect( () => {
		setCalendarMonth( ( currentMonth ) => {
			const from = parseDate( fromValue );
			const to = parseDate( toValue );
			const targetMonth = from ?? to;
			const isRangeVisible =
				from && to
					? areIntervalsOverlapping(
							{ start: from, end: to },
							{
								start: startOfMonth( currentMonth ),
								end: endOfMonth( currentMonth ),
							},
							{ inclusive: true }
					  )
					: [ from, to ].some(
							( date ) =>
								date && isSameMonth( date, currentMonth )
					  );
			return targetMonth && ! isRangeVisible ? targetMonth : currentMonth;
		} );
	}, [ fromValue, toValue ] );

	const [ isTouched, setIsTouched ] = useState( false );
	const fromInputRef = useRef< HTMLInputElement >( null );
	const toInputRef = useRef< HTMLInputElement >( null );

	const updateDateRange = useCallback(
		( fromDate?: Date | string, toDate?: Date | string ) => {
			if ( ! fromDate && ! toDate ) {
				onChangeCallback( undefined );
				return;
			}
			// An incomplete range is committed with an empty-string bound
			// rather than held back until both dates are set: the inputs are
			// controlled, so an uncommitted date would be wiped on blur. The
			// `between` operator does not filter while a bound is unfilled.
			onChangeCallback( [
				formatDate( fromDate ),
				formatDate( toDate ),
			] );
		},
		[ onChangeCallback ]
	);

	const onSelectCalendarRange = useCallback(
		(
			newRange: { from: Date | undefined; to?: Date | undefined } | null
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

	let displayLabel = label;
	if ( field.isValid?.required && ! markWhenOptional ) {
		displayLabel = `${ label } (${ __( 'Required' ) })`;
	} else if ( ! field.isValid?.required && markWhenOptional ) {
		displayLabel = `${ label } (${ __( 'Optional' ) })`;
	}

	return (
		<ValidatedDateControl
			field={ field }
			validity={ validity }
			inputRefs={ [ fromInputRef, toInputRef ] }
			isTouched={ isTouched }
			setIsTouched={ setIsTouched }
		>
			<BaseControl
				id={ id }
				className="dataviews-controls__date"
				label={ displayLabel }
				help={ description }
				hideLabelFromVision={ hideLabelFromVision }
			>
				<Stack direction="column" gap="lg">
					{ /* Preset buttons */ }
					<Stack
						direction="row"
						gap="sm"
						wrap="wrap"
						justify="flex-start"
					>
						{ DATE_RANGE_PRESETS.map( ( preset ) => {
							const isSelected = selectedPresetId === preset.id;
							return (
								<Button
									className="dataviews-controls__date-preset"
									key={ preset.id }
									variant="tertiary"
									isPressed={ isSelected }
									size="small"
									disabled={ disabled }
									accessibleWhenDisabled
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
							accessibleWhenDisabled
							disabled={ !! selectedPresetId || disabled }
						>
							{ __( 'Custom' ) }
						</Button>
					</Stack>

					{ /* Manual date range inputs */ }
					<Stack
						direction="row"
						gap="sm"
						justify="space-between"
						className="dataviews-controls__date-range-inputs"
					>
						<WCInputControl
							ref={ fromInputRef }
							type="date"
							label={ __( 'From' ) }
							hideLabelFromVision
							value={ value?.[ 0 ] }
							onChange={ ( newValue ) =>
								handleManualDateChange( 'from', newValue )
							}
							required={ !! field.isValid?.required }
							disabled={ disabled }
							min={ minConstraint }
							max={ maxConstraint }
						/>
						<WCInputControl
							ref={ toInputRef }
							type="date"
							label={ __( 'To' ) }
							hideLabelFromVision
							value={ value?.[ 1 ] }
							onChange={ ( newValue ) =>
								handleManualDateChange( 'to', newValue )
							}
							required={ !! field.isValid?.required }
							disabled={ disabled }
							min={ minConstraint }
							max={ maxConstraint }
						/>
					</Stack>

					<RangeCalendar
						style={ { width: '100%' } }
						value={ selectedRange }
						onValueChange={ onSelectCalendarRange }
						month={ calendarMonth }
						onMonthChange={ setCalendarMonth }
						locale={ locale }
						dir={ isRTL() ? 'rtl' : 'ltr' }
						weekStartsOn={ weekStartsOn }
						disabled={ disabled || disabledMatchers }
					/>
				</Stack>
			</BaseControl>
		</ValidatedDateControl>
	);
}

export default function DateControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	operator,
	validity,
}: DataFormControlProps< Item > ) {
	if ( operator === OPERATOR_IN_THE_PAST || operator === OPERATOR_OVER ) {
		return (
			<RelativeDateControl
				className="dataviews-controls__date"
				data={ data }
				field={ field }
				onChange={ onChange }
				hideLabelFromVision={ hideLabelFromVision }
				operator={ operator }
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
				markWhenOptional={ markWhenOptional }
				validity={ validity }
			/>
		);
	}

	return (
		<CalendarDateControl
			data={ data }
			field={ field }
			onChange={ onChange }
			hideLabelFromVision={ hideLabelFromVision }
			markWhenOptional={ markWhenOptional }
			validity={ validity }
		/>
	);
}
