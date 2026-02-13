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
	FlexItem,
	SelectControl,
	Tooltip,
	Icon,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useRef } from '@wordpress/element';
import { closeSmall } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import SearchWidget from './search-widget';
import InputWidget from './input-widget';
import { getOperatorByName } from '../../utils/operators';
import type {
	Filter,
	NormalizedField,
	NormalizedFilter,
	Operator,
	Option,
	View,
} from '../../types';
import useElements from '../../hooks/use-elements';

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
			<Stack
				direction="row"
				gap="sm"
				justify="flex-start"
				className="dataviews-filters__summary-operators-container"
				align="center"
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
					hideLabelFromVision
				/>
			</Stack>
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
	const field = useMemo( () => {
		const currentField = fields.find( ( f ) => f.id === filter.field );
		if ( currentField ) {
			return {
				...currentField,
				// Configure getValue as if Item was a plain object.
				// See related input-widget.tsx
				getValue: ( { item }: { item: any } ) =>
					item[ currentField.id ],
			};
		}

		return currentField;
	}, [ fields, filter.field ] );

	const { elements } = useElements( {
		elements: filter.elements,
		getElements: filter.getElements,
	} );

	if ( elements.length > 0 ) {
		// When there are elements, we favor those
		activeElements = elements.filter( ( element ) => {
			if ( filter.singleSelection ) {
				return element.value === filterInView?.value;
			}
			return filterInView?.value?.includes( element.value );
		} );
	} else if ( Array.isArray( filterInView?.value ) ) {
		// or, filterInView.value can also be array
		// for the between operator, as in [ 1, 2 ]
		const label = filterInView.value.map( ( v ) => {
			const formattedValue = field?.getValueFormatted( {
				item: { [ field.id ]: v },
				field,
			} );
			return formattedValue || String( v );
		} );

		activeElements = [
			{
				value: filterInView.value,
				// @ts-ignore
				label,
			},
		];
	} else if ( typeof filterInView?.value === 'object' ) {
		// or, it can also be object for the inThePast/over operators,
		// as in { value: '1', units: 'days' }
		activeElements = [
			{ value: filterInView.value, label: filterInView.value },
		];
	} else if ( filterInView?.value !== undefined ) {
		// otherwise, filterInView.value is a single value
		const label =
			field !== undefined
				? field.getValueFormatted( {
						item: { [ field.id ]: filterInView.value },
						field,
				  } )
				: String( filterInView.value );

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
					<Stack direction="column" justify="flex-start">
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
					</Stack>
				);
			} }
		/>
	);
}
