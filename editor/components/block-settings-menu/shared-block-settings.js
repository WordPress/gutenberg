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

export function SharedBlockSettings( { sharedBlock, onConvertToStatic, onConvertToShared, itemsRole } ) {
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
				<IconButton
					className="editor-block-settings-menu__control"
					icon="controls-repeat"
					onClick={ onConvertToStatic }
					role={ itemsRole }
				>
					{ __( 'Convert to Regular Block' ) }
				</IconButton>
			) }
		</Fragment>
	);
}

export default compose( [
	withSelect( ( select, { uid } ) => {
		const { getBlock, getSharedBlock } = select( 'core/editor' );
		const block = getBlock( uid );
		return {
			sharedBlock: block && isSharedBlock( block ) ? getSharedBlock( block.attributes.ref ) : null,
		};
	} ),
	withDispatch( ( dispatch, { uid, onToggle = noop } ) => {
		const {
			convertBlockToShared,
			convertBlockToStatic,
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
		};
	} ),
] )( SharedBlockSettings );
