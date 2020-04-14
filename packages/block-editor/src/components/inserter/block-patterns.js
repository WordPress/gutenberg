/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useCallback } from '@wordpress/element';
import { parse, cloneBlock } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { __, sprintf, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockPreview from '../block-preview';
import useAsyncList from './use-async-list';
import InserterPanel from './panel';

function BlockPattern( { pattern, onClick } ) {
	const { title, content } = pattern;
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
		>
			<div className="block-editor-inserter__patterns-item-preview">
				<BlockPreview blocks={ blocks } __experimentalPadding={ 8 } />
			</div>
			<div className="block-editor-inserter__patterns-item-title">
				{ title }
			</div>
		</div>
	);
}

function BlockPatternPlaceholder( { pattern } ) {
	const { title } = pattern;

	return (
		<div className="block-editor-inserter__patterns-item is-placeholder">
			<div className="block-editor-inserter__patterns-item-preview"></div>
			<div className="block-editor-inserter__patterns-item-title">
				{ title }
			</div>
		</div>
	);
}

function BlockPatterns( { patterns, onInsert } ) {
	const currentShownPatterns = useAsyncList( patterns );
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

	return (
		<InserterPanel title={ _x( 'All', 'patterns' ) }>
			{ patterns.map( ( pattern, index ) =>
				currentShownPatterns[ index ] === pattern ? (
					<BlockPattern
						key={ index }
						pattern={ pattern }
						onClick={ onClickPattern }
					/>
				) : (
					<BlockPatternPlaceholder
						key={ index }
						pattern={ pattern }
					/>
				)
			) }
		</InserterPanel>
	);
}

export default BlockPatterns;
