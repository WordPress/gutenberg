/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import {
	UnsavedChangesWarning,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { PluginArea } from '@wordpress/plugins';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Layout from '../layout';
import { unlock } from '../../lock-unlock';
import { useCommonCommands } from '../../hooks/commands/use-common-commands';
import { useEditModeCommands } from '../../hooks/commands/use-edit-mode-commands';
import useInitEditedEntityFromURL from '../sync-state-with-url/use-init-edited-entity-from-url';
import useLayoutAreas from '../layout/router';
import useSetCommandContext from '../../hooks/commands/use-set-command-context';

const { RouterProvider } = unlock( routerPrivateApis );
const { GlobalStylesProvider } = unlock( editorPrivateApis );

function AppLayout() {
	// This ensures the edited entity id and type are initialized properly.
	useInitEditedEntityFromURL();
	useEditModeCommands();
	useCommonCommands();
	useSetCommandContext();
	const route = useLayoutAreas();

	return <Layout route={ route } />;
}

export default function App() {
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
		<SlotFillProvider>
			<GlobalStylesProvider>
				<UnsavedChangesWarning />
				<RouterProvider>
					<AppLayout />
					<PluginArea onError={ onPluginAreaError } />
				</RouterProvider>
			</GlobalStylesProvider>
		</SlotFillProvider>
	);
}
