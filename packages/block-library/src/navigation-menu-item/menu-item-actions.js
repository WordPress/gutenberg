/**
 * WordPress dependencies
 */
import {
	MenuItem,
	NavigableMenu,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

function MenuItemActions( {
	destination,
	moveLeft,
	moveRight,
	moveToEnd,
	moveToStart,
	onEditLableClicked,
	remove,
} ) {
	return (
		<NavigableMenu>
			<MenuItem
				icon="admin-links"
			>
				{ destination }
			</MenuItem>
			<MenuItem
				onClick={ onEditLableClicked }
				icon="edit"
			>
				{ __( 'Edit label text' ) }
			</MenuItem>
			<div className="wp-block-navigation-menu-item__separator" />
			<MenuItem
				onClick={ moveToStart }
				icon="arrow-up-alt2"
			>
				{ __( 'Move to start' ) }
			</MenuItem>
			<MenuItem
				onClick={ moveLeft }
				icon="arrow-left-alt2"
			>
				{ __( 'Move left' ) }
			</MenuItem>
			<MenuItem
				onClick={ moveRight }
				icon="arrow-right-alt2"
			>
				{ __( 'Move right' ) }
			</MenuItem>
			<MenuItem
				onClick={ moveToEnd }
				icon="arrow-down-alt2"
			>
				{ __( 'Move to end' ) }
			</MenuItem>
			<MenuItem
				icon="arrow-left-alt2"
			>
				{ __( 'Nest underneath…' ) }
			</MenuItem>
			<div className="navigation-menu-item__separator" />
			<MenuItem
				onClick={ remove }
				icon="trash"
			>
				{ __( 'Remove from menu' ) }
			</MenuItem>
		</NavigableMenu>
	);
}

export default compose( [
	withDispatch( ( dispatch, { clientId }, { select } ) => {
		const {
			getBlockOrder,
			getBlockRootClientId,
		} = select( 'core/block-editor' );
		const parentID = getBlockRootClientId( clientId );
		const {
			moveBlocksDown,
			moveBlocksUp,
			moveBlockToPosition,
			removeBlocks,
		} = dispatch( 'core/block-editor' );
		return {
			moveToStart() {
				moveBlockToPosition( clientId, parentID, parentID, 0 );
			},
			moveRight() {
				moveBlocksDown( clientId, parentID );
			},
			moveLeft() {
				moveBlocksUp( clientId, parentID );
			},
			moveToEnd() {
				moveBlockToPosition(
					clientId,
					parentID,
					parentID,
					getBlockOrder( parentID ).length - 1
				);
			},
			remove() {
				removeBlocks( clientId );
			},
		};
	} ),
] )( MenuItemActions );
