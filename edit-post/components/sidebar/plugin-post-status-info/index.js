/**
 * Defines as extensibility slot for the Status & Visibility panel
 */
import { createSlotFill, PanelRow } from '@wordpress/components';

export const { Fill, Slot } = createSlotFill( 'PluginPostStatusInfo' );

const PluginPostStatusInfo = ( { children } ) => {
	return (
		<Fill>
			{children}
		</Fill>
	)
};

PluginPostStatusInfo.Slot = () => (
		<PanelRow>
			<Slot />
		</PanelRow>
);
export default PluginPostStatusInfo;
