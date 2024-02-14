/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import AdvancedControls from './advanced-controls-panel';
import PositionControls from './position-controls-panel';
import { default as InspectorControls } from '../inspector-controls';
import SettingsTabHint from './settings-tab-hint';

const SettingsTab = ( { showAdvancedControls = false } ) => (
	<>
		<InspectorControls.Slot />
		<InspectorControls.Slot
			group="dimensions"
			label={ __( 'Dimensions' ) }
		/>
		<PositionControls />
		{ showAdvancedControls && (
			<div>
				<AdvancedControls />
			</div>
		) }
		<SettingsTabHint />
	</>
);

export default SettingsTab;
