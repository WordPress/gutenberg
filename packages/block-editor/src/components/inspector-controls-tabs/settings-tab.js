/**
 * WordPress dependencies
 */
import { __experimentalUseSlotFills as useSlotFills } from '@wordpress/components';

/**
 * Internal dependencies
 */
import AdvancedControls from './advanced-controls-panel';
import PositionControls from './position-controls-panel';
import { default as InspectorControls } from '../inspector-controls';
import groups from '../inspector-controls/groups';

const SettingsTab = ( { showAdvancedControls = false } ) => {
	const defaultFills = useSlotFills( groups.default.name );
	const positionFills = useSlotFills( groups.position.name );
	const bindingsFills = useSlotFills( groups.bindings.name );

	// Expand the advanced panel when there are no other fills
	// in the settings tab.
	const hasOtherFills =
		!! defaultFills?.length ||
		!! positionFills?.length ||
		!! bindingsFills?.length;

	return (
		<>
			<InspectorControls.Slot />
			<PositionControls />
			<InspectorControls.Slot group="bindings" />
			{ showAdvancedControls && (
				<div>
					<AdvancedControls initialOpen={ ! hasOtherFills } />
				</div>
			) }
		</>
	);
};

export default SettingsTab;
