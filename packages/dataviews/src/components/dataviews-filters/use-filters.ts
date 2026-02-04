/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	isRegisteredOperator,
	isSingleSelectionOperator,
} from '../../utils/operators';
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
			const isRequired =
				view.filters?.some(
					( f ) => f.field === field.id && !! f.isRequired
				) ?? false;
			filters.push( {
				field: field.id,
				name: field.label,
				elements: field.elements,
				getElements: field.getElements,
				hasElements: field.hasElements,
				singleSelection: operators.some( ( op ) =>
					isSingleSelectionOperator( op )
				),
				operators,
				isVisible:
					isLocked ||
					isRequired ||
					isPrimary ||
					!! view.filters?.some(
						( f ) =>
							f.field === field.id &&
							isRegisteredOperator( f.operator )
					),
				isPrimary,
				isLocked,
				isRequired,
			} );
		} );

		// Sort filters by:
		// - locked filters go first
		// - required filters go next
		// - primary filters go next
		// - then, sort by name
		filters.sort( ( a, b ) => {
			if ( a.isLocked && ! b.isLocked ) {
				return -1;
			}
			if ( ! a.isLocked && b.isLocked ) {
				return 1;
			}
			if ( a.isRequired && ! b.isRequired ) {
				return -1;
			}
			if ( ! a.isRequired && b.isRequired ) {
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
