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
import { store as editorStore } from '../store';

function PatternsManageButton( { clientId } ) {
	const { canRemove, isVisible, innerBlockCount, managePatternsUrl } =
		useSelect(
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

	const { __experimentalConvertSyncedPatternToStatic: convertBlockToStatic } =
		useDispatch( editorStore );

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
					{ innerBlockCount > 1
						? __( 'Detach patterns' )
						: __( 'Detach pattern' ) }
				</MenuItem>
			) }
		</>
	);
}

export default PatternsManageButton;
