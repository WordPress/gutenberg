/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Retrieve publicly-queryable taxonomies.
 *
 * @return {Object[]} Array of public taxonomy objects.
 */
export function usePublicTaxonomies() {
	const taxonomies = useSelect(
		( select ) => select( coreStore ).getTaxonomies( { per_page: -1 } ),
		[]
	);
	return useMemo( () => {
		return (
			taxonomies?.filter(
				( { visibility } ) => visibility?.publicly_queryable
			) || []
		);
	}, [ taxonomies ] );
}
