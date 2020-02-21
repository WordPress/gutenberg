/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { ENTER, SPACE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';

function BlockPattern( { pattern, onClick } ) {
	const { title, content } = pattern;
	const blocks = useMemo( () => parse( content ), [ content ] );

	return (
		<div
			className="block-editor-patterns__item"
			role="button"
			onClick={ () => onClick( blocks ) }
			onKeyDown={ ( event ) => {
				if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
					onClick( blocks );
				}
			} }
			tabIndex={ 0 }
		>
			<div className="block-editor-patterns__item-preview">
				<BlockPreview blocks={ blocks } />
			</div>
			<div className="block-editor-patterns__item-title">{ title }</div>
		</div>
	);
}

function BlockPatterns( { patterns } ) {
	const getBlockInsertionPoint = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getBlockInsertionPoint;
	} );
	const { insertBlocks } = useDispatch( 'core/block-editor' );
	const onClickPattern = useCallback( ( blocks ) => {
		const { index, rootClientId } = getBlockInsertionPoint();
		insertBlocks( blocks, index, rootClientId );
	} );

	return (
		<div className="block-editor-patterns">
			{ patterns.map( ( pattern, index ) => (
				<BlockPattern
					key={ index }
					pattern={ pattern }
					onClick={ onClickPattern }
				/>
			) ) }
		</div>
	);
}

export default BlockPatterns;
