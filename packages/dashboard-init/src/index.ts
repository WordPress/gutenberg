/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { registerDashboardIconResolver } from './icons';

/**
 * Register the widget-modules discovery entity and the icon resolver
 * before the dashboard renders, so the stage's `getEntityRecords` read
 * resolves and feeds the records to `useWidgetTypes`.
 *
 * This function is mandatory - all init modules must export 'init'.
 */
export async function init() {
	if ( select( coreStore ).getEntityConfig( 'root', 'widgetModule' ) ) {
		return;
	}

	registerDashboardIconResolver();

	dispatch( coreStore ).addEntities( [
		{
			name: 'widgetModule',
			kind: 'root',
			key: 'name',
			baseURL: '/wp/v2/widget-modules',
			plural: 'widgetModules',
			label: __( 'Widget modules' ),
			supportsPagination: false,
		},
	] );
}
