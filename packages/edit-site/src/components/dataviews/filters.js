/**
 * Internal dependencies
 */
import FilterSummary from './filter-summary';
import AddFilter from './add-filter';
import ResetFilters from './reset-filters';
import { ENUMERATION_TYPE, OPERATOR_IN } from './constants';

export default function Filters( { fields, view, onChangeView } ) {
	const filters = [];
	fields.forEach( ( field ) => {
		if ( ! field.type ) {
			return;
		}

		switch ( field.type ) {
			case ENUMERATION_TYPE:
				filters.push( {
					field: field.id,
					name: field.header,
					elements: field.elements || [],
					isVisible: view.filters.some(
						( f ) =>
							f.field === field.id && f.operator === OPERATOR_IN
					),
				} );
		}
	} );

	const filterComponents = filters.map( ( filter ) => {
		if ( ! filter.isVisible ) {
			return null;
		}

		return (
			<FilterSummary
				key={ filter.field + '.' + filter.operator }
				filter={ filter }
				view={ view }
				onChangeView={ onChangeView }
			/>
		);
	} );

	filterComponents.push(
		<AddFilter
			key="add-filter"
			fields={ fields }
			view={ view }
			onChangeView={ onChangeView }
		/>
	);

	if ( filterComponents.length > 1 ) {
		filterComponents.push(
			<ResetFilters
				key="reset-filters"
				view={ view }
				onChangeView={ onChangeView }
			/>
		);
	}

	return filterComponents;
}
