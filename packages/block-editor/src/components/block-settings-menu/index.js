/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockSettingsDropdown from './block-settings-dropdown';
import BlockEditVisuallyButton from './block-edit-visually-button';

export function BlockSettingsMenu( { clientIds, ...props } ) {
	return (
		<>
			<BlockEditVisuallyButton clientIds={ clientIds } { ...props } />
			<ToolbarGroup>
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
		</>
	);
}

export default BlockSettingsMenu;
