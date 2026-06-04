/**
 * WordPress dependencies
 */
import {
	MenuItem,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isReusableBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { addQueryArgs } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as reusableBlocksStore } from '../../store';

function ReusableBlocksManageButton( { clientId } ) {
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	const { canRemove, isVisible, managePatternsUrl } = useSelect(
		( select ) => {
			const { getBlock, canRemoveBlock } = select( blockEditorStore );
			const { canUser } = select( coreStore );
			const reusableBlock = getBlock( clientId );

			return {
				canRemove: canRemoveBlock( clientId ),
				isVisible:
					!! reusableBlock &&
					isReusableBlock( reusableBlock ) &&
					!! canUser( 'update', {
						kind: 'postType',
						name: 'wp_block',
						id: reusableBlock.attributes.ref,
					} ),
				// The site editor and templates both check whether the user
				// has edit_theme_options capabilities. We can leverage that here
				// and omit the manage patterns link if the user can't access it.
				managePatternsUrl: canUser( 'create', {
					kind: 'postType',
					name: 'wp_template',
				} )
					? addQueryArgs( 'site-editor.php', {
							p: '/pattern',
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

	const handleDetach = () => {
		convertBlockToStatic( clientId );
		setShowConfirmDialog( false );
	};

	return (
		<>
			<MenuItem href={ managePatternsUrl }>
				{ __( 'Manage patterns' ) }
			</MenuItem>
			{ canRemove && (
				<>
					<MenuItem onClick={ () => setShowConfirmDialog( true ) }>
						{ __( 'Disconnect pattern' ) }
					</MenuItem>
					<ConfirmDialog
						isOpen={ showConfirmDialog }
						onConfirm={ handleDetach }
						onCancel={ () => setShowConfirmDialog( false ) }
						confirmButtonText={ __( 'Disconnect' ) }
						size="medium"
						title={ __( 'Disconnect pattern?' ) }
						__experimentalHideHeader={ false }
					>
						{ __(
							'Blocks will be separated from the original pattern and will be fully editable. Future changes to the pattern will not apply here.'
						) }
					</ConfirmDialog>
				</>
			) }
		</>
	);
}

export default ReusableBlocksManageButton;
