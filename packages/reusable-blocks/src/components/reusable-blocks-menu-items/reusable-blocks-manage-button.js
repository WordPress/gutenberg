/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isReusableBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	BlockSettingsMenuControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { addQueryArgs } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as reusableBlocksStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { DropdownMenuItemV2 } = unlock( componentsPrivateApis );

function ReusableBlocksManageButton( { clientId } ) {
	const { canRemove, isVisible, innerBlockCount } = useSelect(
		( select ) => {
			const { getBlock, canRemoveBlock, getBlockCount } =
				select( blockEditorStore );
			const { canUser } = select( coreStore );
			const reusableBlock = getBlock( clientId );

			return {
				canRemove: canRemoveBlock( clientId ),
				isVisible:
					!! reusableBlock &&
					isReusableBlock( reusableBlock ) &&
					!! canUser(
						'update',
						'blocks',
						reusableBlock.attributes.ref
					),
				innerBlockCount: getBlockCount( clientId ),
			};
		},
		[ clientId ]
	);

	const { __experimentalConvertBlockToStatic: convertBlockToStatic } =
		useDispatch( reusableBlocksStore );

	if ( ! isVisible ) {
		return null;
	}

	return (
		<BlockSettingsMenuControls>
			{ /* TODO: check if this used in other legacy dropdown menus */ }
			<DropdownMenuItemV2
				href={ addQueryArgs( 'edit.php', { post_type: 'wp_block' } ) }
			>
				{ __( 'Manage Reusable blocks' ) }
			</DropdownMenuItemV2>
			{ canRemove && (
				<DropdownMenuItemV2
					onSelect={ () => convertBlockToStatic( clientId ) }
				>
					{ innerBlockCount > 1
						? __( 'Convert to regular blocks' )
						: __( 'Convert to regular block' ) }
				</DropdownMenuItemV2>
			) }
		</BlockSettingsMenuControls>
	);
}

export default ReusableBlocksManageButton;
