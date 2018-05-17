/**
 * WordPress dependencies
 */
import { createSlotFill, PanelBody } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'PluginPostPublishPanel' );

const PluginPostPublishPanel = ( { children, title, initialOpen = false } ) => (
	<Fill>
		<PanelBody initialOpen={ initialOpen || ! title } title={ title }>
			{ children }
		</PanelBody>
	</Fill>
);

PluginPostPublishPanel.Slot = Slot;

export default PluginPostPublishPanel;
