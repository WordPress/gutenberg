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
import { isReusableBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getBlock, getReusableBlock } from '../../store/selectors';
import { convertBlockToStatic, convertBlockToReusable, deleteReusableBlock } from '../../store/actions';

export function ReusableBlockSettings( { reusableBlock, onConvertToStatic, onConvertToReusable, onDelete, itemsRole } ) {
	return (
		<Fragment>
			{ ! reusableBlock && (
				<IconButton
					className="editor-block-settings-menu__control"
					icon="controls-repeat"
					onClick={ onConvertToReusable }
					role={ itemsRole }
				>
					{ __( 'Convert to Shared Block' ) }
				</IconButton>
			) }
			{ reusableBlock && (
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
						disabled={ reusableBlock.isTemporary }
						onClick={ () => onDelete( reusableBlock.id ) }
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
			reusableBlock: isReusableBlock( block ) ? getReusableBlock( state, block.attributes.ref ) : null,
		};
	},
	( dispatch, { uid, onToggle = noop } ) => ( {
		onConvertToStatic() {
			dispatch( convertBlockToStatic( uid ) );
			onToggle();
		},
		onConvertToReusable() {
			dispatch( convertBlockToReusable( uid ) );
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
				dispatch( deleteReusableBlock( id ) );
				onToggle();
			}
		},
	} )
)( ReusableBlockSettings );
