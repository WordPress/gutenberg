/**
 * WordPress dependencies
 */
import { __experimentalUseSlotFills as useSlotFills } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AdvancedControls from './advanced-controls-panel';
import InspectorControlsGroups from '../inspector-controls/groups';
import {
	default as InspectorControls,
	InspectorAdvancedControls,
} from '../inspector-controls';

const SettingsTab = ( { hasSingleBlockSelection = false } ) => {
	const { default: defaultGroup } = InspectorControlsGroups;
	const settingsFills = [
		...( useSlotFills( defaultGroup.Slot.__unstableName ) || [] ),
		...( useSlotFills( InspectorAdvancedControls.slotName ) || [] ),
	];

	return (
		<>
			<InspectorControls.Slot />
			{ hasSingleBlockSelection && (
				<div>
					<AdvancedControls />
				</div>
			) }
			{ ! settingsFills.length && (
				<span className="block-editor-block-inspector__no-block-tools">
					{ hasSingleBlockSelection
						? __( 'This block has no settings.' )
						: __( 'The selected blocks have no settings.' ) }
				</span>
			) }
		</>
	);
};

export default SettingsTab;
