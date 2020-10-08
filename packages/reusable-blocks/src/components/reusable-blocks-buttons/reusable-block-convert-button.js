/**
 * WordPress dependencies
 */
import { hasBlockSupport, isReusableBlock } from '@wordpress/blocks';
import { BlockSettingsMenuControls } from '@wordpress/block-editor';
import { MenuItem } from '@wordpress/components';
import { reusableBlock } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Menu control to convert block(s) to reusable block.
 *
 * @param {Object}   props           Component props.
 * @param {string[]} props.clientIds Client ids of selected blocks.
 *
 * @return {import('@wordpress/element').WPComponent} The menu control or null.
 */
export default function ReusableBlockConvertButton( { clientIds } ) {
	const canConvert = useSelect(
		( select ) => {
			const { canUser } = select( 'core' );
			const { getBlocksByClientId, canInsertBlockType } = select(
				'core/block-editor'
			);

			const blocks = getBlocksByClientId( clientIds ) ?? [];

			const isReusable =
				blocks.length === 1 &&
				blocks[ 0 ] &&
				isReusableBlock( blocks[ 0 ] ) &&
				!! select( 'core' ).getEntityRecord(
					'postType',
					'wp_block',
					blocks[ 0 ].attributes.ref
				);

			const _canConvert =
				// Hide when this is already a reusable block.
				! isReusable &&
				// Hide when reusable blocks are disabled.
				canInsertBlockType( 'core/block' ) &&
				blocks.every(
					( block ) =>
						// Guard against the case where a regular block has *just* been converted.
						!! block &&
						// Hide on invalid blocks.
						block.isValid &&
						// Hide when block doesn't support being made reusable.
						hasBlockSupport( block.name, 'reusable', true )
				) &&
				// Hide when current doesn't have permission to do that.
				!! canUser( 'create', 'blocks' );

			return _canConvert;
		},
		[ clientIds ]
	);

	const {
		__experimentalConvertBlockToReusable: convertBlockToReusable,
	} = useDispatch( 'core/reusable-blocks' );

	if ( ! canConvert ) {
		return null;
	}

	return (
		<BlockSettingsMenuControls>
			{ ( { onClose } ) => (
				<MenuItem
					icon={ reusableBlock }
					onClick={ () => {
						convertBlockToReusable( clientIds );
						onClose();
					} }
				>
					{ __( 'Add to Reusable blocks' ) }
				</MenuItem>
			) }
		</BlockSettingsMenuControls>
	);
}
