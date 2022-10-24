/**
 * WordPress dependencies
 */
import { useMemo, useEffect, useState } from '@wordpress/element';
import { _n, sprintf } from '@wordpress/i18n';
import { useDebounce, useAsyncList } from '@wordpress/compose';
import { __experimentalHeading as Heading } from '@wordpress/components';
import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import BlockPatternsList from '../../block-patterns-list';
import InserterNoResults from '../no-results';
import useInsertionPoint from '../hooks/use-insertion-point';
import usePatternsState from '../hooks/use-patterns-state';
import InserterListbox from '../../inserter-listbox';
import { searchItems } from '../search-items';

const INITIAL_INSERTER_RESULTS = 2;

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

const categoryPatterns = {};
const searchedPatterns = {};
// TODO: check what order options are used in PD..
function usePatternsFromDirectory( options = {} ) {
	const [ patterns, setPatterns ] = useState( [] );
	useEffect( () => {
		if ( ! Object.keys( options ).length ) {
			return;
		}
		// TODO: check how to cache all these involves the parsing and canInsert checks..
		// TODO: also track when then request is in progress...
		if ( searchedPatterns[ options.search ] ) {
			setPatterns( searchedPatterns[ options.search ] );
			return;
		}
		if ( categoryPatterns[ options.category ] ) {
			setPatterns( categoryPatterns[ options.category ] );
			return;
		}
		apiFetch( {
			path: addQueryArgs( '/wp/v2/pattern-directory/patterns', {
				...options,
				per_page: 3,
			} ),
		} ).then( ( fetchedCategories ) => {
			const result = fetchedCategories.slice( 0, 10 );
			if ( !! options.search ) {
				searchedPatterns[ options.search ] = result;
			} else if ( !! options.category ) {
				categoryPatterns[ options.category ] = result;
			}
			setPatterns( result );
		} );
	}, [ options.search, options.category ] );
	// TODO: check about custom sorting of categories.
	return patterns;
}

function PatternList( { filterValue, selectedCategory, patternCategories } ) {
	const debouncedSpeak = useDebounce( speak, 500 );
	const [ destinationRootClientId, onInsertBlocks ] = useInsertionPoint( {
		shouldFocusBlock: true,
	} );
	const [ , , onSelectBlockPattern ] = usePatternsState(
		onInsertBlocks,
		destinationRootClientId
	);
	const options = {};
	if ( !! filterValue ) {
		options.search = filterValue;
	} else if ( selectedCategory ) {
		options.category = selectedCategory;
	}
	const allPatterns = usePatternsFromDirectory( options );

	// Announce search results on change.
	useEffect( () => {
		if ( ! filterValue ) {
			return;
		}
		const count = allPatterns.length;
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ filterValue, debouncedSpeak ] );

	const currentShownPatterns = useAsyncList( allPatterns, {
		step: INITIAL_INSERTER_RESULTS,
	} );

	const hasItems = !! allPatterns?.length;
	return (
		<div className="block-editor-block-patterns-explorer__list">
			{ hasItems && (
				<PatternsListHeader
					filterValue={ filterValue }
					filteredBlockPatternsLength={ allPatterns.length }
				/>
			) }
			<InserterListbox>
				{ ! hasItems && <InserterNoResults /> }
				{ hasItems && (
					<BlockPatternsList
						shownPatterns={ currentShownPatterns }
						blockPatterns={ allPatterns }
						onClickPattern={ onSelectBlockPattern }
						isDraggable={ false }
					/>
				) }
			</InserterListbox>
		</div>
	);
}

export default PatternList;
