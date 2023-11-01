/**
 * WordPress dependencies
 */
import { SlotFillProvider } from '@wordpress/components';
import { UnsavedChangesWarning } from '@wordpress/editor';
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
import DataviewsProvider from '../dataviews/provider';
import { unlock } from '../../lock-unlock';

const { RouterProvider, useLocation } = unlock( routerPrivateApis );

const PATH_TO_DATAVIEW_TYPE = {
	'/pages': 'page',
};

function DataviewsProviderWithType( { children } ) {
	const {
		params: { path },
	} = useLocation();
	const viewType = PATH_TO_DATAVIEW_TYPE[ path ];
	if ( ! viewType ) {
		return <>{ children }</>;
	}
	return (
		<DataviewsProvider type={ viewType }>{ children }</DataviewsProvider>
	);
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
					<DataviewsProviderWithType>
						<Layout />
						<PluginArea onError={ onPluginAreaError } />
					</DataviewsProviderWithType>
				</RouterProvider>
			</GlobalStylesProvider>
		</SlotFillProvider>
	);
}
