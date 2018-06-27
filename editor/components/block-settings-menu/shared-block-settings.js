/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment, compose } from '@wordpress/element';
import { IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isSharedBlock, hasBlockSupport } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';

export function SharedBlockSettings( {
	block,
	sharedBlock,
	onConvertToStatic,
	onConvertToShared,
	onDelete,
	itemsRole,
} ) {
	/**
	 * Allow blocks to indicate that they cannot be made into a shared block. This
	 * is a non-public API since the user could work around it by e.g. nesting the
	 * block within a container block and sharing the container block.
	 */
	if ( ! hasBlockSupport( block.name, '_sharing', true ) ) {
		return null;
	}

	return (
		<Fragment>
			{ ! sharedBlock && (
				<IconButton
					className="editor-block-settings-menu__control"
					icon="controls-repeat"
					onClick={ onConvertToShared }
					role={ itemsRole }
				>
					{ __( 'Convert to Shared Block' ) }
				</IconButton>
			) }
			{ sharedBlock && (
				<Fragment>
					<IconButton
						className="editor-block-settings-menu__control"
						icon="controls-repeat"
						onClick={ onConvertToStatic }
						role={ itemsRole }
					>
						{ __( 'Convert to Regular Block' ) }
					</IconButton>
					<IconButton
						className="editor-block-settings-menu__control"
						icon="no"
						disabled={ sharedBlock.isTemporary }
						onClick={ () => onDelete( sharedBlock.id ) }
						role={ itemsRole }
					>
						{ __( 'Delete Shared Block' ) }
					</IconButton>
				</Fragment>
			) }
		</Fragment>
	);
}

export default compose( [
	withSelect( ( select, { uid } ) => {
		const { getBlock, getSharedBlock } = select( 'core/editor' );
		const block = getBlock( uid );
		return {
			block,
			sharedBlock: block && isSharedBlock( block ) ? getSharedBlock( block.attributes.ref ) : null,
		};
	} ),
	withDispatch( ( dispatch, { uid, onToggle = noop } ) => {
		const {
			convertBlockToShared,
			convertBlockToStatic,
			deleteSharedBlock,
		} = dispatch( 'core/editor' );

		return {
			onConvertToStatic() {
				convertBlockToStatic( uid );
				onToggle();
			},
			onConvertToShared() {
				convertBlockToShared( uid );
				onToggle();
			},
			onDelete( id ) {
				// TODO: Make this a <Confirm /> component or similar
				// eslint-disable-next-line no-alert
				const hasConfirmed = window.confirm( __(
					'Are you sure you want to delete this Shared Block?\n\n' +
					'It will be permanently removed from all posts and pages that use it.'
				) );

				if ( hasConfirmed ) {
					deleteSharedBlock( id );
					onToggle();
				}
			},
		};
	} ),
] )( SharedBlockSettings );
