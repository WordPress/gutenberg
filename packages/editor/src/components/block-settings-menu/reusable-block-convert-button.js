/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isReusableBlock } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

export function ReusableBlockConvertButton( {
	isVisible,
	isStaticBlock,
	onConvertToStatic,
	onConvertToReusable,
} ) {
	if ( ! isVisible ) {
		return null;
	}

	return (
		<Fragment>
			{ isStaticBlock && (
				<MenuItem
					className="editor-block-settings-menu__control"
					icon="controls-repeat"
					onClick={ onConvertToReusable }
				>
					{ __( 'Add to Reusable Blocks' ) }
				</MenuItem>
			) }
			{ ! isStaticBlock && (
				<MenuItem
					className="editor-block-settings-menu__control"
					icon="controls-repeat"
					onClick={ onConvertToStatic }
				>
					{ __( 'Convert to Regular Block' ) }
				</MenuItem>
			) }
		</Fragment>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlock, getReusableBlock } = select( 'core/editor' );
		const { getFallbackBlockName } = select( 'core/blocks' );

		const block = getBlock( clientId );
		if ( ! block ) {
			return { isVisible: false };
		}

		return {
			// Hide 'Add to Reusable Blocks' on Classic blocks. Showing it causes a
			// confusing UX, because of its similarity to the 'Convert to Blocks' button.
			isVisible: block.name !== getFallbackBlockName(),
			isStaticBlock: ! isReusableBlock( block ) || ! getReusableBlock( block.attributes.ref ),
		};
	} ),
	withDispatch( ( dispatch, { clientId, onToggle = noop } ) => {
		const {
			convertBlockToReusable,
			convertBlockToStatic,
		} = dispatch( 'core/editor' );

		return {
			onConvertToStatic() {
				convertBlockToStatic( clientId );
				onToggle();
			},
			onConvertToReusable() {
				convertBlockToReusable( clientId );
				onToggle();
			},
		};
	} ),
] )( ReusableBlockConvertButton );
