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
import {
	INSERTER_PATTERN_TYPES,
	allPatternsCategory,
	myPatternsCategory,
	starterPatternsCategory,
} from '../block-patterns-tab/utils';

function PatternsListHeader( { filterValue, filteredBlockPatternsLength } ) {
	if ( ! filterValue ) {
		return null;
	}

	return (
		<Heading
			level={ 2 }
			lineHeight="48px"
			className="block-editor-block-patterns-explorer__search-results-count"
		>
			{ sprintf(
				/* translators: %d: number of patterns. */
				_n(
					'%d pattern found',
					'%d patterns found',
					filteredBlockPatternsLength
				),
				filteredBlockPatternsLength
			) }
		</Heading>
	);
}

function PatternList( {
	searchValue,
	selectedCategory,
	patternCategories,
	rootClientId,
	onModalClose,
} ) {
	const container = useRef();
	const debouncedSpeak = useDebounce( speak, 500 );
	const [ destinationRootClientId, onInsertBlocks ] = useInsertionPoint( {
		rootClientId,
		shouldFocusBlock: true,
	} );
	const [ patterns, , onClickPattern ] = usePatternsState(
		onInsertBlocks,
		destinationRootClientId,
		selectedCategory
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
			if ( selectedCategory === allPatternsCategory.name ) {
				return true;
			}
			if (
				selectedCategory === myPatternsCategory.name &&
				pattern.type === INSERTER_PATTERN_TYPES.user
			) {
				return true;
			}
			if (
				selectedCategory === starterPatternsCategory.name &&
				pattern.blockTypes?.includes( 'core/post-content' )
			) {
				return true;
			}
			if ( selectedCategory === 'uncategorized' ) {
				const hasKnownCategory =
					pattern.categories?.some( ( category ) =>
						registeredPatternCategories.includes( category )
					) ?? false;

				return ! pattern.categories?.length || ! hasKnownCategory;
			}

			return pattern.categories?.includes( selectedCategory );
		} );

		if ( ! searchValue ) {
			return filteredPatterns;
		}

		return searchItems( filteredPatterns, searchValue );
	}, [
		searchValue,
		patterns,
		selectedCategory,
		registeredPatternCategories,
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
		container
	);

	// Reset page when search value changes.
	const [ previousSearchValue, setPreviousSearchValue ] =
		useState( searchValue );
	if ( searchValue !== previousSearchValue ) {
		setPreviousSearchValue( searchValue );
		pagingProps.changePage( 1 );
	}

	const hasItems = !! filteredBlockPatterns?.length;
	return (
		<div
			className="block-editor-block-patterns-explorer__list"
			ref={ container }
		>
			<PatternsListHeader
				filterValue={ searchValue }
				filteredBlockPatternsLength={ filteredBlockPatterns.length }
			/>

			<InserterListbox>
				{ hasItems && (
					<>
						<BlockPatternsList
							blockPatterns={ pagingProps.categoryPatterns }
							onClickPattern={ ( pattern, blocks ) => {
								onClickPattern( pattern, blocks );
								onModalClose();
							} }
							isDraggable={ false }
						/>
						<BlockPatternsPaging { ...pagingProps } />
					</>
				) }
			</InserterListbox>
		</div>
	);
}

export default PatternList;
