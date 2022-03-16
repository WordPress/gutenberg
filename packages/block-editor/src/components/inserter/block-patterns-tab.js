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
import PatternsExplorerModal from './block-patterns-explorer/explorer';

function BlockPatternsCategory( {
	rootClientId,
	onInsert,
	selectedCategory,
	populatedCategories,
} ) {
	const [ allPatterns, , onClick ] = usePatternsState(
		onInsert,
		rootClientId
	);

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
				selectedCategory.name === 'uncategorized'
					? getPatternIndex( pattern ) === Infinity
					: pattern.categories?.includes( selectedCategory.name )
			),
		[ allPatterns, selectedCategory ]
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

	return (
		<div className="block-editor-inserter__panel-content">
			<BlockPatternList
				shownPatterns={ currentShownPatterns }
				blockPatterns={ currentCategoryPatterns }
				onClickPattern={ onClick }
				label={ selectedCategory.label }
				orientation="vertical"
				isDraggable
			/>
		</div>
	);
}

function BlockPatternsTabs( {
	rootClientId,
	onInsert,
	onClickCategory,
	selectedCategory,
} ) {
	const [ showPatternsExplorer, setShowPatternsExplorer ] = useState( false );
	const [ allPatterns, allCategories ] = usePatternsState();

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

	// Remove any empty categories.
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

	return (
		<>
			<PatternInserterPanel
				selectedCategory={ patternCategory }
				patternCategories={ populatedCategories }
				onClickCategory={ onClickCategory }
				openPatternExplorer={ () => setShowPatternsExplorer( true ) }
			/>
			{ ! showPatternsExplorer && (
				<BlockPatternsCategory
					rootClientId={ rootClientId }
					onInsert={ onInsert }
					selectedCategory={ patternCategory }
					populatedCategories={ populatedCategories }
				/>
			) }
			{ showPatternsExplorer && (
				<PatternsExplorerModal
					initialCategory={ patternCategory }
					patternCategories={ populatedCategories }
					onModalClose={ () => setShowPatternsExplorer( false ) }
				/>
			) }
		</>
	);
}

export default BlockPatternsTabs;
