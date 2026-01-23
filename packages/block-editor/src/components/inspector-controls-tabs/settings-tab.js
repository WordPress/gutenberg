/**
 * Internal dependencies
 */
import AdvancedControls from './advanced-controls-panel';
import PositionControls from './position-controls-panel';
import { default as InspectorControls } from '../inspector-controls';

const SettingsTab = ( { showAdvancedControls = false } ) => (
	<>
		<InspectorControls.Slot />
		<PositionControls />
		<InspectorControls.Slot group="bindings" />
		{ showAdvancedControls && (
			<div>
				<AdvancedControls />
			</div>
		) }
	</>
);

export default SettingsTab;
