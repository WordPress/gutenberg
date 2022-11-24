/**
 * WordPress dependencies
 */
import {
	PanelBody,
	__experimentalUseSlotFills as useSlotFills,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	default as InspectorControls,
	InspectorAdvancedControls,
} from '../inspector-controls';
import InspectorControlsGroups from '../inspector-controls/groups';

const AdvancedControls = () => {
	const fills = useSlotFills( InspectorAdvancedControls.slotName );
	const hasFills = Boolean( fills && fills.length );

	// Check fills in settings tab to determine initial open state for panel.
	const tabsEnabled = window?.__experimentalEnableBlockInspectorTabs;
	const { default: defaultGroup } = InspectorControlsGroups;
	const settingFills = useSlotFills( defaultGroup.Slot.__unstableName ) || [];
	const open = !! tabsEnabled && ! settingFills.length;

	if ( ! hasFills ) {
		return null;
	}

	return (
		<PanelBody
			className="block-editor-block-inspector__advanced"
			title={ __( 'Advanced' ) }
			initialOpen={ open }
		>
			<InspectorControls.Slot __experimentalGroup="advanced" />
		</PanelBody>
	);
};

export default AdvancedControls;
