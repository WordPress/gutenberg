/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { PluginArea } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import WidgetAreasBlockEditorProvider from '../widget-areas-block-editor-provider';
import Sidebar from '../sidebar';
import Interface from './interface';

function Layout( { blockEditorSettings } ) {
	return (
		<WidgetAreasBlockEditorProvider
			blockEditorSettings={ blockEditorSettings }
		>
			<Interface blockEditorSettings={ blockEditorSettings } />
			<Sidebar />
			<Popover.Slot />
			<PluginArea />
		</WidgetAreasBlockEditorProvider>
	);
}

export default Layout;
