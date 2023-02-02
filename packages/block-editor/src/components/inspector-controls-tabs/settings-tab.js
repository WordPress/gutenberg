/**
 * Internal dependencies
 */
import AdvancedControls from './advanced-controls-panel';
import PositionControls from './position-controls-panel';
import { default as InspectorControls } from '../inspector-controls';
import SettingsTabPointer from './settings-tab-pointer';

const SettingsTab = ( { showAdvancedControls = false } ) => (
	<>
		<InspectorControls.Slot />
		<PositionControls />
		{ showAdvancedControls && (
			<div>
				<AdvancedControls />
			</div>
		) }
		<SettingsTabPointer />
	</>
);

export default SettingsTab;
