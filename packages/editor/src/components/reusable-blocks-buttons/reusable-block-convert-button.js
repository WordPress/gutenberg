/**
 * WordPress dependencies
 */
import { hasBlockSupport, isReusableBlock } from '@wordpress/blocks';
import { BlockSettingsMenuControls } from '@wordpress/block-editor';
import { MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Menu controls to convert block(s) to reusable block or vice-versa.
 *
 * @param {Object}   props           Component props.
 * @param {string[]} props.clientIds Client ids of selected blocks.
 *
 * @return {import('@wordpress/element').WPComponent} The menu controls or null.
 */
export default function ReusableBlockConvertButton( { clientIds } ) {
	const { isReusable, isVisible } = useSelect(
		( select ) => {
			const { canUser } = select( 'core' );
			const { getBlocksByClientId, canInsertBlockType } = select(
				'core/block-editor'
			);
			const { __experimentalGetReusableBlock: getReusableBlock } = select(
				'core/editor'
			);

			const blocks = getBlocksByClientId( clientIds ) ?? [];

			const _isReusable =
				blocks.length === 1 &&
				blocks[ 0 ] &&
				isReusableBlock( blocks[ 0 ] ) &&
				!! getReusableBlock( blocks[ 0 ].attributes.ref );

			// Show 'Convert to Regular Block' when selected block is a reusable block.
			const _isVisible =
				_isReusable ||
				// Hide 'Add to Reusable blocks' when reusable blocks are disabled.
				( canInsertBlockType( 'core/block' ) &&
					blocks.every(
						( block ) =>
							// Guard against the case where a regular block has *just* been converted.
							!! block &&
							// Hide 'Add to Reusable blocks' on invalid blocks.
							block.isValid &&
							// Hide 'Add to Reusable blocks' when block doesn't support being made reusable.
							hasBlockSupport( block.name, 'reusable', true )
					) &&
					// Hide 'Add to Reusable blocks' when current doesn't have permission to do that.
					!! canUser( 'create', 'blocks' ) );

			return {
				isReusable: _isReusable,
				isVisible: _isVisible,
			};
		},
		[ clientIds ]
	);

	const {
		__experimentalConvertBlockToReusable: convertBlockToReusable,
		__experimentalConvertBlockToStatic: convertBlockToStatic,
	} = useDispatch( 'core/editor' );

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
								convertBlockToReusable( clientIds );
								onClose();
							} }
						>
							{ __( 'Add to Reusable blocks' ) }
						</MenuItem>
					) }
					{ isReusable && (
						<MenuItem
							onClick={ () => {
								convertBlockToStatic( clientIds[ 0 ] );
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
