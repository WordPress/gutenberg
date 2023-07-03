/**
 * WordPress dependencies
 */
import { SlotFillProvider, Popover } from '@wordpress/components';
import { UnsavedChangesWarning } from '@wordpress/editor';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { PluginArea } from '@wordpress/plugins';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Layout from '../layout';
import { GlobalStylesProvider } from '../global-styles/global-styles-provider';
import { unlock } from '../../lock-unlock';

const { RouterProvider } = unlock( routerPrivateApis );

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
		<ShortcutProvider style={ { height: '100%' } }>
			<SlotFillProvider>
				<GlobalStylesProvider>
					<Popover.Slot />
					<UnsavedChangesWarning />
					<RouterProvider>
						<Layout />
						<PluginArea onError={ onPluginAreaError } />
					</RouterProvider>
				</GlobalStylesProvider>
			</SlotFillProvider>
		</ShortcutProvider>
	);
}
