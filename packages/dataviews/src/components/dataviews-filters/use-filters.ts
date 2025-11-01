/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ALL_OPERATORS, SINGLE_SELECTION_OPERATORS } from '../../constants';
import type { NormalizedFilter, NormalizedField, View } from '../../types';

function useFilters( fields: NormalizedField< any >[], view: View ) {
	return useMemo( () => {
		const filters: NormalizedFilter[] = [];
		fields.forEach( ( field ) => {
			if (
				field.filterBy === false ||
				( ! field.hasElements && ! field.Edit )
			) {
				return;
			}

			const operators = field.filterBy.operators;
			const isPrimary = !! field.filterBy?.isPrimary;
			const isLocked =
				view.filters?.some(
					( f ) => f.field === field.id && !! f.isLocked
				) ?? false;
			filters.push( {
				field: field.id,
				name: field.label,
				elements: field.elements,
				getElements: field.getElements,
				hasElements: field.hasElements,
				singleSelection: operators.some( ( op ) =>
					SINGLE_SELECTION_OPERATORS.includes( op )
				),
				operators,
				isVisible:
					isLocked ||
					isPrimary ||
					!! view.filters?.some(
						( f ) =>
							f.field === field.id &&
							ALL_OPERATORS.includes( f.operator )
					),
				isPrimary,
				isLocked,
			} );
		} );

		// Sort filters by:
		// - locked filters go first
		// - primary filters go next
		// - then, sort by name
		filters.sort( ( a, b ) => {
			if ( a.isLocked && ! b.isLocked ) {
				return -1;
			}
			if ( ! a.isLocked && b.isLocked ) {
				return 1;
			}
			if ( a.isPrimary && ! b.isPrimary ) {
				return -1;
			}
			if ( ! a.isPrimary && b.isPrimary ) {
				return 1;
			}
			return a.name.localeCompare( b.name );
		} );
		return filters;
	}, [ fields, view ] );
}

export default useFilters;
