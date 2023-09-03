/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';

import { useAsyncList, usePrevious } from '@wordpress/compose';

const PAGE_SIZE = 20;
const INITIAL_INSERTER_RESULTS = 5;

/**
 * Supplies values needed to page the patterns list client side.
 *
 * @param {Array}  currentCategoryPatterns An array of the current patterns to display.
 * @param {string} currentCategory         The currently selected category.
 * @param {string} scrollContainerClass    Class of container to scroll when moving between pages.
 *
 * @return {Object} Returns the relevant paging values. (totalItems, categoryPatternsList, numPages, changePage, currentPage)
 */
export default function usePatternsPaging(
	currentCategoryPatterns,
	currentCategory,
	scrollContainerClass
) {
	const [ currentPage, setCurrentPage ] = useState( 1 );
	const previousCategory = usePrevious( currentCategory );
	if ( previousCategory !== currentCategory && currentPage !== 1 ) {
		setCurrentPage( 1 );
	}
	const totalItems = currentCategoryPatterns.length;
	const pageIndex = currentPage - 1;
	const categoryPatterns = useMemo( () => {
		return currentCategoryPatterns.slice(
			pageIndex * PAGE_SIZE,
			pageIndex * PAGE_SIZE + PAGE_SIZE
		);
	}, [ pageIndex, currentCategoryPatterns ] );
	const categoryPatternsAsyncList = useAsyncList( categoryPatterns, {
		step: INITIAL_INSERTER_RESULTS,
	} );
	const numPages = Math.ceil( currentCategoryPatterns.length / PAGE_SIZE );
	const changePage = ( page ) => {
		const scrollContainer = document.querySelector( scrollContainerClass );
		scrollContainer?.scrollTo( 0, 0 );

		setCurrentPage( page );
	};
	return {
		totalItems,
		categoryPatterns,
		categoryPatternsAsyncList,
		numPages,
		changePage,
		currentPage,
	};
}
