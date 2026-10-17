import { useMemo, useState, useEffect } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import { getScrollContainer } from '@wordpress/dom';
import type { BlockPattern } from '../../../store/types';
import type { PatternsPaging, PatternsScrollContainerRef } from '../types';

const PAGE_SIZE = 20;

/**
 * Supplies values needed to page the patterns list client side.
 *
 * @param currentCategoryPatterns An array of the current patterns to display.
 * @param currentCategory         The currently selected category.
 * @param scrollContainerRef      Ref of container to find scroll container for when moving between pages.
 * @param currentFilter           The currently search filter.
 *
 * @return Returns the relevant paging values. (totalItems, categoryPatternsList, numPages, changePage, currentPage)
 */
export default function usePatternsPaging(
	currentCategoryPatterns: BlockPattern[],
	currentCategory: unknown,
	scrollContainerRef?: PatternsScrollContainerRef,
	currentFilter = ''
): PatternsPaging {
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
	const changePage = ( page: number ) => {
		const scrollContainer = getScrollContainer(
			// `getScrollContainer` returns nothing for a missing element.
			scrollContainerRef?.current as Element | null
		);
		scrollContainer?.scrollTo( 0, 0 );

		setCurrentPage( page );
	};

	useEffect(
		function scrollToTopOnCategoryChange() {
			const scrollContainer = getScrollContainer(
				// `getScrollContainer` returns nothing for a missing element.
				scrollContainerRef?.current as Element | null
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
