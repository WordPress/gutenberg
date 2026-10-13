import { describe, expect, it } from 'vitest';
import type { RichTextValue } from '@wordpress/rich-text';
import { getActiveColors, parseClassName, setColors } from '../inline';

const name = 'core/text-color';
const palette = [
	{ slug: 'black', color: '#000000' },
	{ slug: 'white', color: '#ffffff' },
	{ slug: 'cyan-bluish-gray', color: '#abb8c3' },
];
const CUSTOM = '#123456';

function valueWith( attributes?: Record< string, string > ): RichTextValue {
	return {
		text: '1',
		formats: [ attributes ? [ { type: name, attributes } ] : undefined ],
		replacements: [ undefined ],
		start: 0,
		end: 1,
	} as RichTextValue;
}

function attributesOf( value: RichTextValue ) {
	return value.formats[ 0 ]?.[ 0 ]?.attributes;
}

describe( 'parseClassName', () => {
	it( 'reads a text colour class with a dashed slug', () => {
		expect(
			parseClassName(
				'has-inline-color has-cyan-bluish-gray-color',
				palette
			)
		).toEqual( { color: '#abb8c3' } );
	} );

	it( 'reads a background colour class', () => {
		expect(
			parseClassName(
				'has-inline-color has-black-background-color',
				palette
			)
		).toEqual( { backgroundColor: '#000000' } );
	} );

	it( 'does not read a background class as a text colour', () => {
		expect(
			parseClassName( 'has-black-background-color', palette ).color
		).toBeUndefined();
	} );

	it( 'reads a text colour class that ends in -background', () => {
		const colors = [
			...palette,
			{ slug: 'light-background', color: '#dddddd' },
		];

		expect(
			parseClassName( 'has-light-background-color', colors )
		).toEqual( { color: '#dddddd' } );
	} );
} );

describe( 'getActiveColors', () => {
	it( 'still reads a background colour from an inline style', () => {
		const value = valueWith( { style: 'background-color:#000000' } );

		expect( getActiveColors( value, name, palette ) ).toEqual( {
			backgroundColor: '#000000',
		} );
	} );

	it( 'reads text and background colours together', () => {
		const value = valueWith( {
			class: 'has-inline-color has-white-color has-black-background-color',
		} );

		expect( getActiveColors( value, name, palette ) ).toEqual( {
			color: '#ffffff',
			backgroundColor: '#000000',
		} );
	} );
} );

describe( 'setColors', () => {
	it( 'stores a palette background colour as a class', () => {
		const attributes = attributesOf(
			setColors( valueWith(), name, palette, {
				backgroundColor: '#000000',
			} )
		);

		expect( attributes?.class ).toContain( 'has-black-background-color' );
		expect( attributes?.style ?? '' ).not.toContain( 'background-color' );
	} );

	it( 'keeps text and background classes together', () => {
		const withText = setColors( valueWith(), name, palette, {
			color: '#ffffff',
		} );
		const attributes = attributesOf(
			setColors( withText, name, palette, {
				backgroundColor: '#000000',
			} )
		);

		expect( attributes?.class ).toContain( 'has-white-color' );
		expect( attributes?.class ).toContain( 'has-black-background-color' );
	} );

	it( 'keeps a custom background colour inline', () => {
		const attributes = attributesOf(
			setColors( valueWith(), name, palette, { backgroundColor: CUSTOM } )
		);

		expect( attributes?.style ).toBe( `background-color:${ CUSTOM }` );
		expect( attributes?.class ?? '' ).not.toContain( 'background-color' );
	} );

	it( 'keeps the transparent override when only a text colour is set', () => {
		const attributes = attributesOf(
			setColors( valueWith(), name, palette, { color: '#ffffff' } )
		);

		expect( attributes?.style ).toBe( 'background-color:rgba(0, 0, 0, 0)' );
		expect( attributes?.class ).toBe( 'has-white-color' );
	} );

	it( 'keeps a background inline when its class would be ambiguous', () => {
		const colors = [
			...palette,
			{ slug: 'light', color: '#eeeeee' },
			{ slug: 'light-background', color: '#dddddd' },
		];
		const attributes = attributesOf(
			setColors( valueWith(), name, colors, {
				backgroundColor: '#eeeeee',
			} )
		);

		expect( attributes?.style ).toBe( 'background-color:#eeeeee' );
	} );

	it( 'removes the format when both colours are cleared', () => {
		const value = valueWith( { class: 'has-black-background-color' } );

		expect(
			attributesOf(
				setColors( value, name, palette, {
					backgroundColor: undefined,
				} )
			)
		).toBeUndefined();
	} );
} );
