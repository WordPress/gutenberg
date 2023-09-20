/**
 * WordPress dependencies
 */
import { useMemo, useEffect, useRef, useState } from '@wordpress/element';
import { _n, sprintf } from '@wordpress/i18n';
import { useDebounce } from '@wordpress/compose';
import { __experimentalHeading as Heading } from '@wordpress/components';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import BlockPatternsList from '../../block-patterns-list';
import useInsertionPoint from '../hooks/use-insertion-point';
import usePatternsState from '../hooks/use-patterns-state';
import InserterListbox from '../../inserter-listbox';
import { searchItems } from '../search-items';
import BlockPatternsPaging from '../../block-patterns-paging';
import usePatternsPaging from '../hooks/use-patterns-paging';
import { allPatternsCategory, isPatternFiltered } from '../block-patterns-tab';
import { BlockPatternsSyncFilter } from '../block-patterns-sync-filter';
import {
	PATTERN_TYPES,
	PATTERN_SOURCE_FILTERS,
} from '../block-patterns-source-filter';

function PatternsListHeader( {
	filterValue,
	filteredBlockPatternsLength,
	selectedCategory,
	patternCategories,
} ) {
	if ( ! filterValue ) {
		return null;
	}
	let filter = filterValue;
	if ( selectedCategory !== allPatternsCategory.name ) {
		const category = patternCategories.find(
			( patternCategory ) => patternCategory.name === selectedCategory
		);
		if ( category ) {
			filter = `${ filter } - ${ category?.label }`;
		}
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
				filter
			) }
		</Heading>
	);
}

function PatternList( {
	searchValue,
	patternSourceFilter,
	selectedCategory,
	patternCategories,
} ) {
	const [ patternSyncFilter, setPatternSyncFilter ] = useState( 'all' );
	const container = useRef();
	const debouncedSpeak = useDebounce( speak, 500 );
	const [ destinationRootClientId, onInsertBlocks ] = useInsertionPoint( {
		shouldFocusBlock: true,
	} );
	const [ patterns, , onClickPattern ] = usePatternsState(
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
		const filteredPatterns = patterns.filter( ( pattern ) => {
			if (
				isPatternFiltered(
					pattern,
					patternSourceFilter,
					patternSyncFilter
				)
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

		if ( ! searchValue ) {
			return filteredPatterns;
		}

		return searchItems(
			filteredPatterns,
			searchValue,
			patternSourceFilter
		);
	}, [
		searchValue,
		patternSourceFilter,
		patterns,
		selectedCategory,
		registeredPatternCategories,
		patternSyncFilter,
	] );

	// Announce search results on change.
	useEffect( () => {
		if ( ! searchValue ) {
			return;
		}
		const count = filteredBlockPatterns.length;
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ searchValue, debouncedSpeak, filteredBlockPatterns.length ] );

	const pagingProps = usePatternsPaging(
		filteredBlockPatterns,
		selectedCategory,
		container,
		patternSourceFilter
	);

	const hasItems = !! filteredBlockPatterns?.length;
	return (
		<div
			className="block-editor-block-patterns-explorer__list"
			ref={ container }
		>
			<PatternsListHeader
				filterValue={
					searchValue || PATTERN_SOURCE_FILTERS[ patternSourceFilter ]
				}
				filteredBlockPatternsLength={ filteredBlockPatterns.length }
				selectedCategory={ selectedCategory }
				patternCategories={ patternCategories }
			/>

			<InserterListbox>
				{ patternSourceFilter === PATTERN_TYPES.user &&
					! searchValue && (
						<BlockPatternsSyncFilter
							patternSyncFilter={ patternSyncFilter }
							setPatternSyncFilter={ setPatternSyncFilter }
						/>
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
