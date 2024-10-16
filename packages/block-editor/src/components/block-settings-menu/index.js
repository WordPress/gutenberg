/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockSettingsDropdown from './block-settings-dropdown';
//import __unstableCommentIconToolbarFill from '../collab/block-comment-icon-toolbar-slot';
import { privateApis as blockEditorPrivateApis } from '../../private-apis';
import { unlock } from '../../lock-unlock';
const { __unstableCommentIconToolbarFill } = unlock( blockEditorPrivateApis );

export function BlockSettingsMenu( { clientIds, ...props } ) {
	return (
		<ToolbarGroup>
			<__unstableCommentIconToolbarFill.Slot />

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
