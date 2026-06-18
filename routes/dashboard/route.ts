/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/*
 * Register the widget-modules discovery entity in the route lifecycle,
 * before the stage renders, so the stage's `getEntityRecords` read resolves
 * and feeds the records to `useWidgetTypes`.
 * Guarded for idempotency: beforeLoad re-runs on every navigation and preload.
 */
export const route = {
	beforeLoad() {
		if ( select( coreStore ).getEntityConfig( 'root', 'widgetModule' ) ) {
			return;
		}

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
	},
};
