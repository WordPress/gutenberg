/**
 * Defines as extensibility slot for the Status & Visibility panel
 */
import { createSlotFill, PanelRow } from '@wordpress/components';

export const { Fill: PluginPostStatusInfo, Slot } = createSlotFill( 'PluginPostStatusInfo' );

PluginPostStatusInfo.Slot = () => (
	<PanelRow>
		<Slot />
	</PanelRow>
);
export default PluginPostStatusInfo;
