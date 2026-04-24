/**
 * Internal dependencies
 */
import { createWidgetInstance } from '../create-widget-instance';
import type { WidgetType } from '../types';

const baseType: WidgetType = {
	name: 'core/example',
	title: 'Example',
	render_module: 'https://example.test/widget.js',
};

describe( 'createWidgetInstance', () => {
	it( 'stamps the type name and a unique uid', () => {
		const a = createWidgetInstance( baseType );
		const b = createWidgetInstance( baseType );

		expect( a.type ).toBe( 'core/example' );
		expect( b.type ).toBe( 'core/example' );
		expect( a.uid ).not.toBe( b.uid );
		expect( a.uid ).toMatch( /^[0-9a-f-]{36}$/ );
	} );

	it( 'applies default layout values', () => {
		const instance = createWidgetInstance( baseType );
		expect( instance.width ).toBe( 1 );
		expect( instance.height ).toBe( 2 );
		expect( instance.order ).toBe( 0 );
	} );

	it( 'uses initialAttributes when provided', () => {
		const instance = createWidgetInstance< { greeting: string } >(
			baseType,
			{ greeting: 'hi' }
		);
		expect( instance.attributes ).toEqual( { greeting: 'hi' } );
	} );

	it( 'falls back to the type example when no attributes are supplied', () => {
		const typeWithExample: WidgetType = {
			...baseType,
			example: { greeting: 'default' },
		};
		const instance = createWidgetInstance( typeWithExample );
		expect( instance.attributes ).toEqual( { greeting: 'default' } );
	} );

	it( 'leaves attributes undefined when no example and no initial provided', () => {
		const instance = createWidgetInstance( baseType );
		expect( instance.attributes ).toBeUndefined();
	} );
} );
