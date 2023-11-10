/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { default as InFilter, OPERATOR_IN } from './in-filter';
import ResetFilters from './reset-filters';
import AddFilter from './add-filter';

const VALID_OPERATORS = [ OPERATOR_IN ];

export default function Filters( { fields, view, onChangeView } ) {
	const filtersRegistered = [];
	fields.forEach( ( field ) => {
		if ( ! field.filters ) {
			return;
		}

		field.filters.forEach( ( filter ) => {
			if ( VALID_OPERATORS.some( ( operator ) => operator === filter ) ) {
				filtersRegistered.push( {
					field: field.id,
					name: field.header,
					operator: filter,
					elements: [
						{
							value: '',
							label: __( 'All' ),
						},
						...( field.elements || [] ),
					],
				} );
			}
		} );
	} );

	const visibleFiltersList = filtersRegistered.filter( ( filter ) =>
		view.visibleFilters.includes( filter.field )
	);
	const hiddenFiltersList = filtersRegistered.filter(
		( filter ) => ! view.visibleFilters.includes( filter.field )
	);

	const visibleFilters = visibleFiltersList
		?.map( ( filter ) => {
			if ( OPERATOR_IN === filter.operator ) {
				return (
					<InFilter
						key={ filter.field + '.' + filter.operator }
						filter={ filter }
						view={ view }
						onChangeView={ onChangeView }
					/>
				);
			}
			return null;
		} )
		.filter( Boolean );

	visibleFilters.push(
		<AddFilter
			key="add-filter"
			filters={ hiddenFiltersList }
			view={ view }
			onChangeView={ onChangeView }
		/>
	);

	if ( visibleFilters?.length > 1 ) {
		visibleFilters.push(
			<ResetFilters
				key="reset-filters"
				view={ view }
				onChangeView={ onChangeView }
			/>
		);
	}

	return visibleFilters;
}
