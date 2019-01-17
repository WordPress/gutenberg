/**
 * Defines as extensibility slot for the Settings sidebar
 */

/**
 * WordPress dependencies
 */
import { createSlotFill, PanelRow } from '@wordpress/components';

export const { Fill, Slot } = createSlotFill( 'PluginSettingsSidebar' );

const PluginSettingsSidebar = ( { children, className } ) => (
	<Fill>
		<PanelRow className={ className }>
			{ children }
		</PanelRow>
	</Fill>
);

PluginSettingsSidebar.Slot = Slot;

export default PluginSettingsSidebar;
