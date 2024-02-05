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
import { sanitizeOperators } from './utils';
import { ENUMERATION_TYPE, LAYOUT_LIST } from './constants';

const Filters = memo( function Filters( { fields, view, onChangeView } ) {
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
							( f ) => f.field === field.id
							// &&
							// [ OPERATOR_IN, OPERATOR_NOT_IN ].includes(
							// 	f.operator
							// )
						),
					isPrimary,
				} );
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
				/>
			);
		} ),
		addFilter,
	];

	if ( filterComponents.length > 1 && view.type !== LAYOUT_LIST ) {
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
