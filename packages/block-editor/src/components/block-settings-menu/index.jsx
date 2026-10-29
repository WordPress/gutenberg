import { ToolbarGroup, ToolbarItem } from '@wordpress/components';
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
						toggleProps={
							clientIds.length
								? toggleProps
								: {
										...toggleProps,
										disabled: true,
										accessibleWhenDisabled: true,
									}
						}
						{ ...props }
					/>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
}

export default BlockSettingsMenu;
