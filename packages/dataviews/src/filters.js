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
import { ENUMERATION_TYPE, OPERATOR_IN, OPERATOR_NOT_IN } from './constants';

const Filters = memo( function Filters( {
	fields,
	view,
	onChangeView,
	openFilterOnMount,
	setOpenFilterOnMount,
} ) {
	const addFilterRef = useRef();
	const filters = [];
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
					isVisible:
						isPrimary ||
						view.filters.some(
							( f ) =>
								f.field === field.id &&
								[ OPERATOR_IN, OPERATOR_NOT_IN ].includes(
									f.operator
								)
						),
					isPrimary,
				} );
		}
	} );
	// Sort filters by primary property. We need the primary filters to be first.
	filters.sort( ( a, b ) => b.isPrimary - a.isPrimary ); // Type coercion to numbers.
	const addFilter = (
		<AddFilter
			key="add-filter"
			filters={ filters }
			view={ view }
			onChangeView={ onChangeView }
			ref={ addFilterRef }
			setOpenFilterOnMount={ setOpenFilterOnMount }
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
					openFilterOnMount={ openFilterOnMount }
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

	return filterComponents;
} );

export default Filters;
