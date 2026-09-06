import { getAdminThemeColors } from '@wordpress/admin-ui';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { PluginArea } from '@wordpress/plugins';
import { store as noticesStore } from '@wordpress/notices';
import { __unstableUseNavigateRegions as useNavigateRegions } from '@wordpress/components';
import { ThemeProvider } from '@wordpress/theme';
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

	const navigateRegionsProps = useNavigateRegions();
	const adminPrimary = useMemo( () => getAdminThemeColors().primary, [] );

	return (
		<ThemeProvider isRoot color={ { primary: adminPrimary } }>
			<ErrorBoundary>
				<div { ...navigateRegionsProps }>
					<WidgetAreasBlockEditorProvider
						blockEditorSettings={ blockEditorSettings }
					>
						<Interface
							blockEditorSettings={ blockEditorSettings }
						/>
						<Sidebar />
						<PluginArea onError={ onPluginAreaError } />
						<UnsavedChangesWarning />
						<WelcomeGuide />
					</WidgetAreasBlockEditorProvider>
				</div>
			</ErrorBoundary>
		</ThemeProvider>
	);
}

export default Layout;
