/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

export default function useHierarchicalTerms() {
	const taxonomies = useSelect( ( select ) =>
		select( 'core' ).getTaxonomies( { per_page: -1 } )
	);

	const [ hierarchicalTerms, setHierarchicalTerms ] = useState( [] );

	const [
		isLoadingHierarchicalTerms,
		setIsLoadingHierarchicalTerms,
	] = useState( false );

	useEffect( () => {
		if ( ! taxonomies ) {
			setIsLoadingHierarchicalTerms( true );
			return;
		}

		setHierarchicalTerms(
			filter(
				taxonomies,
				( taxonomy ) =>
					taxonomy.hierarchical && taxonomy.visibility.show_ui
			)
		);
		setIsLoadingHierarchicalTerms( false );
	}, [ setIsLoadingHierarchicalTerms, taxonomies ] );

	return { hierarchicalTerms, isLoadingHierarchicalTerms };
}
