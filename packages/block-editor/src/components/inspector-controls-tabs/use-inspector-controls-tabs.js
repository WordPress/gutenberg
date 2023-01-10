/**
 * WordPress dependencies
 */
import { __experimentalUseSlotFills as useSlotFills } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import InspectorControlsGroups from '../inspector-controls/groups';
import useIsListViewTabDisabled from './use-is-list-view-tab-disabled';
import { InspectorAdvancedControls } from '../inspector-controls';
import { TAB_LIST_VIEW, TAB_SETTINGS, TAB_STYLES } from './utils';
import { store as blockEditorStore } from '../../store';

const EMPTY_ARRAY = [];

function getShowTabs( blockName, tabSettings = {} ) {
	// Don't allow settings to force the display of tabs if the block inspector
	// tabs experiment hasn't been opted into.
	if ( ! window?.__experimentalEnableBlockInspectorTabs ) {
		return false;
	}

	// Block specific setting takes precedence over generic default.
	if ( tabSettings[ blockName ] !== undefined ) {
		return tabSettings[ blockName ];
	}

	// Use generic default if set over the Gutenberg experiment option.
	if ( tabSettings.default !== undefined ) {
		return tabSettings.default;
	}

	return true;
}

export default function useInspectorControlsTabs( blockName ) {
	const tabs = [];
	const {
		border: borderGroup,
		color: colorGroup,
		default: defaultGroup,
		dimensions: dimensionsGroup,
		list: listGroup,
		typography: typographyGroup,
	} = InspectorControlsGroups;

	// List View Tab: If there are any fills for the list group add that tab.
	const listViewDisabled = useIsListViewTabDisabled( blockName );
	const listFills = useSlotFills( listGroup.Slot.__unstableName );

	if ( ! listViewDisabled && !! listFills && listFills.length ) {
		tabs.push( TAB_LIST_VIEW );
	}

	// Styles Tab: Add this tab if there are any fills for block supports
	// e.g. border, color, spacing, typography, etc.
	const styleFills = [
		...( useSlotFills( borderGroup.Slot.__unstableName ) || [] ),
		...( useSlotFills( colorGroup.Slot.__unstableName ) || [] ),
		...( useSlotFills( dimensionsGroup.Slot.__unstableName ) || [] ),
		...( useSlotFills( typographyGroup.Slot.__unstableName ) || [] ),
	];

	if ( styleFills.length ) {
		tabs.push( TAB_STYLES );
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

	const tabSettings = useSelect( ( select ) => {
		return select( blockEditorStore ).getSettings()
			.__experimentalBlockInspectorTabs;
	}, [] );

	const showTabs = getShowTabs( blockName, tabSettings );

	return showTabs ? tabs : EMPTY_ARRAY;
}
