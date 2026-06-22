/**
 * WordPress dependencies
 */
import type { WidgetType } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { createDashboardWidget } from '../utils/create-dashboard-widget';

const baseType: WidgetType = {
	apiVersion: 1,
	name: 'core/example',
	title: 'Example',
	renderModule: 'https://example.test/widget.js',
};

describe( 'createDashboardWidget', () => {
	it( 'stamps the type name and a unique uuid', () => {
		const a = createDashboardWidget( baseType );
		const b = createDashboardWidget( baseType );

		expect( a.type ).toBe( 'core/example' );
		expect( b.type ).toBe( 'core/example' );
		expect( a.uuid ).not.toBe( b.uuid );
		expect( a.uuid ).toMatch( /^[0-9a-f-]{36}$/ );
	} );

	it( 'applies default placement values', () => {
		const instance = createDashboardWidget( baseType );
		expect( instance.placement ).toEqual( {
			width: 1,
			height: 2,
			order: 0,
		} );
	} );

	it( 'maps compact initial size to a compact placement', () => {
		const instance = createDashboardWidget( {
			...baseType,
			initialSize: 'compact',
		} );

		expect( instance.placement ).toEqual( {
			width: 1,
			height: 1,
			order: 0,
		} );
	} );

	it( 'maps regular initial size to the default placement', () => {
		const instance = createDashboardWidget( {
			...baseType,
			initialSize: 'regular',
		} );

		expect( instance.placement ).toEqual( {
			width: 1,
			height: 2,
			order: 0,
		} );
	} );

	it( 'maps wide initial size to a wide placement', () => {
		const instance = createDashboardWidget( {
			...baseType,
			initialSize: 'wide',
		} );

		expect( instance.placement ).toEqual( {
			width: 2,
			height: 1,
			order: 0,
		} );
	} );

	it( 'maps large initial size to a large placement', () => {
		const instance = createDashboardWidget( {
			...baseType,
			initialSize: 'large',
		} );

		expect( instance.placement ).toEqual( {
			width: 2,
			height: 2,
			order: 0,
		} );
	} );

	it( 'ignores unsupported runtime placement fields', () => {
		const instance = createDashboardWidget( {
			...baseType,
			initialSize: 'wide',
			order: 99,
		} as WidgetType & { order: number } );

		expect( instance.placement ).toEqual( {
			width: 2,
			height: 1,
			order: 0,
		} );
	} );

	it( 'uses initialAttributes when provided', () => {
		const instance = createDashboardWidget< { greeting: string } >(
			baseType,
			{ greeting: 'hi' }
		);
		expect( instance.attributes ).toEqual( { greeting: 'hi' } );
	} );

	it( 'falls back to the type example attributes when no attributes are supplied', () => {
		const typeWithExample: WidgetType = {
			...baseType,
			example: { attributes: { greeting: 'default' } },
		};
		const instance = createDashboardWidget( typeWithExample );
		expect( instance.attributes ).toEqual( { greeting: 'default' } );
	} );

	it( 'leaves attributes undefined when no example and no initial provided', () => {
		const instance = createDashboardWidget( baseType );
		expect( instance.attributes ).toBeUndefined();
	} );
} );
