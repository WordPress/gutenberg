/**
 * External dependencies
 */
import clsx from 'clsx';
import type { RefObject } from 'react';

/**
 * WordPress dependencies
 */
import {
	Dropdown,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexItem,
	SelectControl,
	Tooltip,
	Icon,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useRef, createInterpolateElement } from '@wordpress/element';
import { closeSmall } from '@wordpress/icons';
import { dateI18n, getDate } from '@wordpress/date';

/**
 * Internal dependencies
 */
import SearchWidget from './search-widget';
import InputWidget from './input-widget';
import {
	OPERATORS,
	OPERATOR_IS,
	OPERATOR_IS_NOT,
	OPERATOR_IS_ANY,
	OPERATOR_IS_NONE,
	OPERATOR_IS_ALL,
	OPERATOR_IS_NOT_ALL,
	OPERATOR_LESS_THAN,
	OPERATOR_GREATER_THAN,
	OPERATOR_LESS_THAN_OR_EQUAL,
	OPERATOR_GREATER_THAN_OR_EQUAL,
	OPERATOR_CONTAINS,
	OPERATOR_NOT_CONTAINS,
	OPERATOR_STARTS_WITH,
	OPERATOR_BEFORE,
	OPERATOR_AFTER,
	OPERATOR_BEFORE_INC,
	OPERATOR_AFTER_INC,
	OPERATOR_BETWEEN,
	OPERATOR_ON,
	OPERATOR_NOT_ON,
	OPERATOR_IN_THE_PAST,
	OPERATOR_OVER,
} from '../../constants';
import type {
	Filter,
	NormalizedField,
	NormalizedFieldDate,
	NormalizedFieldNumber,
	NormalizedFieldInteger,
	NormalizedFilter,
	Operator,
	Option,
	View,
} from '../../types';
import useElements from '../../hooks/use-elements';
import parseDateTime from '../../field-types/utils/parse-date-time';
import { formatNumber } from '../../field-types/number';
import { formatInteger } from '../../field-types/integer';

const ENTER = 'Enter';
const SPACE = ' ';

interface FilterTextProps {
	activeElements: Option[];
	filterInView?: Filter;
	filter: NormalizedFilter;
}

interface OperatorSelectorProps {
	filter: NormalizedFilter;
	view: View;
	onChangeView: ( view: View ) => void;
}

interface FilterProps extends OperatorSelectorProps {
	addFilterRef: RefObject< HTMLButtonElement >;
	openedFilter: string | null;
	fields: NormalizedField< any >[];
}

const FilterText = ( {
	activeElements,
	filterInView,
	filter,
}: FilterTextProps ) => {
	if ( activeElements === undefined || activeElements.length === 0 ) {
		return filter.name;
	}

	const filterTextWrappers = {
		Name: <span className="dataviews-filters__summary-filter-text-name" />,
		Value: (
			<span className="dataviews-filters__summary-filter-text-value" />
		),
	};

	if (
		filterInView?.operator !== undefined &&
		[
			OPERATOR_IS_ANY,
			OPERATOR_IS_NONE,
			OPERATOR_IS_ALL,
			OPERATOR_IS_NOT_ALL,
		].includes( filterInView.operator )
	) {
		return createInterpolateElement(
			sprintf(
				/* translators: 1: Filter name. 2: Operator name. 3: Filter value. e.g.: "Author is any: Admin, Editor". */
				__( '<Name>%1$s %2$s: </Name><Value>%3$s</Value>' ),
				filter.name,
				OPERATORS[ filterInView.operator ].label.toLowerCase(),
				activeElements.map( ( element ) => element.label ).join( ', ' )
			),
			filterTextWrappers
		);
	}

	if (
		filterInView?.operator !== undefined &&
		[
			OPERATOR_IS,
			OPERATOR_IS_NOT,
			OPERATOR_LESS_THAN,
			OPERATOR_GREATER_THAN,
			OPERATOR_LESS_THAN_OR_EQUAL,
			OPERATOR_GREATER_THAN_OR_EQUAL,
			OPERATOR_CONTAINS,
			OPERATOR_NOT_CONTAINS,
			OPERATOR_STARTS_WITH,
			OPERATOR_BEFORE,
			OPERATOR_AFTER,
			OPERATOR_BEFORE_INC,
			OPERATOR_AFTER_INC,
			OPERATOR_BETWEEN,
			OPERATOR_ON,
			OPERATOR_NOT_ON,
			OPERATOR_IN_THE_PAST,
		].includes( filterInView.operator )
	) {
		return createInterpolateElement(
			sprintf(
				/* translators: 1: Filter name. 2: Operator name. 3: Filter value. e.g.: "Author starts with: Adm". */
				__( '<Name>%1$s %2$s: </Name><Value>%3$s</Value>' ),
				filter.name,
				OPERATORS[ filterInView.operator ].label.toLowerCase(),
				activeElements[ 0 ].label
			),
			filterTextWrappers
		);
	}

	return sprintf(
		/* translators: 1: Filter name e.g.: "Unknown status for Author". */
		__( 'Unknown status for %1$s' ),
		filter.name
	);
};

