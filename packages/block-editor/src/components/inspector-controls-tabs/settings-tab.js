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

const SettingsTab = ( { showAdvancedControls = false } ) => (
	<>
		<InspectorControls.Slot />
		<InspectorControls.Slot group="settings" label={ __( 'Settings' ) } />
		<InspectorControls.Slot group="display" label={ __( 'Display' ) } />
		<InspectorControls.Slot group="media" label={ __( 'Media' ) } />
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
