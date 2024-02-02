/**
 * WordPress dependencies
 */
import {
	Dropdown,
	Button,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexItem,
	SelectControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import WithSeparators from './with-separators';
import SearchWidget from './search-widget';
import { OPERATOR_IN, OPERATOR_NOT_IN, OPERATORS } from './constants';

const FilterText = ( { activeElement, filterInView, filter } ) => {
	if ( activeElement === undefined ) {
		return filter.name;
	}

	if (
		activeElement !== undefined &&
		filterInView?.operator === OPERATOR_IN
	) {
		return sprintf(
			/* translators: 1: Filter name. 2: Filter value. e.g.: "Author is Admin". */
			__( '%1$s is %2$s' ),
			filter.name,
			activeElement.label
		);
	}

	if (
		activeElement !== undefined &&
		filterInView?.operator === OPERATOR_NOT_IN
	) {
		return sprintf(
			/* translators: 1: Filter name. 2: Filter value. e.g.: "Author is not Admin". */
			__( '%1$s is not %2$s' ),
			filter.name,
			activeElement.label
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
		<HStack spacing={ 3 } justify="flex-start">
			<FlexItem>{ filter.name }</FlexItem>
			{ operatorOptions.length > 1 && (
				<SelectControl
					label={ __( 'Condition' ) }
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
					size="compact"
					__nextHasNoMarginBottom
					hideLabelFromVision
				/>
			) }
		</HStack>
	);
}

function ResetFilter( { filter, view, onChangeView } ) {
	const isDisabled =
		view.filters.find( ( _filter ) => _filter.field === filter.field )
			?.value === undefined && filter.isPrimary;
	return (
		<Button
			disabled={ isDisabled }
			__experimentalIsFocusable
			size="compact"
			variant="tertiary"
			style={ { justifyContent: 'center' } }
			onClick={ () => {
				onChangeView( {
					...view,
					page: 1,
					filters: view.filters.filter(
						( _filter ) => _filter.field !== filter.field
					),
				} );
			} }
		>
			{ filter.isPrimary ? __( 'Reset' ) : __( 'Remove' ) }
		</Button>
	);
}

export default function FilterSummary( props ) {
	const { filter, view } = props;
	const filterInView = view.filters.find( ( f ) => f.field === filter.field );
	const activeElement = filter.elements.find(
		( element ) => element.value === filterInView?.value
	);
	return (
		<Dropdown
			contentClassName="dataviews-filter-summary__popover"
			popoverProps={ { placement: 'bottom-start', role: 'dialog' } }
			renderToggle={ ( { onToggle } ) => (
				<Button
					__experimentalIsFocusable
					size="compact"
					onClick={ onToggle }
				>
					<FilterText
						activeElement={ activeElement }
						filterInView={ filterInView }
						filter={ filter }
					/>
				</Button>
			) }
			renderContent={ () => {
				return (
					<VStack spacing={ 0 } justify="flex-start">
						<WithSeparators
							separator={
								<hr className="dataviews-filter-summary__popover-separator" />
							}
						>
							<OperatorSelector { ...props } />
							<SearchWidget { ...props } />
							<ResetFilter { ...props } />
						</WithSeparators>
					</VStack>
				);
			} }
		/>
	);
}
