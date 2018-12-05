/**
 * External dependencies
 */
import { noop, every } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { hasBlockSupport, isReusableBlock } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

export function ReusableBlockConvertButton( {
	isVisible,
	isStaticBlock,
	canCreateBlocks,
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
					disabled={ ! canCreateBlocks }
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
		const {
			getBlocksByClientId,
			canInsertBlockType,
			__experimentalGetReusableBlock: getReusableBlock,
		} = select( 'core/editor' );
		const { canUser } = select( 'core' );

		const blocks = getBlocksByClientId( clientIds );

		const isVisible = (
			// Hide 'Add to Reusable Blocks' when Reusable Blocks are disabled, i.e. when
			// core/block is not in the allowed_block_types filter.
			canInsertBlockType( 'core/block' ) &&

			every( blocks, ( block ) => (
				// Guard against the case where a regular block has *just* been converted to a
				// reusable block and doesn't yet exist in the editor store.
				!! block &&
				// Only show the option to covert to reusable blocks on valid blocks.
				block.isValid &&
				// Make sure the block supports being converted into a reusable block (by default that is the case).
				hasBlockSupport( block.name, 'reusable', true )
			) )
		);

		return {
			isVisible,
			isStaticBlock: isVisible && (
				blocks.length !== 1 ||
				! isReusableBlock( blocks[ 0 ] ) ||
				! getReusableBlock( blocks[ 0 ].attributes.ref )
			),
			canCreateBlocks: canUser( 'create', 'blocks' ),
		};
	} ),
	withDispatch( ( dispatch, { clientIds, onToggle = noop } ) => {
		const {
			__experimentalConvertBlockToReusable: convertBlockToReusable,
			__experimentalConvertBlockToStatic: convertBlockToStatic,
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
