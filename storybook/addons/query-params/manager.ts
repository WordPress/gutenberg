import { addons } from 'storybook/manager-api';
import { SET_QUERY_PARAMS } from './constants';

const ADDON_ID = '@wordpress/storybook-addon-query-params';

addons.register( ADDON_ID, ( api ) => {
	api.on(
		SET_QUERY_PARAMS,
		( queryParams: Record< string, string | null > ) => {
			api.applyQueryParams( queryParams, { replace: true } );
		}
	);
} );
