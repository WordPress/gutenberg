/**
 * Defines as extensibility slot for the Document Sidebar.
 */

/**
 * WordPress dependencies
 */
import { createSlotFill, PanelBody } from '@wordpress/components';

export const { Fill, Slot } = createSlotFill( 'PluginDocumentSidebarPanel' );

const PluginDocumentSidebarPanel = ( { children, className, title, initialOpen = false, isOpened, onTogglePanel } ) => (
	<Fill>
		<PanelBody
			className={ className }
			initialOpen={ initialOpen || ! title }
			title={ title }
			opened={ isOpened }
			onToggle={ onTogglePanel }
		>
			{ children }
		</PanelBody>
	</Fill>
);

PluginDocumentSidebarPanel.Slot = Slot;

export default PluginDocumentSidebarPanel;
