/**
 * WordPress dependencies
 */
import { SlotFillProvider, Popover } from '@wordpress/components';
import { UnsavedChangesWarning } from '@wordpress/editor';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';
import { store as noticesStore } from '@wordpress/notices';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { PluginArea } from '@wordpress/plugins';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import Layout from '../layout';
import { GlobalStylesProvider } from '../global-styles/global-styles-provider';
import getBlockEditorProvider from '../block-editor/get-block-editor-provider';
import { store as editSiteStore } from '../../store';
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

	const entityType = useSelect(
		( select ) => select( editSiteStore ).getEditedPostType(),
		[]
	);

	// Choose the provider based on the entity type currently
	// being edited.
	const BlockEditorProvider = getBlockEditorProvider( entityType );

	return (
		<ShortcutProvider style={ { height: '100%' } }>
			<SlotFillProvider>
				<GlobalStylesProvider>
					<BlockEditorProvider>
						<Popover.Slot />
						<UnsavedChangesWarning />
						<RouterProvider>
							<Layout />
							<PluginArea onError={ onPluginAreaError } />
						</RouterProvider>
					</BlockEditorProvider>
				</GlobalStylesProvider>
			</SlotFillProvider>
		</ShortcutProvider>
	);
}
