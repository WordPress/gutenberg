/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useAsyncList } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import InserterPanel from './panel';
import PatternInserterPanel from './pattern-panel';
import { searchItems } from './search-items';
import InserterNoResults from './no-results';
import usePatternsState from './hooks/use-patterns-state';
import BlockPatternList from '../block-patterns-list';

function BlockPatternsSearchResults( { filterValue, onInsert } ) {
	const [ patterns, , onClick ] = usePatternsState( onInsert );
	const currentShownPatterns = useAsyncList( patterns );

	const filteredPatterns = useMemo(
		() => searchItems( patterns, filterValue ),
		[ filterValue, patterns ]
	);

	if ( filterValue ) {
		return !! filteredPatterns.length ? (
			<InserterPanel title={ __( 'Search Results' ) }>
				<BlockPatternList
					shownPatterns={ currentShownPatterns }
					blockPatterns={ filteredPatterns }
					onClickPattern={ onClick }
				/>
			</InserterPanel>
		) : (
			<InserterNoResults />
		);
	}
}

function BlockPatternsCategory( {
	selectedCategory,
	onClickCategory,
	onInsert,
} ) {
	const [ patterns, categories, onClick ] = usePatternsState( onInsert );
	const category = selectedCategory ? selectedCategory : categories[ 0 ];
	const categoryPatterns = patterns.filter(
		( pattern ) =>
			pattern.categories && pattern.categories.includes( category.name )
	);

	return (
		<>
			{ !! categoryPatterns.length && (
				<PatternInserterPanel
					key={ category.name }
					title={ category.title }
					selectedCategory={ category }
					patternCategories={ categories }
					onClickCategory={ onClickCategory }
				>
					<BlockPatternList
						shownPatterns={ categoryPatterns }
						blockPatterns={ categoryPatterns }
						onClickPattern={ onClick }
					/>
				</PatternInserterPanel>
			) }
		</>
	);
}

function BlockPatternsTabs( {
	onInsert,
	onClickCategory,
	filterValue,
	selectedCategory,
} ) {
	return filterValue ? (
		<BlockPatternsSearchResults
			onInsert={ onInsert }
			filterValue={ filterValue }
		/>
	) : (
		<BlockPatternsCategory
			selectedCategory={ selectedCategory }
			onInsert={ onInsert }
			onClickCategory={ onClickCategory }
		/>
	);
}

export default BlockPatternsTabs;
