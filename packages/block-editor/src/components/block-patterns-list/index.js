/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { ENTER, SPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';

function BlockPattern( { pattern, onClick } ) {
	const { content, viewportWidth } = pattern;
	const blocks = useMemo( () => parse( content ), [ content ] );

	return (
		<div
			className="block-editor-block-patterns-list__item"
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
			<div className="block-editor-block-patterns-list__item-title">
				{ pattern.title }
			</div>
		</div>
	);
}

function BlockPatternPlaceholder() {
	return (
		<div className="block-editor-block-patterns-list__item is-placeholder" />
	);
}

function BlockPatternList( { blockPatterns, shownPatterns, onClickPattern } ) {
	return blockPatterns.map( ( pattern ) => {
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

export default BlockPatternList;
