import { ToolbarGroup, ToolbarItem } from '@wordpress/components';
import BlockSettingsDropdown from './block-settings-dropdown';
import NoteIconToolbarSlotFill from '../../components/collab/note-icon-toolbar-slot';

export function BlockSettingsMenu( { clientIds, children, ...props } ) {
	return (
		<ToolbarGroup>
			{ children }
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
