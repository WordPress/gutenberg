/**
 * External dependencies
 */
import { flow, noop, last, every, first, castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { cloneBlock, hasBlockSupport } from '@wordpress/blocks';

export function BlockDuplicateButton( { blocks, onDuplicate, onClick = noop, isLocked, small = false, role } ) {
	const canDuplicate = every( blocks, ( block ) => {
		return hasBlockSupport( block.name, 'multiple', true );
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
			role={ role }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default compose(
	withSelect( ( select, { clientIds, rootClientId } ) => {
		const {
			getBlocksByClientId,
			getBlockIndex,
			getTemplateLock,
		} = select( 'core/editor' );

		return {
			blocks: getBlocksByClientId( clientIds ),
			index: getBlockIndex( last( castArray( clientIds ) ), rootClientId ),
			isLocked: !! getTemplateLock( rootClientId ),
		};
	} ),
	withDispatch( ( dispatch, { blocks, index, rootClientId } ) => ( {
		onDuplicate() {
			const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );
			dispatch( 'core/editor' ).insertBlocks(
				clonedBlocks,
				index + 1,
				rootClientId
			);
			if ( clonedBlocks.length > 1 ) {
				dispatch( 'core/editor' ).multiSelect(
					first( clonedBlocks ).clientId,
					last( clonedBlocks ).clientId
				);
			}
		},
	} ) ),
)( BlockDuplicateButton );
