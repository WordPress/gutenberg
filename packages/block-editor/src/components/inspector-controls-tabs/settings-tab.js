/**
 * Internal dependencies
 */
import AdvancedControls from './advanced-controls-panel';
import PositionControls from './position-controls-panel';
import { default as InspectorControls } from '../inspector-controls';
import SettingsTabHint from './settings-tab-hint';
import { BindingsPanel } from '../inspector-controls/bindings-panel';

function SettingsTab( { showAdvancedControls = false, block } ) {
	const hasBindings = block?.attributes?.metadata?.bindings
		? Object.keys( block.attributes.metadata.bindings ).length > 0
		: false;

	return (
		<>
			{ hasBindings && <BindingsPanel block={ block } /> }
			<InspectorControls.Slot />
			<PositionControls />
			{ showAdvancedControls && (
				<div>
					<AdvancedControls />
				</div>
			) }
			<SettingsTabHint />
		</>
	);
}

export default SettingsTab;
