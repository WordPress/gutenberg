/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../../../store';

export default function usePatternDirectoryCategories() {
	const [ categories, setCategories ] = useState( [] );
	const fetchEntities = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().__unstableFetchEntities,
		[]
	);
	useEffect( () => {
		fetchEntities?.( '/wp/v2/pattern-directory/categories' ).then(
			( fetchedCategories ) => {
				setCategories( fetchedCategories );
			}
		);
	}, [] );
	return categories;
}
