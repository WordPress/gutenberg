/**
 * External dependencies
 */
import { fromPairs } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { __, _x } from '@wordpress/i18n';
import { useAsyncList } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';
import InserterPanel from './panel';
import { searchItems } from './search-items';
import InserterNoResults from './no-results';
import usePatternsState from './hooks/use-patterns-state';

function BlockPattern( { pattern, onClick } ) {
	const { content, viewportWidth } = pattern;
	const blocks = useMemo( () => parse( content ), [ content ] );

	return (
		<div
			className="block-editor-inserter__patterns-item"
			role="button"
			onClick={ () => onClick( pattern, blocks ) }
			onKeyDown={ ( event ) => {
				if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
					onClick( pattern, blocks );
				}
			} }
			tabIndex={ 0 }
			aria-label={ pattern.title }
		>
			<BlockPreview blocks={ blocks } viewportWidth={ viewportWidth } />
			<div className="block-editor-inserter__patterns-item-title">
				{ pattern.title }
			</div>
		</div>
	);
}

function BlockPatternPlaceholder() {
	return (
		<div className="block-editor-inserter__patterns-item is-placeholder" />
	);
}

function BlockPatternList( { patterns, shownPatterns, onClickPattern } ) {
	return patterns.map( ( pattern ) => {
		const isShown = shownPatterns.includes( pattern );
		return isShown ? (
			<BlockPattern
				key={ pattern.name }
				pattern={ pattern }
				onClick={ onClickPattern }
			/>
		) : (
			<BlockPatternPlaceholder key={ pattern.name } />
		);
	} );
}

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
					patterns={ filteredPatterns }
					onClickPattern={ onClick }
				/>
			</InserterPanel>
		) : (
			<InserterNoResults />
		);
	}
}

function BlockPatternsPerCategories( { onInsert } ) {
	const [ patterns, categories, onClick ] = usePatternsState( onInsert );

	const getPatternIndex = useCallback(
		( pattern ) => {
			if ( ! pattern.categories || ! pattern.categories.length ) {
				return Infinity;
			}
			const indexedCategories = fromPairs(
				categories.map( ( { name }, index ) => [ name, index ] )
			);
			return Math.min(
				...pattern.categories.map( ( category ) =>
					indexedCategories[ category ] !== undefined
						? indexedCategories[ category ]
						: Infinity
				)
			);
		},
		[ categories ]
	);

	// Ordering the patterns per category is important for the async rendering.
	const orderedPatterns = useMemo( () => {
		return patterns.sort( ( a, b ) => {
			return getPatternIndex( a ) - getPatternIndex( b );
		} );
	}, [ patterns, getPatternIndex ] );

	const currentShownPatterns = useAsyncList( orderedPatterns );

	// Uncategorized Patterns
	const uncategorizedPatterns = useMemo(
		() =>
			patterns.filter(
				( pattern ) => getPatternIndex( pattern ) === Infinity
			),
		[ patterns, getPatternIndex ]
	);

	return (
		<>
			{ categories.map( ( patternCategory ) => {
				const categoryPatterns = patterns.filter(
					( pattern ) =>
						pattern.categories &&
						pattern.categories.includes( patternCategory.name )
				);
				return (
					!! categoryPatterns.length && (
						<InserterPanel
							key={ patternCategory.name }
							title={ patternCategory.label }
						>
							<BlockPatternList
								shownPatterns={ currentShownPatterns }
								patterns={ categoryPatterns }
								onClickPattern={ onClick }
							/>
						</InserterPanel>
					)
				);
			} ) }

			{ !! uncategorizedPatterns.length && (
				<InserterPanel title={ _x( 'Uncategorized' ) }>
					<BlockPatternList
						shownPatterns={ currentShownPatterns }
						patterns={ uncategorizedPatterns }
						onClickPattern={ onClick }
					/>
				</InserterPanel>
			) }
		</>
	);
}

function BlockPatterns( { onInsert, filterValue } ) {
	return filterValue ? (
		<BlockPatternsSearchResults
			onInsert={ onInsert }
			filterValue={ filterValue }
		/>
	) : (
		<BlockPatternsPerCategories onInsert={ onInsert } />
	);
}

export default BlockPatterns;
