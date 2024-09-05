/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarItem } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import BlockSettingsDropdown from './block-settings-dropdown';
import BlockCommentToolbar from '../collab/toolbar';

export function BlockSettingsMenu( { clientIds, ...props } ) {
	const selectedBlockClientId = clientIds[ 0 ];
	const commentID = useSelect( ( select ) => {
		return (
			// eslint-disable-next-line @wordpress/data-no-store-string-literals
			select( 'core/block-editor' ).getBlock( selectedBlockClientId )
				?.attributes?.blockCommentId || null
		);
	} );

	return (
		<ToolbarGroup>
			{ commentID && (
				<BlockCommentToolbar
					clientId={ selectedBlockClientId }
					blockClassName={ commentID }
				/>
			) }

			<ToolbarItem>
				{ ( toggleProps ) => (
					<BlockSettingsDropdown
						clientIds={ clientIds }
						toggleProps={ toggleProps }
						{ ...props }
					/>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
}

export default BlockSettingsMenu;
