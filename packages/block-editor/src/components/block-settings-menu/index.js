/**
 * WordPress dependencies
 */
import {
	ToolbarGroup,
	__experimentalToolbarItem as ToolbarItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockSettingsDropdown from './block-settings-dropdown';

export function BlockSettingsMenu( { clientIds } ) {
	return (
		<ToolbarGroup>
			<ToolbarItem>
				{ ( { toggleProps } ) => (
					<BlockSettingsDropdown
						clientIds={ clientIds }
						toggleProps={ toggleProps }
					/>
				) }
			</ToolbarItem>
		</ToolbarGroup>
	);
}

export default BlockSettingsMenu;
