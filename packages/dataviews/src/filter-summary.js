/**
 * External dependencies
 */
import classnames from 'classnames';

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
import { ENTER, SPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import SearchWidget from './search-widget';
import { ALL_OPERATORS, OPERATORS } from './constants';

const FilterText = ( { activeElements, filterInView, filter } ) => {
	if ( activeElements === undefined || activeElements.length === 0 ) {
		return filter.name;
	}

	const filterTextWrappers = {
		Span1: <span className="dataviews-filter-summary__filter-text-name" />,
		Span2: <span className="dataviews-filter-summary__filter-text-value" />,
	};

	if ( ALL_OPERATORS.includes( filterInView?.operator ) ) {
		return createInterpolateElement(
			sprintf(
				/* translators: 1: Filter name. 2: Filter operator. 3: Filter value. e.g.: "Author is Admin", "Author not in Admin, Editor". */
				__( '<Span1>%1$s </Span1><Span2>%2$s %3$s</Span2>' ),
				filter.name,
				OPERATORS[ filterInView.operator ].label,
				activeElements.map( ( element ) => element.label ).join( ', ' )
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

function OperatorSelector( { filter, view, onChangeView } ) {
	const operatorOptions = filter.operators?.map( ( operator ) => ( {
		value: operator,
		label: OPERATORS[ operator ]?.label,
	} ) );
	const currentFilter = view.filters.find(
		( _filter ) => _filter.field === filter.field
	);
	const value = currentFilter?.operator || filter.operators[ 0 ];
	return (
		operatorOptions.length > 1 && (
			<HStack
				spacing={ 2 }
				justify="flex-start"
				className="dataviews-filter-summary__operators-container"
			>
				<FlexItem className="dataviews-filter-summary__operators-filter-name">
					{ filter.name }
				</FlexItem>

				<SelectControl
					label={ __( 'Conditions' ) }
					value={ value }
					options={ operatorOptions }
					onChange={ ( newValue ) => {
						const newFilters = currentFilter
							? [
									...view.filters.map( ( _filter ) => {
										if ( _filter.field === filter.field ) {
											return {
												..._filter,
												operator: newValue,
											};
										}
										return _filter;
									} ),
							  ]
							: [
									...view.filters,
									{
										field: filter.field,
										operator: newValue,
									},
							  ];
						onChangeView( {
							...view,
							page: 1,
							filters: newFilters,
						} );
					} }
					size="small"
					__nextHasNoMarginBottom
					hideLabelFromVision
				/>
			</HStack>
		)
	);
}

export default function FilterSummary( {
	addFilterRef,
	openedFilter,
	...commonProps
} ) {
	const toggleRef = useRef();
	const { filter, view, onChangeView } = commonProps;
	const filterInView = view.filters.find( ( f ) => f.field === filter.field );
	const activeElements = filter.elements.filter( ( element ) => {
		if ( filter.singleSelection ) {
			return element.value === filterInView?.value;
		}
		return filterInView?.value?.includes( element.value );
	} );
	const isPrimary = filter.isPrimary;
	const hasValues = filterInView?.value !== undefined;
	const canResetOrRemove = ! isPrimary || hasValues;
	return (
		<Dropdown
			defaultOpen={ openedFilter === filter.field }
			contentClassName="dataviews-filter-summary__popover"
			popoverProps={ { placement: 'bottom-start', role: 'dialog' } }
			onClose={ () => {
				toggleRef.current?.focus();
			} }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<div className="dataviews-filter-summary__chip-container">
					<Tooltip
						text={ sprintf(
							/* translators: 1: Filter name. */
							__( 'Filter by: %1$s' ),
							filter.name.toLowerCase()
						) }
						placement="top"
					>
						<div
							className={ classnames(
								'dataviews-filter-summary__chip',
								{
									'has-reset': canResetOrRemove,
									'has-values': hasValues,
								}
							) }
							role="button"
							tabIndex={ 0 }
							onClick={ onToggle }
							onKeyDown={ ( event ) => {
								if (
									[ ENTER, SPACE ].includes( event.keyCode )
								) {
									onToggle();
									event.preventDefault();
								}
							} }
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
								className={ classnames(
									'dataviews-filter-summary__chip-remove',
									{ 'has-values': hasValues }
								) }
								onClick={ () => {
									onChangeView( {
										...view,
										page: 1,
										filters: view.filters.filter(
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
						<SearchWidget { ...commonProps } />
					</VStack>
				);
			} }
		/>
	);
}
