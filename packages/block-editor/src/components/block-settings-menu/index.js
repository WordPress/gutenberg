/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockSettingsDropdown from './block-settings-dropdown';
import NoteIconToolbarSlotFill from '../../components/collab/note-icon-toolbar-slot';

export function BlockSettingsMenu( { clientIds, ...props } ) {
	return (
		<ToolbarGroup>
			<NoteIconToolbarSlotFill.Slot />

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
