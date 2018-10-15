/**
 * External dependencies
 */
import { noop, every, map } from 'lodash';

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
	withSelect( ( select, { clientIds } ) => {
		const { getBlock, getReusableBlock } = select( 'core/editor' );
		const {
			getFreeformFallbackBlockName,
			getUnregisteredFallbackBlockName,
		} = select( 'core/blocks' );

		const blocks = map( clientIds, ( clientId ) => getBlock( clientId ) );

		// Hide 'Add to Reusable Blocks' on Classic blocks. Showing it causes a
		// confusing UX, because of its similarity to the 'Convert to Blocks' button.
		const isVisible = (
			every( blocks, ( block ) => !! block ) &&
			( blocks.length !== 1 || (
				blocks[ 0 ].name !== getFreeformFallbackBlockName() &&
				blocks[ 0 ].name !== getUnregisteredFallbackBlockName()
			) )
		);

		return {
			isStaticBlock: isVisible && (
				blocks.length !== 1 ||
				! isReusableBlock( blocks[ 0 ] ) ||
				! getReusableBlock( blocks[ 0 ].attributes.ref )
			),
			isVisible,
		};
	} ),
	withDispatch( ( dispatch, { clientIds, onToggle = noop } ) => {
		const {
			convertBlockToReusable,
			convertBlockToStatic,
		} = dispatch( 'core/editor' );

		return {
			onConvertToStatic() {
				if ( clientIds.length !== 1 ) {
					return;
				}
				convertBlockToStatic( clientIds[ 0 ] );
				onToggle();
			},
			onConvertToReusable() {
				convertBlockToReusable( clientIds );
				onToggle();
			},
		};
	} ),
] )( ReusableBlockConvertButton );
