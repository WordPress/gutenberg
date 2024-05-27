/**
 * WordPress dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { OPERATOR_IS_ANY, OPERATOR_IS_NONE } from '../../utils/constants';
import { DEFAULT_VIEWS } from './default-views';

export default function useDataViews( postType ) {
	// Fetch all the posts of the post type.
	const data = useEntityRecords( 'postType', postType, {
		per_page: -1,
		status: [ 'any', 'trash' ],
	} )?.records;

	// Insert the records for each view.
	const views = useMemo( () => {
		return DEFAULT_VIEWS[ postType ].map( ( view ) => {
			const viewFilters = view?.view?.filters;
			// Filter the records matching the view filters.
			view.records = data?.filter( ( record ) => {
				// Check if the record matches all the filters.
				return viewFilters.every( ( filter ) => {
					let filterValues = filter.value;
					const filterField = filter.field;
					const filterOperator = filter.operator;

					// Convert string to array value if required.
					if ( ! Array.isArray( filterValues ) ) {
						filterValues = [ filterValues ];
					}

					if ( filterOperator === OPERATOR_IS_ANY ) {
						return filterValues.includes( record[ filterField ] );
					}

					if ( filterOperator === OPERATOR_IS_NONE ) {
						return ! filterValues.includes( record[ filterField ] );
					}

					return true;
				} );
			} );

			return view;
		} );
	}, [ data, postType ] );

	return views;
}
