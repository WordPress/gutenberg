/**
 * External dependencies
 */
import { fromPairs } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback, useState, useEffect } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
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
	const [ allPatterns, , onClick ] = usePatternsState( onInsert, 'all' );

	const [ currentfilteredPatterns, setfilteredPatterns ] = useState( [] );

	useEffect( () => {
		setfilteredPatterns( searchItems( allPatterns, filterValue ) );
	}, [ allPatterns, filterValue ] );

	const currentShownPatterns = useAsyncList( currentfilteredPatterns );

	if ( filterValue ) {
		return !! currentfilteredPatterns.length ? (
			<InserterPanel title={ __( 'Search Results' ) }>
				<BlockPatternList
					shownPatterns={ currentShownPatterns }
					blockPatterns={ currentfilteredPatterns }
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
	const [ allPatterns, allCategories, onClick ] = usePatternsState(
		onInsert,
		selectedCategory
	);

	const [ currentCategoryPatterns, setCategoryPatterns ] = useState( [] );

	const patternCategory = selectedCategory
		? selectedCategory
		: allCategories[ 0 ];

	useEffect( () => {
		setCategoryPatterns(
			allPatterns.filter( ( pattern ) => {
				return patternCategory.name === 'uncategorized'
					? getPatternIndex( pattern ) === Infinity
					: pattern.categories &&
							pattern.categories.includes( patternCategory.name );
			} )
		);
	}, [ selectedCategory ] );

	useEffect( () => {
		if (
			allPatterns.some(
				( pattern ) => getPatternIndex( pattern ) === Infinity
			)
		) {
			allCategories.push( {
				name: 'uncategorized',
				label: _x( 'Uncategorized' ),
			} );
		}
	}, [ allCategories, allPatterns ] );

	const getPatternIndex = useCallback(
		( pattern ) => {
			if ( ! pattern.categories || ! pattern.categories.length ) {
				return Infinity;
			}
			const indexedCategories = fromPairs(
				allCategories.map( ( { name }, index ) => [ name, index ] )
			);
			return Math.min(
				...pattern.categories.map( ( cat ) =>
					indexedCategories[ cat ] !== undefined
						? indexedCategories[ cat ]
						: Infinity
				)
			);
		},
		[ allCategories ]
	);

	// Ordering the patterns is important for the async rendering.
	const orderedPatterns = useMemo( () => {
		return currentCategoryPatterns.sort( ( a, b ) => {
			return getPatternIndex( a ) - getPatternIndex( b );
		} );
	}, [ currentCategoryPatterns, getPatternIndex ] );

	const currentShownPatterns = useAsyncList( orderedPatterns );

	return (
		<>
			{ !! currentCategoryPatterns.length && (
				<PatternInserterPanel
					key={ patternCategory.name }
					title={ patternCategory.title }
					selectedCategory={ patternCategory }
					patternCategories={ allCategories }
					onClickCategory={ onClickCategory }
				>
					<BlockPatternList
						shownPatterns={ currentShownPatterns }
						blockPatterns={ currentCategoryPatterns }
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
