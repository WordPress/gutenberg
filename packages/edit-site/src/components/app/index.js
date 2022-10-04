/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { UnsavedChangesWarning } from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { PluginArea } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import { Routes } from '../routes';
import Editor from '../editor';
import List from '../list';
import NavigationSidebar from '../navigation-sidebar';
import getIsListPage from '../../utils/get-is-list-page';

export default function EditSiteApp( { reboot } ) {
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
			<UnsavedChangesWarning />

			<Routes>
				{ ( { params } ) => {
					const isListPage = getIsListPage( params );

					return (
						<>
							{ isListPage ? (
								<List />
							) : (
								<Editor onError={ reboot } />
							) }
							<PluginArea onError={ onPluginAreaError } />
							{ /* Keep the instance of the sidebar to ensure focus will not be lost
							 * when navigating to other pages. */ }
							<NavigationSidebar
								// Open the navigation sidebar by default when in the list page.
								isDefaultOpen={ !! isListPage }
								activeTemplateType={
									isListPage ? params.postType : undefined
								}
							/>
						</>
					);
				} }
			</Routes>
		</SlotFillProvider>
	);
}
