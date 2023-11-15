/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { default as InFilter, OPERATOR_IN } from './in-filter';
import ResetFilters from './reset-filters';

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

	const visibleFilters = view.visibleFilters
		?.map( ( fieldName ) => {
			const visibleFiltersForField = filtersRegistered.filter(
				( f ) => f.field === fieldName
			);

			if ( visibleFiltersForField.length === 0 ) {
				return null;
			}

			return visibleFiltersForField.map( ( filter ) => {
				if ( OPERATOR_IN === filter.operator ) {
					return (
						<InFilter
							key={ fieldName + '.' + filter.operator }
							filter={ visibleFiltersForField[ 0 ] }
							view={ view }
							onChangeView={ onChangeView }
						/>
					);
				}
				return null;
			} );
		} )
		.filter( Boolean );

	if ( visibleFilters?.length > 0 ) {
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
