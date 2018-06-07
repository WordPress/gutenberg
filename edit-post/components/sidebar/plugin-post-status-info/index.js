/**
 * Defines as extensibility slot for the Status & Visibility panel.
 */

/**
 * WordPress dependencies
 */
import { createSlotFill, PanelRow } from '@wordpress/components';

export const { Fill: PluginPostStatusInfo, Slot } = createSlotFill( 'PluginPostStatusInfo', PanelRow );

PluginPostStatusInfo.Slot = Slot;

export default PluginPostStatusInfo;
