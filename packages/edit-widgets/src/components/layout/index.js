/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { PluginArea } from '@wordpress/plugins';
import { useMemo } from '@wordpress/element';
import { WidgetsSettings } from '@wordpress/widgets';

/**
 * Internal dependencies
 */
import ErrorBoundary from '../error-boundary';
import WidgetAreasBlockEditorProvider from '../widget-areas-block-editor-provider';
import Sidebar from '../sidebar';
import Interface from './interface';
import UnsavedChangesWarning from './unsaved-changes-warning';
import WelcomeGuide from '../welcome-guide';

function Layout( { blockEditorSettings, onError } ) {
	const settings = useMemo( () => omit( blockEditorSettings, 'adminUrl' ), [
		blockEditorSettings,
	] );
	const widgetsSettings = useMemo(
		() => ( { adminUrl: blockEditorSettings.adminUrl } ),
		[ blockEditorSettings ]
	);
	return (
		<ErrorBoundary onError={ onError }>
			<WidgetsSettings.Provider value={ widgetsSettings }>
				<WidgetAreasBlockEditorProvider
					blockEditorSettings={ settings }
				>
					<Interface blockEditorSettings={ blockEditorSettings } />
					<Sidebar />
					<Popover.Slot />
					<PluginArea />
					<UnsavedChangesWarning />
					<WelcomeGuide />
				</WidgetAreasBlockEditorProvider>
			</WidgetsSettings.Provider>
		</ErrorBoundary>
	);
}

export default Layout;
