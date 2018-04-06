/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isSharedBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getBlock, getSharedBlock } from '../../store/selectors';
import { convertBlockToStatic, convertBlockToShared, deleteSharedBlock } from '../../store/actions';

export function SharedBlockSettings( { sharedBlock, onConvertToStatic, onConvertToShared, onDelete, itemsRole } ) {
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
				<div className="editor-block-settings-menu__section">
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
				</div>
			) }
		</Fragment>
	);
}

export default connect(
	( state, { uid } ) => {
		const block = getBlock( state, uid );
		return {
			sharedBlock: isSharedBlock( block ) ? getSharedBlock( state, block.attributes.ref ) : null,
		};
	},
	( dispatch, { uid, onToggle = noop } ) => ( {
		onConvertToStatic() {
			dispatch( convertBlockToStatic( uid ) );
			onToggle();
		},
		onConvertToShared() {
			dispatch( convertBlockToShared( uid ) );
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
				dispatch( deleteSharedBlock( id ) );
				onToggle();
			}
		},
	} )
)( SharedBlockSettings );
