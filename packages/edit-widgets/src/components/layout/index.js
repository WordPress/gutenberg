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
import UnsavedChangesWarning from './unsaved-changes-warning';
import WelcomeGuide from '../welcome-guide';

function Layout( { blockEditorSettings } ) {
	return (
		<WidgetAreasBlockEditorProvider
			blockEditorSettings={ blockEditorSettings }
		>
			<Interface blockEditorSettings={ blockEditorSettings } />
			<Sidebar />
			<Popover.Slot />
			<PluginArea />
			<UnsavedChangesWarning />
			<WelcomeGuide />
		</WidgetAreasBlockEditorProvider>
	);
}

export default Layout;