function OperatorSelector( {
	filter,
	view,
	onChangeView,
}: OperatorSelectorProps ) {
	const operatorOptions = filter.operators?.map( ( operator ) => ( {
		value: operator,
		label: OPERATORS[ operator ]?.label,
	} ) );
	const currentFilter = view.filters?.find(
		( _filter ) => _filter.field === filter.field
	);
	const value = currentFilter?.operator || filter.operators[ 0 ];
	return (
		operatorOptions.length > 1 && (
			<HStack
				spacing={ 2 }
				justify="flex-start"
				className="dataviews-filters__summary-operators-container"
			>
				<FlexItem className="dataviews-filters__summary-operators-filter-name">
					{ filter.name }
				</FlexItem>

				<SelectControl
					className="dataviews-filters__summary-operators-filter-select"
					label={ __( 'Conditions' ) }
					value={ value }
					options={ operatorOptions }
					onChange={ ( newValue ) => {
						const operator = newValue as Operator;
						const currentOperator = currentFilter?.operator;
						const newFilters = currentFilter
							? [
									...( view.filters ?? [] ).map(
										( _filter ) => {
											if (
												_filter.field === filter.field
											) {
												// Reset the value only when switching between operators that have different value types.
												const OPERATORS_SHOULD_RESET_VALUE =
													[
														OPERATOR_BETWEEN,
														OPERATOR_IN_THE_PAST,
														OPERATOR_OVER,
													];
												const shouldResetValue =
													currentOperator &&
													( OPERATORS_SHOULD_RESET_VALUE.includes(
														currentOperator
													) ||
														OPERATORS_SHOULD_RESET_VALUE.includes(
															operator
														) );

												return {
													..._filter,
													value: shouldResetValue
														? undefined
														: _filter.value,
													operator,
												};
											}
											return _filter;
										}
									),
							  ]
							: [
									...( view.filters ?? [] ),
									{
										field: filter.field,
										operator,
										value: undefined,
									},
							  ];
						onChangeView( {
							...view,
							page: 1,
							filters: newFilters,
						} );
					} }
					size="small"
					variant="minimal"
					__nextHasNoMarginBottom
					hideLabelFromVision
				/>
			</HStack>
		)
	);
}

