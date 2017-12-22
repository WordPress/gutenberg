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
import { getBlock } from '../../store/selectors';
import { convertBlockToStatic, convertBlockToReusable, deleteReusableBlock } from '../../store/actions';

export function ReusableBlockSettings( { block, onConvertToStatic, onConvertToReusable, onDelete } ) {
	const isReusable = isReusableBlock( block );

	return (
		<Fragment>
			{ ! isReusable && (
				<IconButton
					className="editor-block-settings-menu__control"
					icon="controls-repeat"
					onClick={ onConvertToReusable }
				>
					{ __( 'Convert to Reusable Block' ) }
				</IconButton>
			) }
			{ isReusable && (
				<div className="editor-block-settings-menu__section">
					<IconButton
						className="editor-block-settings-menu__control"
						icon="controls-repeat"
						onClick={ onConvertToStatic }
					>
						{ __( 'Detach from Reusable Block' ) }
					</IconButton>
					<IconButton
						className="editor-block-settings-menu__control"
						icon="no"
						onClick={ () => onDelete( block.attributes.ref ) }
					>
						{ __( 'Delete Reusable Block' ) }
					</IconButton>
				</div>
			) }
		</Fragment>
	);
}

export default connect(
	( state, { uid } ) => {
		return {
			block: getBlock( state, uid ),
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
			if ( window.confirm( __( 'Are you sure you want to permanently delete this Reusable Block?' ) ) ) {
				dispatch( deleteReusableBlock( id ) );
				onToggle();
			}
		},
	} )
)( ReusableBlockSettings );
