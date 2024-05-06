/**
 * WordPress dependencies
 */
import { memo, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FilterSummary from './filter-summary';
import AddFilter from './add-filter';
import ResetFilters from './reset-filters';
import { sanitizeOperators } from './utils';
import { ALL_OPERATORS, OPERATOR_IS, OPERATOR_IS_NOT } from './constants';
import { __experimentalHStack as HStack } from '@wordpress/components';

const Filters = memo( function Filters( {
	fields,
	view,
	onChangeView,
	openedFilter,
	setOpenedFilter,
} ) {
	const addFilterRef = useRef();
	const filters = [];
	fields.forEach( ( field ) => {
		if ( ! field.elements?.length ) {
			return;
		}

		const operators = sanitizeOperators( field );
		if ( operators.length === 0 ) {
			return;
		}

		const isPrimary = !! field.filterBy?.isPrimary;
		filters.push( {
			field: field.id,
			name: field.header,
			elements: field.elements,
			singleSelection: operators.some( ( op ) =>
				[ OPERATOR_IS, OPERATOR_IS_NOT ].includes( op )
			),
			operators,
			isVisible:
				isPrimary ||
				view.filters.some(
					( f ) =>
						f.field === field.id &&
						ALL_OPERATORS.includes( f.operator )
				),
			isPrimary,
		} );
	} );
	// Sort filters by primary property. We need the primary filters to be first.
	// Then we sort by name.
	filters.sort( ( a, b ) => {
		if ( a.isPrimary && ! b.isPrimary ) {
			return -1;
		}
		if ( ! a.isPrimary && b.isPrimary ) {
			return 1;
		}
		return a.name.localeCompare( b.name );
	} );
	const addFilter = (
		<AddFilter
			key="add-filter"
			filters={ filters }
			view={ view }
			onChangeView={ onChangeView }
			ref={ addFilterRef }
			setOpenedFilter={ setOpenedFilter }
		/>
	);
	const filterComponents = [
		...filters.map( ( filter ) => {
			if ( ! filter.isVisible ) {
				return null;
			}

			return (
				<FilterSummary
					key={ filter.field }
					filter={ filter }
					view={ view }
					onChangeView={ onChangeView }
					addFilterRef={ addFilterRef }
					openedFilter={ openedFilter }
				/>
			);
		} ),
		addFilter,
	];

	if ( filterComponents.length > 1 ) {
		filterComponents.push(
			<ResetFilters
				key="reset-filters"
				filters={ filters }
				view={ view }
				onChangeView={ onChangeView }
			/>
		);
	}

	return (
		<HStack justify="flex-start" style={ { width: 'fit-content' } } wrap>
			{ filterComponents }
		</HStack>
	);
} );

export default Filters;
