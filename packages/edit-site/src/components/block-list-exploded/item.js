/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	store as blockEditorStore,
	BlockPreview,
	useBlockDisplayInformation,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { pure } from '@wordpress/compose';
import { sprintf, __ } from '@wordpress/i18n';
import { useMemo, useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockListExplodedTopToolbar from './top-toolbar';
import { store as editSiteStore } from '../../store';

function BlockListExplodedItem( { clientId } ) {
	const blockWrapper = useRef();
	const { block, isSelected } = useSelect(
		( select ) => {
			const { getBlock, isBlockSelected } = select( blockEditorStore );
			return {
				block: getBlock( clientId ),
				isSelected: isBlockSelected( clientId ),
			};
		},
		[ clientId ]
	);
	const { title } = useBlockDisplayInformation( clientId );
	const { selectBlock } = useDispatch( blockEditorStore );
	// If the exploded list becomes part of block-editor
	// This mode also need to move into the block-editor store.
	const { switchEditorMode } = useDispatch( editSiteStore );

	// translators: %s: Type of block (i.e. Text, Image etc)
	const blockLabel = sprintf( __( 'Block: %s' ), title );
	const blocksToPreview = useMemo( () => [ block ], [ block ] );

	useEffect( () => {
		if ( isSelected ) {
			blockWrapper.current.focus();
		}
	}, [ isSelected ] );

	return (
		<div
			className={ classnames(
				'edit-site-block-list-exploded__item-container',
				{ 'is-selected': isSelected }
			) }
		>
			{ isSelected && (
				<BlockListExplodedTopToolbar clientId={ clientId } />
			) }
			<div
				ref={ blockWrapper }
				role="button"
				onClick={ ( event ) => {
					const isFirstClick = event.detail === 1;
					const isDoubleClick = event.detail === 2;
					if ( isFirstClick ) {
						selectBlock( clientId );
					} else if ( isDoubleClick ) {
						switchEditorMode( 'visual' );
					}
				} }
				onKeyPress={ () => selectBlock( clientId ) }
				onFocus={ () => selectBlock( clientId ) }
				aria-label={ blockLabel }
				tabIndex={ 0 }
			>
				<BlockPreview
					blocks={ blocksToPreview }
					__experimentalScale={ 0.8 }
				/>
			</div>
		</div>
	);
}

export default pure( BlockListExplodedItem );
