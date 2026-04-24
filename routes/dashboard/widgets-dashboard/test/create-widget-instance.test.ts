/**
 * Internal dependencies
 */
import { createWidgetInstance } from '../create-widget-instance';
import type { WidgetType } from '../types';

const baseType: WidgetType = {
	apiVersion: 1,
	name: 'core/example',
	title: 'Example',
	renderModule: 'https://example.test/widget.js',
};

describe( 'createWidgetInstance', () => {
	it( 'stamps the type name and a unique uuid', () => {
		const a = createWidgetInstance( baseType );
		const b = createWidgetInstance( baseType );

		expect( a.type ).toBe( 'core/example' );
		expect( b.type ).toBe( 'core/example' );
		expect( a.uuid ).not.toBe( b.uuid );
		expect( a.uuid ).toMatch( /^[0-9a-f-]{36}$/ );
	} );

	it( 'applies default placement values', () => {
		const instance = createWidgetInstance( baseType );
		expect( instance.placement ).toEqual( {
			width: 1,
			height: 2,
			order: 0,
		} );
	} );

	it( 'uses initialAttributes when provided', () => {
		const instance = createWidgetInstance< { greeting: string } >(
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
		const instance = createWidgetInstance( typeWithExample );
		expect( instance.attributes ).toEqual( { greeting: 'default' } );
	} );

	it( 'leaves attributes undefined when no example and no initial provided', () => {
		const instance = createWidgetInstance( baseType );
		expect( instance.attributes ).toBeUndefined();
	} );
} );
