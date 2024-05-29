/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
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

function ReusableBlocksManageButton( { clientId } ) {
	const { canRemove, isVisible, managePatternsUrl } = useSelect(
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
				// The site editor and templates both check whether the user
				// has edit_theme_options capabilities. We can leverage that here
				// and omit the manage patterns link if the user can't access it.
				managePatternsUrl: canUser( 'create', 'templates' )
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
			<MenuItem href={ managePatternsUrl }>
				{ __( 'Manage patterns' ) }
			</MenuItem>
			{ canRemove && (
				<MenuItem onClick={ () => convertBlockToStatic( clientId ) }>
					{ __( 'Detach' ) }
				</MenuItem>
			) }
		</>
	);
}

export default ReusableBlocksManageButton;
