/**
 * Defines as extensibility slot for the Settings sidebar
 */

/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

export const { Fill, Slot } = createSlotFill( 'PluginSettingsSidebar' );

const PluginSettingsSidebar = ( { children } ) => (
	<Fill>{ children }</Fill>
);

PluginSettingsSidebar.Slot = Slot;

export default PluginSettingsSidebar;
