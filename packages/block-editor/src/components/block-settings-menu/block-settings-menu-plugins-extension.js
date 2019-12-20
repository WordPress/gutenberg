/**
 * WordPress dependencies
 */
import { createSlotFill } from '@wordpress/components';

const { Fill: __experimentalBlockSettingsMenuPluginsExtension, Slot } = createSlotFill( '__experimentalBlockSettingsMenuPluginsExtension' );

__experimentalBlockSettingsMenuPluginsExtension.Slot = Slot;

export default __experimentalBlockSettingsMenuPluginsExtension;
