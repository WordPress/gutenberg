/**
 * WordPress dependencies
 */
import { __experimentalUseSlotFills as useSlotFills } from '@wordpress/components';

/**
 * Internal dependencies
 */
import InspectorControlsGroups from '../inspector-controls/groups';
import { InspectorAdvancedControls } from '../inspector-controls';
import { TAB_MENU, TAB_SETTINGS, TAB_APPEARANCE } from './utils';

export default function useInspectorControlsTabs() {
	const tabs = [];
	const {
		border: borderGroup,
		color: colorGroup,
		default: defaultGroup,
		dimensions: dimensionsGroup,
		menu: menuGroup,
		typography: typographyGroup,
	} = InspectorControlsGroups;

	// Menu Tab: If there are any fills for the menu group add that tab.
	const menuFills = useSlotFills( menuGroup.Slot.__unstableName );

	if ( !! menuFills && menuFills.length ) {
		tabs.push( TAB_MENU );
	}

	// Appearance Tab: Add this tab if there are any fills for block supports
	// e.g. border, color, spacing, typography, etc.
	const appearanceFills = [
		...( useSlotFills( borderGroup.Slot.__unstableName ) || [] ),
		...( useSlotFills( colorGroup.Slot.__unstableName ) || [] ),
		...( useSlotFills( dimensionsGroup.Slot.__unstableName ) || [] ),
		...( useSlotFills( typographyGroup.Slot.__unstableName ) || [] ),
	];

	if ( appearanceFills.length ) {
		tabs.push( TAB_APPEARANCE );
	}

	// Settings Tab: If there are any fills for the general InspectorControls
	// or Advanced Controls slot, then add this tab.
	const settingsFills = [
		...( useSlotFills( defaultGroup.Slot.__unstableName ) || [] ),
		...( useSlotFills( InspectorAdvancedControls.slotName ) || [] ),
	];

	if ( settingsFills.length ) {
		tabs.push( TAB_SETTINGS );
	}

	return tabs;
}
