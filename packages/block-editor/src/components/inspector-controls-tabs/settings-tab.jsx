import { __experimentalUseSlotFills as useSlotFills } from '@wordpress/components';
import AdvancedControls from './advanced-controls-panel';
import AdditionalStyles from './additional-styles-panel';
import { default as InspectorControls } from '../inspector-controls';
import groups from '../inspector-controls/groups';

const SettingsTab = ( {
	showAdvancedControls = false,
	showAdditionalStyles = false,
} ) => {
	const defaultFills = useSlotFills( groups.default.name );
	const bindingsFills = useSlotFills( groups.bindings.name );

	// Expand the advanced panel when there are no other fills
	// in the settings tab.
	const hasOtherFills = !! defaultFills?.length || !! bindingsFills?.length;

	return (
		<>
			<InspectorControls.Slot />
			<InspectorControls.Slot group="bindings" />
			{ showAdvancedControls && (
				<div>
					<AdvancedControls initialOpen={ ! hasOtherFills } />
				</div>
			) }
			{ /* When there is no styles tab to host them, additional styling
			     controls appear here as a separate panel. */ }
			{ showAdditionalStyles && (
				<div>
					<AdditionalStyles />
				</div>
			) }
		</>
	);
};

export default SettingsTab;
