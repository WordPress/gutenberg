/**
 * WordPress dependencies
 */
import { ToolbarItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockSettingsDropdown from './block-settings-dropdown';

export function BlockSettingsMenu( { clientIds, ...props } ) {
	return (
		<ToolbarItem>
			{ ( toggleProps ) => (
				<BlockSettingsDropdown
					clientIds={ clientIds }
					toggleProps={ toggleProps }
					{ ...props }
				/>
			) }
		</ToolbarItem>
	);
}

export default BlockSettingsMenu;
