/**
 * WordPress dependencies
 */
import { resolveSelect, dispatch, select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store } from '../';

declare global {
	interface Window {
		__registeredWidgetTypes?: Array< {
			name: string;
			render_module?: string;
			widget_module?: string;
		} >;
	}
}

describe( 'widget-types resolvers', () => {
	beforeEach( () => {
		const types = select( store ).getWidgetTypes();
		for ( const type of types ) {
			dispatch( store ).unregisterWidgetType( type.name );
		}
		delete window.__registeredWidgetTypes;
	} );

	it( 'resolves to an empty list when no widgets are registered globally', async () => {
		window.__registeredWidgetTypes = [];

		const types = await resolveSelect( store ).getWidgetTypes();

		expect( types ).toEqual( [] );
	} );

	it( 'skips entries without a widget_module', async () => {
		window.__registeredWidgetTypes = [
			{ name: 'test/no-module', render_module: 'test/render' },
		];

		const types = await resolveSelect( store ).getWidgetTypes();

		expect( types ).toEqual( [] );
	} );

	it( 'skips entries whose widget_module fails to import', async () => {
		window.__registeredWidgetTypes = [
			{
				name: 'test/broken',
				render_module: 'test/render',
				widget_module: '/nonexistent/widget-module.js',
			},
		];

		const types = await resolveSelect( store ).getWidgetTypes();

		expect( types ).toEqual( [] );
	} );
} );
