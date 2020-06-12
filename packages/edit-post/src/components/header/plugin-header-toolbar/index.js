/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: PluginHeaderToolbar, Slot } = createSlotFill(
	'PluginHeaderToolbar'
);

PluginHeaderToolbar.Slot = Slot;

export default PluginHeaderToolbar;
