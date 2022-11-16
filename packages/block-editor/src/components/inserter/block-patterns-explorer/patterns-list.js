/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { _n, sprintf } from '@wordpress/i18n';
import { useDebounce, useAsyncList } from '@wordpress/compose';
import {
	__experimentalHeading as Heading,
	Spinner,
} from '@wordpress/components';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { usePatternsFromDirectory } from './hooks';
import BlockPatternsList from '../../block-patterns-list';
import InserterNoResults from '../no-results';
import useInsertionPoint from '../hooks/use-insertion-point';
import usePatternsState from '../hooks/use-patterns-state';
import InserterListbox from '../../inserter-listbox';

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

function PatternList( { filterValue, selectedCategory } ) {
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
	const [ allPatterns, isLoading ] = usePatternsFromDirectory( options );

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

	const hasItems = !! allPatterns.length;
	const baseCssClass = 'block-editor-block-patterns-explorer__list';
	return (
		<div className={ baseCssClass }>
			{ hasItems && (
				<PatternsListHeader
					filterValue={ filterValue }
					filteredBlockPatternsLength={ allPatterns.length }
				/>
			) }
			<InserterListbox>
				{ isLoading && (
					<div className={ `${ baseCssClass }__spinner` }>
						<Spinner />
					</div>
				) }
				{ ! isLoading && ! hasItems && <InserterNoResults /> }
				{ ! isLoading && hasItems && (
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
