/**
 * Taxonomy names by `rest_base`, to name the field a terms suggestion
 * targets.
 */
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import type { TaxonomyNames } from './post-field-labels';

const TAXONOMY_QUERY = { per_page: -1 };

/**
 * @return Taxonomy names by `rest_base`.
 */
export function useTaxonomyNames(): TaxonomyNames {
	const taxonomies = useSelect(
		( select ) =>
			( select( coreStore ) as any ).getTaxonomies( TAXONOMY_QUERY ),
		[]
	);
	return useMemo(
		() =>
			Object.fromEntries(
				( taxonomies ?? [] ).map( ( taxonomy: any ) => [
					taxonomy.rest_base,
					taxonomy.name,
				] )
			),
		[ taxonomies ]
	);
}
