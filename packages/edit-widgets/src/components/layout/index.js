/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { PluginArea } from '@wordpress/plugins';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import ErrorBoundary from '../error-boundary';
import WidgetAreasBlockEditorProvider from '../widget-areas-block-editor-provider';
import Sidebar from '../sidebar';
import Interface from './interface';
import UnsavedChangesWarning from './unsaved-changes-warning';
import WelcomeGuide from '../welcome-guide';

function Layout( { blockEditorSettings } ) {
	const { createErrorNotice } = useDispatch( noticesStore );

	function onPluginAreaError( name ) {
		createErrorNotice(
			sprintf(
				/* translators: %s: plugin name */
				__(
					'The "%s" plugin has encountered an error and cannot be rendered.'
				),
				name
			)
		);
	}

	return (
		<ErrorBoundary>
			<WidgetAreasBlockEditorProvider
				blockEditorSettings={ blockEditorSettings }
			>
				<Interface blockEditorSettings={ blockEditorSettings } />
				<Sidebar />
				<PluginArea onError={ onPluginAreaError } />
				<UnsavedChangesWarning />
				<WelcomeGuide />
			</WidgetAreasBlockEditorProvider>
		</ErrorBoundary>
	);
}

export default Layout;
