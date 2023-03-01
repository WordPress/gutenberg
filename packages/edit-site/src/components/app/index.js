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

/**
 * Internal dependencies
 */
import { Routes } from '../routes';
import Layout from '../layout';

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
				<Popover.Slot />
				<UnsavedChangesWarning />
				<Routes>
					<Layout />
					<PluginArea onError={ onPluginAreaError } />
				</Routes>
			</SlotFillProvider>
		</ShortcutProvider>
	);
}
