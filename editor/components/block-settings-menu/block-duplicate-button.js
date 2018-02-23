/**
 * External dependencies
 */
import { flow, noop, last, every } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withContext } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { cloneBlock, getBlockType } from '@wordpress/blocks';

export function BlockDuplicateButton( { blocks, onDuplicate, onClick = noop, isLocked, small = false } ) {
	const canDuplicate = every( blocks, block => {
		const type = getBlockType( block.name );
		return ! type.useOnce;
	} );
	if ( isLocked || ! canDuplicate ) {
		return null;
	}

	const label = __( 'Duplicate' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ flow( onDuplicate, onClick ) }
			icon="admin-page"
			label={ small ? label : undefined }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default compose(
	withSelect( ( select, { uids, rootUID } ) => ( {
		blocks: select( 'core/editor' ).getBlocksByUID( uids ),
		index: select( 'core/editor' ).getBlockIndex( last( uids ), rootUID ),
	} ) ),
	withDispatch( ( dispatch, { blocks, index, rootUID } ) => ( {
		onDuplicate() {
			dispatch( 'core/editor' ).insertBlocks(
				blocks.map( block => cloneBlock( block ) ),
				index + 1,
				rootUID
			);
		},
	} ) ),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: !! templateLock,
		};
	} ),
)( BlockDuplicateButton );
