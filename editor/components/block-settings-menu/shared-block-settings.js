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
import { isSharedBlock } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';

export function SharedBlockSettings( { isStaticBlock, onConvertToStatic, onConvertToShared, onDelete, itemsRole } ) {
	return (
		<Fragment>
			{ isStaticBlock && (
				<IconButton
					className="editor-block-settings-menu__control"
					icon="controls-repeat"
					onClick={ onConvertToShared }
					role={ itemsRole }
				>
					{ __( 'Convert to Shared Block' ) }
				</IconButton>
			) }
			{ ! isStaticBlock && (
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
						onClick={ onDelete }
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
		const { getBlock } = select( 'core/editor' );
		const block = getBlock( uid );
		return {
			sharedBlockId: block.attributes.ref,
			isStaticBlock: ! block || ! isSharedBlock( block ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const {
			convertBlockToShared,
			convertBlockToStatic,
			deleteSharedBlock,
		} = dispatch( 'core/editor' );
		const { uid, onToggle = noop, sharedBlockId } = ownProps;

		return {
			onConvertToStatic() {
				convertBlockToStatic( uid );
				onToggle();
			},
			onConvertToShared() {
				convertBlockToShared( uid );
				onToggle();
			},
			onDelete() {
				// TODO: Make this a <Confirm /> component or similar
				// eslint-disable-next-line no-alert
				const hasConfirmed = window.confirm( __(
					'Are you sure you want to delete this Shared Block?\n\n' +
					'It will be permanently removed from all posts and pages that use it.'
				) );

				if ( hasConfirmed ) {
					deleteSharedBlock( sharedBlockId );
					onToggle();
				}
			},
		};
	} ),
] )( SharedBlockSettings );
