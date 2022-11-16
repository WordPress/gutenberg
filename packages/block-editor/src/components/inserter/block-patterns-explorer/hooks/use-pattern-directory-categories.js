/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

export default function usePatternDirectoryCategories() {
	const [ categories, setCategories ] = useState( [] );
	useEffect( () => {
		apiFetch( {
			path: '/wp/v2/pattern-directory/categories',
		} ).then( ( fetchedCategories ) => {
			setCategories( fetchedCategories );
		} );
	}, [] );
	return categories;
}
