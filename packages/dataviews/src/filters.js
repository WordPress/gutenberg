/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FilterSummary from './filter-summary';
import AddFilter from './add-filter';
import ResetFilters from './reset-filters';
import {
	ENUMERATION_TYPE,
	OPERATOR_IN,
	OPERATOR_NOT_IN,
	LAYOUT_LIST,
} from './constants';

const sanitizeOperators = ( field ) => {
	let operators = field.filterBy?.operators;
	if ( ! operators || ! Array.isArray( operators ) ) {
		operators = [ OPERATOR_IN, OPERATOR_NOT_IN ];
	}
	return operators.filter( ( operator ) =>
		[ OPERATOR_IN, OPERATOR_NOT_IN ].includes( operator )
	);
};

const Filters = memo( function Filters( { fields, view, onChangeView } ) {
	const filters = [];
	let primaryFilters = 0;
	fields.forEach( ( field ) => {
		if ( ! field.type ) {
			return;
		}

		const operators = sanitizeOperators( field );
		if ( operators.length === 0 ) {
			return;
		}

		switch ( field.type ) {
			case ENUMERATION_TYPE:
				if ( ! field.elements?.length ) {
					return;
				}

				const isPrimary = !! field.filterBy?.isPrimary;
				filters.push( {
					field: field.id,
					name: field.header,
					elements: field.elements,
					operators,
					isVisible: isPrimary
						? true
						: view.filters.some(
								( f ) =>
									f.field === field.id &&
									[ OPERATOR_IN, OPERATOR_NOT_IN ].includes(
										f.operator
									)
						  ),
					isPrimary,
				} );
				if ( isPrimary ) {
					primaryFilters++;
				}
		}
	} );

	const addFilter = (
		<AddFilter
			key="add-filter"
			filters={ filters }
			view={ view }
			onChangeView={ onChangeView }
		/>
	);
	const filterComponents = [
		addFilter,
		...filters.map( ( filter ) => {
			if ( ! filter.isVisible || view.type === LAYOUT_LIST ) {
				return null;
			}

			return (
				<FilterSummary
					key={ filter.field }
					filter={ filter }
					view={ view }
					onChangeView={ onChangeView }
				/>
			);
		} ),
	];

	// Reset should be hidden when either:
	//
	// - the layout is list
	// - or there is only one primary filter and none secondary filters
	if (
		view.type === LAYOUT_LIST ||
		( filters.length === 1 && primaryFilters === 1 )
	) {
		return filterComponents;
	}

	filterComponents.push(
		<ResetFilters
			key="reset-filters"
			view={ view }
			onChangeView={ onChangeView }
		/>
	);

	return filterComponents;
} );

export default Filters;