export default function Filter( {
	addFilterRef,
	openedFilter,
	fields,
	...commonProps
}: FilterProps ) {
	const toggleRef = useRef< HTMLDivElement >( null );
	const { filter, view, onChangeView } = commonProps;
	const filterInView = view.filters?.find(
		( f ) => f.field === filter.field
	);

	let activeElements: Option[] = [];

	const { elements } = useElements( {
		elements: filter.elements,
		getElements: filter.getElements,
	} );

	if ( elements.length > 0 ) {
		activeElements = elements.filter( ( element ) => {
			if ( filter.singleSelection ) {
				return element.value === filterInView?.value;
			}
			return filterInView?.value?.includes( element.value );
		} );
	} else if ( filterInView?.value !== undefined ) {
		const field = fields.find( ( f ) => f.id === filter.field );
		let label = filterInView.value;

		if ( field?.type === 'date' && typeof label === 'string' ) {
			try {
				const dateValue = parseDateTime( label );
				if ( dateValue !== null ) {
					label = dateI18n(
						( field as NormalizedFieldDate< any > ).format.date,
						getDate( label )
					);
				}
			} catch ( e ) {
				label = filterInView.value;
			}
		} else if ( field?.type === 'datetime' && typeof label === 'string' ) {
			try {
				const dateValue = parseDateTime( label );
				if ( dateValue !== null ) {
					label = dateValue.toLocaleString();
				}
			} catch ( e ) {
				label = filterInView.value;
			}
		} else if ( field?.type === 'number' && typeof label === 'number' ) {
			const numberField = field as NormalizedFieldNumber< any >;
			label = formatNumber( label, numberField.format );
		} else if ( field?.type === 'integer' && typeof label === 'number' ) {
			const integerField = field as NormalizedFieldInteger< any >;
			label = formatInteger( label, integerField.format );
		}

		activeElements = [
			{
				value: filterInView.value,
				label,
			},
		];
	}

	const isPrimary = filter.isPrimary;
	const isLocked = filterInView?.isLocked;
	const hasValues = ! isLocked && filterInView?.value !== undefined;
	const canResetOrRemove = ! isLocked && ( ! isPrimary || hasValues );
	return (
		<Dropdown
			defaultOpen={ openedFilter === filter.field }
			contentClassName="dataviews-filters__summary-popover"
			popoverProps={ { placement: 'bottom-start', role: 'dialog' } }
			onClose={ () => {
				toggleRef.current?.focus();
			} }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<div className="dataviews-filters__summary-chip-container">
					<Tooltip
						text={ sprintf(
							/* translators: 1: Filter name. */
							__( 'Filter by: %1$s' ),
							filter.name.toLowerCase()
						) }
						placement="top"
					>
						<div
							className={ clsx(
								'dataviews-filters__summary-chip',
								{
									'has-reset': canResetOrRemove,
									'has-values': hasValues,
									'is-not-clickable': isLocked,
								}
							) }
							role="button"
							tabIndex={ isLocked ? -1 : 0 }
							onClick={ () => {
								if ( ! isLocked ) {
									onToggle();
								}
							} }
							onKeyDown={ ( event ) => {
								if (
									! isLocked &&
									[ ENTER, SPACE ].includes( event.key )
								) {
									onToggle();
									event.preventDefault();
								}
							} }
							aria-disabled={ isLocked }
							aria-pressed={ isOpen }
							aria-expanded={ isOpen }
							ref={ toggleRef }
						>
							<FilterText
								activeElements={ activeElements }
								filterInView={ filterInView }
								filter={ filter }
							/>
						</div>
					</Tooltip>
					{ canResetOrRemove && (
						<Tooltip
							text={ isPrimary ? __( 'Reset' ) : __( 'Remove' ) }
							placement="top"
						>
							<button
								className={ clsx(
									'dataviews-filters__summary-chip-remove',
									{ 'has-values': hasValues }
								) }
								onClick={ () => {
									onChangeView( {
										...view,
										page: 1,
										filters: view.filters?.filter(
											( _filter ) =>
												_filter.field !== filter.field
										),
									} );
									// If the filter is not primary and can be removed, it will be added
									// back to the available filters from `Add filter` component.
									if ( ! isPrimary ) {
										addFilterRef.current?.focus();
									} else {
										// If is primary, focus the toggle button.
										toggleRef.current?.focus();
									}
								} }
							>
								<Icon icon={ closeSmall } />
							</button>
						</Tooltip>
					) }
				</div>
			) }
			renderContent={ () => {
				return (
					<VStack spacing={ 0 } justify="flex-start">
						<OperatorSelector { ...commonProps } />
						{ commonProps.filter.hasElements ? (
							<SearchWidget
								{ ...commonProps }
								filter={ {
									...commonProps.filter,
									elements,
								} }
							/>
						) : (
							<InputWidget { ...commonProps } fields={ fields } />
						) }
					</VStack>
				);
			} }
		/>
	);
}
