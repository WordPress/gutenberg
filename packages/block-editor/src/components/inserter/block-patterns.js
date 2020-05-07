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

function BlockPatternList( { patterns, onClickPattern } ) {
	const currentShownPatterns = useAsyncList( patterns );

	return patterns.map( ( pattern, index ) =>
		currentShownPatterns[ index ] === pattern ? (
			<BlockPattern
				key={ pattern.name }
				pattern={ pattern }
				onClick={ onClickPattern }
			/>
		) : (
			<BlockPatternPlaceholder key={ pattern.name } />
		)
	);
}

function BlockPatterns( { patterns, onInsert, filterValue } ) {
	const { blockPatternCategories } = useSelect( ( select ) => {
		return {
			blockPatternCategories: select( 'core/block-editor' ).getSettings()
				.__experimentalBlockPatternCategories,
		};
	}, [] );
	const filteredPatterns = useMemo(
		() => searchItems( patterns, filterValue ),
		[ filterValue, patterns ]
	);
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
					patterns={ filteredPatterns }
					onClickPattern={ onClickPattern }
				/>
			</InserterPanel>
		) : (
			<InserterNoResults />
		);
	}

	return blockPatternCategories.map( ( patternCategory ) => (
		<InserterPanel
			key={ patternCategory.name }
			title={ patternCategory.label }
		>
			<BlockPatternList
				patterns={ patterns.filter( ( pattern ) =>
					pattern.categories.includes( patternCategory.name )
				) }
				onClickPattern={ onClickPattern }
			/>
		</InserterPanel>
	) );
}

export default BlockPatterns;
