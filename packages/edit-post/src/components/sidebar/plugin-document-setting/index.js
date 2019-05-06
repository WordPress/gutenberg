/**
 * Defines as extensibility slot for the Settings sidebar
 */

/**
 * WordPress dependencies
 */
import { createSlotFill, PanelBody } from '@wordpress/components';

export const { Fill, Slot } = createSlotFill( 'PluginSettingsSidebar' );

const PluginDocumentSetting = ( { children, className, title, initialOpen } ) => (
	<Fill>
		<PanelBody
			className={ className }
			initialOpen={ initialOpen || ! title }
			title={ title }
		>
			{ children }
		</PanelBody>
	</Fill>
);

PluginDocumentSetting.Slot = Slot;

export default PluginDocumentSetting;
