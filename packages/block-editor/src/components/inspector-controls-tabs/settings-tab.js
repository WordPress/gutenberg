/**
 * Internal dependencies
 */
import AdvancedControls from './advanced-controls-panel';
import { default as InspectorControls } from '../inspector-controls';

const SettingsTab = ( { showAdvancedControls = false } ) => (
	<>
		<InspectorControls.Slot />
		{ showAdvancedControls && (
			<div>
				<AdvancedControls />
			</div>
		) }
	</>
);

export default SettingsTab;
