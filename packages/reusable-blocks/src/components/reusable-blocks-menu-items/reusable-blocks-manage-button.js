/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isReusableBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { addQueryArgs } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as reusableBlocksStore } from '../../store';
import { unlock } from '../../lock-unlock';

const {
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
} = unlock( componentsPrivateApis );

function ReusableBlocksManageButton( { clientId } ) {
	const { canRemove, isVisible, managePatternsUrl } = useSelect(
		( select ) => {
			const { getBlock, canRemoveBlock, getBlockCount, getSettings } =
				select( blockEditorStore );
			const { canUser } = select( coreStore );
			const reusableBlock = getBlock( clientId );
			const isBlockTheme = getSettings().__unstableIsBlockBasedTheme;

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
				// The site editor and templates both check whether the user
				// has edit_theme_options capabilities. We can leverage that here
				// and omit the manage patterns link if the user can't access it.
				managePatternsUrl:
					isBlockTheme && canUser( 'read', 'templates' )
						? addQueryArgs( 'site-editor.php', {
								path: '/patterns',
						  } )
						: addQueryArgs( 'edit.php', {
								post_type: 'wp_block',
						  } ),
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
		<>
			<DropdownMenuItem
				render={
					// Disable reason: the `children` are already passed to the menu item
					// eslint-disable-next-line jsx-a11y/anchor-has-content
					<a href={ managePatternsUrl } />
				}
				// TODO: should we change the `role` ?
			>
				<DropdownMenuItemLabel>
					{ __( 'Manage patterns' ) }
				</DropdownMenuItemLabel>
			</DropdownMenuItem>
			{ canRemove && (
				<DropdownMenuItem
					hideOnClick={ false }
					onClick={ () => convertBlockToStatic( clientId ) }
				>
					{ __( 'Detach' ) }
				</DropdownMenuItem>
			) }
		</>
	);
}

export default ReusableBlocksManageButton;
