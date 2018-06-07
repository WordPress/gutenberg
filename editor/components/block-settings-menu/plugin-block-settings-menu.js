/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: PluginBlockSettingsMenu, Slot } = createSlotFill( 'PluginsBlockSettingsMenu' );

PluginBlockSettingsMenu.Slot = Slot;

export default PluginBlockSettingsMenu;
