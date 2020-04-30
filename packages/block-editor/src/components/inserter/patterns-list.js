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
import useAsyncList from './use-async-list';

function BlockPattern( { pattern, onClick } ) {
	const { content } = pattern;
	const blocks = useMemo( () => parse( content ), [ content ] );

	return (
		<div
			className="block-editor-inserter__patterns-item"
			role="button"
			onClick={ () => onClick( pattern, blocks ) }
			onKeyDown={ ( event ) => {
				if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
					onClick( blocks );
				}
			} }
			tabIndex={ 0 }
			aria-label={ pattern.title }
		>
			<BlockPreview blocks={ blocks } />
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

function BlockPatterns( { patterns, onSelect } ) {
	const currentShownPatterns = useAsyncList( patterns );

	return (
		!! patterns.length &&
		patterns.map( ( pattern, index ) =>
			currentShownPatterns[ index ] === pattern ? (
				<BlockPattern
					key={ pattern.name }
					pattern={ pattern }
					onClick={ onSelect }
				/>
			) : (
				<BlockPatternPlaceholder key={ pattern.name } />
			)
		)
	);
}

export default BlockPatterns;
