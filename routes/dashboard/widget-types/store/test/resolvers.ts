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

const FIXTURE_PATH: string = require.resolve(
	'./fixtures/widget-with-default'
);

describe( 'widget-types resolvers', () => {
	beforeEach( async () => {
		delete window.__registeredWidgetTypes;

		const types = select( store ).getWidgetTypes();
		for ( const type of types ) {
			dispatch( store ).unregisterWidgetType( type.name );
		}

		// `select` above schedules the resolver via setTimeout( 0 ); drain it
		// (it is a no-op with the source cleared) and then wipe resolution
		// metadata so the next test starts from a clean slate.
		await new Promise( ( r ) => setTimeout( r, 0 ) );
		await dispatch( store ).invalidateResolutionForStore();
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

	it( 'populates the store on first read', async () => {
		window.__registeredWidgetTypes = [
			{
				name: 'test/sample',
				render_module: 'test/render',
				widget_module: FIXTURE_PATH,
			},
		];

		const types = await resolveSelect( store ).getWidgetTypes();

		expect( types ).toHaveLength( 1 );
		expect( types[ 0 ] ).toMatchObject( {
			name: 'test/sample',
			title: 'Sample Widget',
			renderModule: 'test/render',
		} );
	} );

	it( 'does not re-run the resolver on subsequent reads', async () => {
		window.__registeredWidgetTypes = [
			{
				name: 'test/initial',
				render_module: 'test/render',
				widget_module: FIXTURE_PATH,
			},
		];

		const first = await resolveSelect( store ).getWidgetTypes();
		expect( first.map( ( t ) => t.name ) ).toEqual( [ 'test/initial' ] );

		// Mutate the source between reads. If the resolver fired again, the
		// second read would surface the new entry. It must not.
		window.__registeredWidgetTypes = [
			{
				name: 'test/different',
				render_module: 'test/render',
				widget_module: FIXTURE_PATH,
			},
		];

		const second = await resolveSelect( store ).getWidgetTypes();

		expect( second.map( ( t ) => t.name ) ).toEqual( [ 'test/initial' ] );
		expect( second ).toHaveLength( 1 );
	} );
} );
