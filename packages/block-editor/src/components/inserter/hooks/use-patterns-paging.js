/**
 * WordPress dependencies
 */
import { useMemo, useState, useEffect } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';

const PAGE_SIZE = 20;

/**
 * Supplies values needed to page the patterns list client side.
 *
 * @param {Array}  currentCategoryPatterns An array of the current patterns to display.
 * @param {string} currentCategory         The currently selected category.
 * @param {Object} scrollContainerRef      Ref of container to to find scroll container for when moving between pages.
 * @param {string} currentFilter           The currently search filter.
 *
 * @return {Object} Returns the relevant paging values. (totalItems, categoryPatternsList, numPages, changePage, currentPage)
 */
export default function usePatternsPaging(
	currentCategoryPatterns,
	currentCategory,
	scrollContainerRef,
	currentFilter = ''
) {
	const [ currentPage, setCurrentPage ] = useState( 1 );
	const previousCategory = usePrevious( currentCategory );
	const previousFilter = usePrevious( currentFilter );
	if (
		( previousCategory !== currentCategory ||
			previousFilter !== currentFilter ) &&
		currentPage !== 1
	) {
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
	const numPages = Math.ceil( currentCategoryPatterns.length / PAGE_SIZE );
	const changePage = ( page ) => {
		const scrollContainer = getScrollContainer(
			scrollContainerRef?.current
		);
		scrollContainer?.scrollTo( 0, 0 );

		setCurrentPage( page );
	};

	useEffect(
		function scrollToTopOnCategoryChange() {
			const scrollContainer = getScrollContainer(
				scrollContainerRef?.current
			);
			scrollContainer?.scrollTo( 0, 0 );
		},
		[ currentCategory, scrollContainerRef ]
	);

	return {
		totalItems,
		categoryPatterns,
		numPages,
		changePage,
		currentPage,
	};
}
