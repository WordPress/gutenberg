/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { store } from '../';
import type { WidgetName, WidgetType } from '../../types';

const baseSettings = ( name: WidgetName ): Partial< WidgetType > => ( {
	name,
	apiVersion: 1,
	title: 'Test Widget',
	renderModule: 'test/widget/render',
} );

describe( 'widget-types actions', () => {
	beforeEach( () => {
		const types = select( store ).getWidgetTypes();
		for ( const type of types ) {
			dispatch( store ).unregisterWidgetType( type.name );
		}
	} );

	describe( 'registerWidgetType', () => {
		it( 'registers a valid widget type', () => {
			dispatch( store ).registerWidgetType(
				'test/widget',
				baseSettings( 'test/widget' )
			);

			expect(
				select( store ).getWidgetType( 'test/widget' )
			).toMatchObject( {
				name: 'test/widget',
				title: 'Test Widget',
				renderModule: 'test/widget/render',
			} );
		} );

		it( 'preserves the rich shape (apiVersion, attributes, example)', () => {
			dispatch( store ).registerWidgetType( 'test/widget', {
				...baseSettings( 'test/widget' ),
				attributes: [
					{ id: 'count', type: 'integer', label: 'Count' },
				],
				example: { attributes: { count: 5 } },
			} );

			const widget = select( store ).getWidgetType( 'test/widget' );
			expect( widget?.apiVersion ).toBe( 1 );
			expect( widget?.attributes ).toHaveLength( 1 );
			expect( widget?.example ).toEqual( {
				attributes: { count: 5 },
			} );
		} );

		it( 'warns when name is not a string', () => {
			dispatch( store ).registerWidgetType(
				// @ts-expect-error testing runtime validation
				123,
				baseSettings( 'test/widget' )
			);

			expect( console ).toHaveWarnedWith(
				'Widget type names must be strings.'
			);
		} );

		it( 'warns when name lacks the namespace prefix', () => {
			dispatch( store ).registerWidgetType(
				'no-prefix' as WidgetName,
				baseSettings( 'no-prefix' as WidgetName )
			);

			expect( console ).toHaveWarnedWith(
				'Widget type names must contain a namespace prefix, e.g. core/on-this-day'
			);
		} );

		it( 'warns when title is missing', () => {
			dispatch( store ).registerWidgetType( 'test/widget', {
				name: 'test/widget',
				apiVersion: 1,
				renderModule: 'test/widget/render',
			} );

			expect( console ).toHaveWarnedWith(
				'The widget "test/widget" must have a title.'
			);
		} );

		it( 'warns when title is not a string', () => {
			dispatch( store ).registerWidgetType( 'test/widget', {
				...baseSettings( 'test/widget' ),
				// @ts-expect-error testing runtime validation
				title: 123,
			} );

			expect( console ).toHaveWarnedWith(
				'Widget type titles must be strings.'
			);
		} );

		it( 'warns when description is not a string', () => {
			dispatch( store ).registerWidgetType( 'test/widget', {
				...baseSettings( 'test/widget' ),
				// @ts-expect-error testing runtime validation
				description: 42,
			} );

			expect( console ).toHaveWarnedWith(
				'Widget type descriptions must be strings.'
			);
		} );

		it( 'warns when attributes is not an array', () => {
			dispatch( store ).registerWidgetType( 'test/widget', {
				...baseSettings( 'test/widget' ),
				// @ts-expect-error testing runtime validation
				attributes: { foo: 'bar' },
			} );

			expect( console ).toHaveWarnedWith(
				'Widget type attributes must be an array.'
			);
		} );

		it( 'warns when renderModule is missing', () => {
			dispatch( store ).registerWidgetType( 'test/widget', {
				name: 'test/widget',
				apiVersion: 1,
				title: 'Test',
			} );

			expect( console ).toHaveWarnedWith(
				'The widget "test/widget" must have a renderModule.'
			);
		} );

		it( 'warns on duplicate registration and does not overwrite', () => {
			dispatch( store ).registerWidgetType( 'test/widget', {
				...baseSettings( 'test/widget' ),
				title: 'First',
			} );
			dispatch( store ).registerWidgetType( 'test/widget', {
				...baseSettings( 'test/widget' ),
				title: 'Second',
			} );

			expect( console ).toHaveWarnedWith(
				'Widget type "test/widget" is already registered.'
			);
			expect(
				select( store ).getWidgetType( 'test/widget' )?.title
			).toBe( 'First' );
		} );

		it( 'applies the widgets.registerWidgetType filter before storing', () => {
			addFilter(
				'widgets.registerWidgetType',
				'test/icon-injector',
				( settings: Partial< WidgetType > ) => ( {
					...settings,
					icon: 'star',
				} )
			);

			dispatch( store ).registerWidgetType(
				'test/widget',
				baseSettings( 'test/widget' )
			);

			expect( select( store ).getWidgetType( 'test/widget' )?.icon ).toBe(
				'star'
			);

			removeFilter( 'widgets.registerWidgetType', 'test/icon-injector' );
		} );

		it( 'applies defaults for missing optional fields', () => {
			dispatch( store ).registerWidgetType( 'test/widget', {
				name: 'test/widget',
				apiVersion: 1,
				title: 'Test Widget',
				renderModule: 'test/widget/render',
			} );

			const widget = select( store ).getWidgetType( 'test/widget' );
			expect( widget?.keywords ).toEqual( [] );
			expect( widget?.attributes ).toEqual( [] );
		} );

		it( 'defaults apiVersion to 1 when missing', () => {
			dispatch( store ).registerWidgetType( 'test/widget', {
				name: 'test/widget',
				title: 'Test Widget',
				renderModule: 'test/widget/render',
			} );

			expect(
				select( store ).getWidgetType( 'test/widget' )?.apiVersion
			).toBe( 1 );
		} );

		it( 'preserves author-provided values over defaults', () => {
			dispatch( store ).registerWidgetType( 'test/widget', {
				...baseSettings( 'test/widget' ),
				keywords: [ 'foo', 'bar' ],
			} );

			expect(
				select( store ).getWidgetType( 'test/widget' )?.keywords
			).toEqual( [ 'foo', 'bar' ] );
		} );
	} );

	describe( 'unregisterWidgetType', () => {
		it( 'warns when the widget type is not registered', () => {
			dispatch( store ).unregisterWidgetType( 'test/missing' );

			expect( console ).toHaveWarnedWith(
				'Widget type "test/missing" is not registered.'
			);
		} );

		it( 'removes a registered widget from the store', () => {
			dispatch( store ).registerWidgetType(
				'test/widget',
				baseSettings( 'test/widget' )
			);
			expect(
				select( store ).getWidgetType( 'test/widget' )
			).toBeDefined();

			dispatch( store ).unregisterWidgetType( 'test/widget' );
			expect(
				select( store ).getWidgetType( 'test/widget' )
			).toBeUndefined();
		} );

		it( 'returns the removed widget type', async () => {
			dispatch( store ).registerWidgetType(
				'test/widget',
				baseSettings( 'test/widget' )
			);

			const removed =
				await dispatch( store ).unregisterWidgetType( 'test/widget' );

			expect( removed ).toMatchObject( {
				name: 'test/widget',
				title: 'Test Widget',
				renderModule: 'test/widget/render',
			} );
		} );
	} );

	describe( 'getWidgetTypes', () => {
		it( 'returns all registered widgets as an array', () => {
			dispatch( store ).registerWidgetType(
				'test/one',
				baseSettings( 'test/one' )
			);
			dispatch( store ).registerWidgetType(
				'test/two',
				baseSettings( 'test/two' )
			);

			const all = select( store ).getWidgetTypes();
			expect( all ).toHaveLength( 2 );
			expect( all.map( ( t ) => t.name ).sort() ).toEqual( [
				'test/one',
				'test/two',
			] );
		} );

		it( 'returns an empty array when none are registered', () => {
			expect( select( store ).getWidgetTypes() ).toEqual( [] );
		} );
	} );
} );
