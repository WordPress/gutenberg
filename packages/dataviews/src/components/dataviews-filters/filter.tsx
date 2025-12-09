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
import { useRef } from '@wordpress/element';
import { closeSmall } from '@wordpress/icons';
import { dateI18n, getDate } from '@wordpress/date';

/**
 * Internal dependencies
 */
import SearchWidget from './search-widget';
import InputWidget from './input-widget';
import { getOperatorByName } from '../../utils/operators';
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

	const operator = getOperatorByName( filterInView?.operator );
	if ( operator !== undefined ) {
		return operator.filterText( filter, activeElements );
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
		label: getOperatorByName( operator )?.label || operator,
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
						const newOperator = newValue as Operator;
						const currentOperator = currentFilter?.operator;
						const newFilters = currentFilter
							? [
									...( view.filters ?? [] ).map(
										( _filter ) => {
											if (
												_filter.field === filter.field
											) {
												const currentOpSelectionModel =
													getOperatorByName(
														currentOperator
													)?.selection;
												const newOpSelectionModel =
													getOperatorByName(
														newOperator
													)?.selection;

												const shouldResetValue =
													currentOpSelectionModel !==
														newOpSelectionModel ||
													[
														currentOpSelectionModel,
														newOpSelectionModel,
													].includes( 'custom' );

												return {
													..._filter,
													value: shouldResetValue
														? undefined
														: _filter.value,
													operator: newOperator,
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
										operator: newOperator,
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
