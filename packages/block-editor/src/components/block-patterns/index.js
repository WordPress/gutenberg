/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { parse, cloneBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { __, sprintf } from '@wordpress/i18n';

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
			onClick={ () => onClick( pattern, blocks ) }
			onKeyDown={ ( event ) => {
				if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
					onClick( blocks );
				}
			} }
			tabIndex={ 0 }
		>
			<div className="block-editor-patterns__item-preview">
				<BlockPreview blocks={ blocks } autoHeight />
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
	const { createSuccessNotice } = useDispatch( 'core/notices' );
	const onClickPattern = useCallback( ( pattern, blocks ) => {
		const { index, rootClientId } = getBlockInsertionPoint();
		insertBlocks(
			map( blocks, ( block ) => cloneBlock( block ) ),
			index,
			rootClientId,
			false
		);
		createSuccessNotice(
			sprintf( __( 'Pattern "%s" inserted' ), pattern.title ),
			{
				type: 'snackbar',
			}
		);
	}, [] );

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
