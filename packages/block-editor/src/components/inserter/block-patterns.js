/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { parse, cloneBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';
import useAsyncList from './use-async-list';
import InserterPanel from './panel';
import { searchItems } from './search-items';
import InserterNoResults from './no-results';

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

function BlockPatternList( { patterns, showPatterns, onClickPattern } ) {
	return patterns.map( ( pattern ) => {
		const isShown = showPatterns.includes( pattern );
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

function BlockPatterns( { onInsert, filterValue } ) {
	const { blockPatternCategories, patterns } = useSelect( ( select ) => {
		return {
			patterns: select( 'core/block-editor' ).getSettings()
				.__experimentalBlockPatterns,
			blockPatternCategories: select( 'core/block-editor' ).getSettings()
				.__experimentalBlockPatternCategories,
		};
	}, [] );
	const filteredPatterns = useMemo(
		() => searchItems( patterns, filterValue ),
		[ filterValue, patterns ]
	);
	// Ordering the patterns per category is important for the async rendering.
	const orderedPatterns = useMemo( () => {
		const indexedCategories = {};
		blockPatternCategories.forEach( ( category, index ) => {
			indexedCategories[ category.name ] = index;
		} );
		const getPatternIndex = ( pattern ) => {
			if ( ! pattern.categories || ! pattern.categories.length ) {
				return Infinity;
			}
			return Math.min(
				...pattern.categories.map(
					( category ) => indexedCategories[ category ]
				)
			);
		};
		return filteredPatterns.sort( ( a, b ) => {
			return getPatternIndex( a ) - getPatternIndex( b );
		} );
	}, [ filterValue, blockPatternCategories ] );
	const currentShownPatterns = useAsyncList( orderedPatterns );
	const { createSuccessNotice } = useDispatch( 'core/notices' );
	const onClickPattern = useCallback( ( pattern, blocks ) => {
		onInsert( map( blocks, ( block ) => cloneBlock( block ) ) );
		createSuccessNotice(
			sprintf(
				/* translators: %s: block pattern title. */
				__( 'Pattern "%s" inserted.' ),
				pattern.title
			),
			{
				type: 'snackbar',
			}
		);
	}, [] );

	if ( filterValue ) {
		return !! filteredPatterns.length ? (
			<InserterPanel title={ __( 'Search Results' ) }>
				<BlockPatternList
					showPatterns={ currentShownPatterns }
					patterns={ filteredPatterns }
					onClickPattern={ onClickPattern }
				/>
			</InserterPanel>
		) : (
			<InserterNoResults />
		);
	}

	return blockPatternCategories.map( ( patternCategory ) => {
		const categoryPatterns = patterns.filter( ( pattern ) =>
			pattern.categories.includes( patternCategory.name )
		);
		return (
			!! categoryPatterns.length && (
				<InserterPanel
					key={ patternCategory.name }
					title={ patternCategory.label }
				>
					<BlockPatternList
						showPatterns={ currentShownPatterns }
						patterns={ categoryPatterns }
						onClickPattern={ onClickPattern }
					/>
				</InserterPanel>
			)
		);
	} );
}

export default BlockPatterns;
