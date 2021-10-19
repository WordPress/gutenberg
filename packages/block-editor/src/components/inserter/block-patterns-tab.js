/**
 * WordPress dependencies
 */
import { useMemo, useState, useCallback } from '@wordpress/element';
import { _x } from '@wordpress/i18n';
import { useAsyncList } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PatternInserterPanel from './pattern-panel';
import usePatternsState from './hooks/use-patterns-state';
import BlockPatternList from '../block-patterns-list';
import PatternsExplorer from './block-patterns-explorer/explorer';

function BlockPatternsCategory( {
	rootClientId,
	onInsert,
	selectedCategory,
	onClickCategory,
} ) {
	const [ showPatternsExplorer, setShowPatternsExplorer ] = useState( false );
	const [ allPatterns, allCategories, onClick ] = usePatternsState(
		onInsert,
		rootClientId
	);

	const hasRegisteredCategory = useCallback(
		( pattern ) => {
			if ( ! pattern.categories || ! pattern.categories.length ) {
				return false;
			}

			return pattern.categories.some( ( cat ) =>
				allCategories.some( ( category ) => category.name === cat )
			);
		},
		[ allCategories ]
	);

	// Remove any empty categories
	const populatedCategories = useMemo( () => {
		const categories = allCategories
			.filter( ( category ) =>
				allPatterns.some( ( pattern ) =>
					pattern.categories?.includes( category.name )
				)
			)
			.sort( ( { name: currentName }, { name: nextName } ) => {
				if ( ! [ currentName, nextName ].includes( 'featured' ) ) {
					return 0;
				}
				return currentName === 'featured' ? -1 : 1;
			} );

		if (
			allPatterns.some(
				( pattern ) => ! hasRegisteredCategory( pattern )
			) &&
			! categories.find(
				( category ) => category.name === 'uncategorized'
			)
		) {
			categories.push( {
				name: 'uncategorized',
				label: _x( 'Uncategorized' ),
			} );
		}

		return categories;
	}, [ allPatterns, allCategories ] );

	const patternCategory = selectedCategory
		? selectedCategory
		: populatedCategories[ 0 ];

	const getPatternIndex = useCallback(
		( pattern ) => {
			if ( ! pattern.categories?.length ) {
				return Infinity;
			}
			const indexedCategories = populatedCategories.reduce(
				( accumulator, { name }, index ) => {
					accumulator[ name ] = index;
					return accumulator;
				},
				{}
			);
			return Math.min(
				...pattern.categories.map( ( cat ) =>
					indexedCategories[ cat ] !== undefined
						? indexedCategories[ cat ]
						: Infinity
				)
			);
		},
		[ populatedCategories ]
	);

	const currentCategoryPatterns = useMemo(
		() =>
			allPatterns.filter( ( pattern ) =>
				patternCategory.name === 'uncategorized'
					? getPatternIndex( pattern ) === Infinity
					: pattern.categories?.includes( patternCategory.name )
			),
		[ allPatterns, patternCategory ]
	);

	// Ordering the patterns is important for the async rendering.
	const orderedPatterns = useMemo( () => {
		return currentCategoryPatterns.sort( ( a, b ) => {
			return getPatternIndex( a ) - getPatternIndex( b );
		} );
	}, [ currentCategoryPatterns, getPatternIndex ] );

	const currentShownPatterns = useAsyncList( orderedPatterns );

	if ( ! currentCategoryPatterns.length ) {
		return null;
	}

	const patternListProps = {
		shownPatterns: currentShownPatterns,
		blockPatterns: currentCategoryPatterns,
		onClickPattern: onClick,
		label: patternCategory.label,
		orientation: ! showPatternsExplorer ? 'vertical' : undefined,
		isDraggable: ! showPatternsExplorer,
	};
	const blockPatternList = <BlockPatternList { ...patternListProps } />;
	return (
		<>
			{ ! showPatternsExplorer && (
				<PatternInserterPanel
					selectedCategory={ patternCategory }
					patternCategories={ populatedCategories }
					onClickCategory={ onClickCategory }
					onShowExplorer={ () => setShowPatternsExplorer( true ) }
				>
					{ blockPatternList }
				</PatternInserterPanel>
			) }
			{ showPatternsExplorer && (
				<PatternsExplorer
					selectedCategory={ patternCategory }
					patternCategories={ populatedCategories }
					onClickCategory={ onClickCategory }
					onModalClose={ () => setShowPatternsExplorer( false ) }
				>
					{ blockPatternList }
				</PatternsExplorer>
			) }
		</>
	);
}

function BlockPatternsTabs( {
	rootClientId,
	onInsert,
	onClickCategory,
	selectedCategory,
} ) {
	return (
		<BlockPatternsCategory
			rootClientId={ rootClientId }
			selectedCategory={ selectedCategory }
			onInsert={ onInsert }
			onClickCategory={ onClickCategory }
		/>
	);
}

export default BlockPatternsTabs;
