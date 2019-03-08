/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: _BlockSettingsMenuPluginsExtension, Slot } = createSlotFill( '_BlockSettingsMenuPluginsExtension' );

_BlockSettingsMenuPluginsExtension.Slot = Slot;

export default _BlockSettingsMenuPluginsExtension;
