/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';

import { useAsyncList } from '@wordpress/compose';

const PAGE_SIZE = 20;
const INITIAL_INSERTER_RESULTS = 2;

/**
 * Supplies values needed to page the patterns list client side.
 *
 * @param {Array}  currentCategoryPatterns An array of the current categories to display.
 * @param {string} scrollContainerClass    Class of container to scroll when moving between pages.
 *
 * @return {Object} Returns the relevant paging values. (totalItems, categoryPatternsList, numPages, changePage, currentPage)
 */
export default function usePatternsPaging(
	currentCategoryPatterns,
	scrollContainerClass
) {
	const [ currentPage, setCurrentPage ] = useState( 1 );
	const totalItems = currentCategoryPatterns.length;
	const pageIndex = currentPage - 1;
	const list = useMemo( () => {
		return currentCategoryPatterns.slice(
			pageIndex * PAGE_SIZE,
			pageIndex * PAGE_SIZE + PAGE_SIZE
		);
	}, [ pageIndex, currentCategoryPatterns ] );
	const categoryPatternsList = useAsyncList( list, {
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
		categoryPatternsList,
		numPages,
		changePage,
		currentPage,
	};
}
