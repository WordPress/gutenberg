/**
 * WordPress dependencies
 */
import { useMemo, useEffect, useRef } from '@wordpress/element';
import { _n, sprintf } from '@wordpress/i18n';
import { useDebounce } from '@wordpress/compose';
import { __experimentalHeading as Heading } from '@wordpress/components';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import BlockPatternsList from '../../block-patterns-list';
import InserterNoResults from '../no-results';
import useInsertionPoint from '../hooks/use-insertion-point';
import usePatternsState from '../hooks/use-patterns-state';
import InserterListbox from '../../inserter-listbox';
import { searchItems } from '../search-items';
import BlockPatternsPaging from '../../block-patterns-paging';
import usePatternsPaging from '../hooks/use-patterns-paging';
import { allPatternsCategory, isPatternFiltered } from '../block-patterns-tab';
import { BlockPatternsSyncFilter } from '../block-patterns-sync-filter';
import { PATTERN_TYPES } from '../block-patterns-filter';

function PatternsListHeader( { filterValue, filteredBlockPatternsLength } ) {
	if ( ! filterValue ) {
		return null;
	}
	return (
		<Heading
			level={ 2 }
			lineHeight={ '48px' }
			className="block-editor-block-patterns-explorer__search-results-count"
		>
			{ sprintf(
				/* translators: %d: number of patterns. %s: block pattern search query */
				_n(
					'%1$d pattern found for "%2$s"',
					'%1$d patterns found for "%2$s"',
					filteredBlockPatternsLength
				),
				filteredBlockPatternsLength,
				filterValue
			) }
		</Heading>
	);
}

function PatternList( {
	searchValue,
	filterValue,
	selectedCategory,
	patternCategories,
	patternSyncFilter,
} ) {
	const container = useRef();
	const debouncedSpeak = useDebounce( speak, 500 );
	const [ destinationRootClientId, onInsertBlocks ] = useInsertionPoint( {
		shouldFocusBlock: true,
	} );
	const { patterns: allPatterns, onClickPattern } = usePatternsState(
		onInsertBlocks,
		destinationRootClientId
	);

	const registeredPatternCategories = useMemo(
		() =>
			patternCategories.map(
				( patternCategory ) => patternCategory.name
			),
		[ patternCategories ]
	);

	const filteredBlockPatterns = useMemo( () => {
		if ( ! searchValue ) {
			return allPatterns.filter( ( pattern ) => {
				if (
					isPatternFiltered( pattern, filterValue, patternSyncFilter )
				) {
					return false;
				}

				if ( selectedCategory === allPatternsCategory.name ) {
					return true;
				}

				if ( selectedCategory === 'uncategorized' ) {
					const hasKnownCategory = pattern.categories.some(
						( category ) =>
							registeredPatternCategories.includes( category )
					);

					return ! pattern.categories?.length || ! hasKnownCategory;
				}

				return pattern.categories?.includes( selectedCategory );
			} );
		}
		return searchItems( allPatterns, searchValue );
	}, [
		searchValue,
		filterValue,
		allPatterns,
		selectedCategory,
		registeredPatternCategories,
		patternSyncFilter,
	] );

	// Announce search results on change.
	useEffect( () => {
		if ( ! filterValue ) {
			return;
		}
		const count = filteredBlockPatterns.length;
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ filterValue, debouncedSpeak, filteredBlockPatterns.length ] );

	const pagingProps = usePatternsPaging(
		filteredBlockPatterns,
		container,
		filterValue
	);

	const hasItems = !! filteredBlockPatterns?.length;
	return (
		<div
			className="block-editor-block-patterns-explorer__list"
			ref={ container }
		>
			{ hasItems && (
				<PatternsListHeader
					filterValue={ filterValue }
					filteredBlockPatternsLength={ filteredBlockPatterns.length }
				/>
			) }
			<InserterListbox>
				{ ! hasItems && <InserterNoResults /> }
				{ filterValue === PATTERN_TYPES.user && (
					<BlockPatternsSyncFilter />
				) }
				{ hasItems && (
					<BlockPatternsList
						shownPatterns={ pagingProps.categoryPatternsAsyncList }
						blockPatterns={ pagingProps.categoryPatterns }
						onClickPattern={ onClickPattern }
						isDraggable={ false }
					/>
				) }
				{ pagingProps.numPages > 1 && (
					<BlockPatternsPaging { ...pagingProps } />
				) }
			</InserterListbox>
		</div>
	);
}

export default PatternList;
