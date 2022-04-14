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
	Inserter,
	useBlockDisplayInformation,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { pure } from '@wordpress/compose';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BlockListExplodedTopToolbar from './top-toolbar';
import { store as editSiteStore } from '../../store';

function BlockListExplodedItem( { clientId } ) {
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

	return (
		<div>
			<div
				className="edit-site-block-list-exploded__inserter"
				key={ block.clientId }
			>
				<Inserter
					clientId={ block.clientId }
					__experimentalIsQuick
					isPrimary
				/>
			</div>
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
					role="button"
					onClick={ ( event ) => {
						if ( event.detail === 1 ) {
							selectBlock( clientId );
						} else if ( event.detail === 2 ) {
							switchEditorMode( 'visual' );
						}
					} }
					onKeyPress={ () => selectBlock( clientId ) }
					aria-label={ blockLabel }
					tabIndex={ 0 }
				>
					<BlockPreview blocks={ [ block ] } />
				</div>
			</div>
		</div>
	);
}

export default pure( BlockListExplodedItem );
