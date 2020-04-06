/**
 * External dependencies
 */
import { every } from 'lodash';

/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { hasBlockSupport, isReusableBlock } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { BlockSettingsMenuControls } from '@wordpress/block-editor';

export function ReusableBlockConvertButton( {
	isVisible,
	isReusable,
	onConvertToStatic,
	onConvertToReusable,
} ) {
	if ( ! isVisible ) {
		return null;
	}

	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<>
					{ ! isReusable && (
						<MenuItem
							onClick={ () => {
								onConvertToReusable();
								onClose();
							} }
						>
							{ __( 'Add to Reusable blocks' ) }
						</MenuItem>
					) }
					{ isReusable && (
						<MenuItem
							onClick={ () => {
								onConvertToStatic();
								onClose();
							} }
						>
							{ __( 'Convert to Regular Block' ) }
						</MenuItem>
					) }
				</>
			) }
		</BlockSettingsMenuControls>
	);
}

export default compose( [
	withSelect( ( select, { clientIds } ) => {
		const { getBlocksByClientId, canInsertBlockType } = select(
			'core/block-editor'
		);
		const { __experimentalGetReusableBlock: getReusableBlock } = select(
			'core/editor'
		);
		const { canUser } = select( 'core' );

		const blocks = getBlocksByClientId( clientIds );

		const isReusable =
			blocks.length === 1 &&
			blocks[ 0 ] &&
			isReusableBlock( blocks[ 0 ] ) &&
			!! getReusableBlock( blocks[ 0 ].attributes.ref );

		// Show 'Convert to Regular Block' when selected block is a reusable block
		const isVisible =
			isReusable ||
			// Hide 'Add to Reusable blocks' when reusable blocks are disabled
			( canInsertBlockType( 'core/block' ) &&
				every(
					blocks,
					( block ) =>
						// Guard against the case where a regular block has *just* been converted
						!! block &&
						// Hide 'Add to Reusable blocks' on invalid blocks
						block.isValid &&
						// Hide 'Add to Reusable blocks' when block doesn't support being made reusable
						hasBlockSupport( block.name, 'reusable', true )
				) &&
				// Hide 'Add to Reusable blocks' when current doesn't have permission to do that
				!! canUser( 'create', 'blocks' ) );

		return {
			isReusable,
			isVisible,
		};
	} ),
	withDispatch( ( dispatch, { clientIds } ) => {
		const {
			__experimentalConvertBlockToReusable: convertBlockToReusable,
			__experimentalConvertBlockToStatic: convertBlockToStatic,
		} = dispatch( 'core/editor' );

		return {
			onConvertToStatic() {
				convertBlockToStatic( clientIds[ 0 ] );
			},
			onConvertToReusable() {
				convertBlockToReusable( clientIds );
			},
		};
	} ),
] )( ReusableBlockConvertButton );
