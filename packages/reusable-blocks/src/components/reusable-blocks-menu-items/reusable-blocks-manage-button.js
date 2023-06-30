/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isReusableBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
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

function ManagePatternsMenuItem() {
	const defaultUrl = addQueryArgs( 'edit.php', { postType: 'wp_block' } );
	const patternsUrl = addQueryArgs( 'site-editor.php', {
		path: '/patterns',
	} );

	const [ url, setUrl ] = useState( defaultUrl );

	useEffect( () => {
		window.fetch( patternsUrl ).then( ( response ) => {
			if ( response?.status === 200 ) {
				setUrl( patternsUrl );
			}
		} );
	}, [] );

	return (
		<MenuItem role="menuitem" href={ url }>
			{ __( 'Manage Patterns' ) }
		</MenuItem>
	);
}

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
			<ManagePatternsMenuItem />
			{ canRemove && (
				<MenuItem onClick={ () => convertBlockToStatic( clientId ) }>
					{ innerBlockCount > 1
						? __( 'Detach patterns' )
						: __( 'Detach pattern' ) }
				</MenuItem>
			) }
		</BlockSettingsMenuControls>
	);
}

export default ReusableBlocksManageButton;
