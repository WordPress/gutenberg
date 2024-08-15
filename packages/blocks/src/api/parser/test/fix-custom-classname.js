/**
 * Internal dependencies
 */
import {
	fixCustomClassname,
	getHTMLRootElementClasses,
} from '../fix-custom-classname';

describe( 'Fix custom className', () => {
	const blockSettings = {
		save: () => <div className="default" />,
		category: 'text',
		title: 'block title',
	};

	const dynamicBlockSettings = {
		save: () => null,
		category: 'text',
		title: 'block title',
	};

	it( 'should do nothing if the block settings do not define custom className support', () => {
		const attributes = fixCustomClassname(
			{ className: 'foo' },
			{
				...blockSettings,
				supports: {
					customClassName: false,
				},
			},
			'<div class="bar baz"></div>'
		);

		expect( attributes.className ).toBe( 'foo' );
	} );

	it( 'should inject the className differences from parsed attributes', () => {
		const attributes = fixCustomClassname(
			{ className: 'foo' },
			blockSettings,
			'<div class="default foo bar baz"></div>'
		);

		expect( attributes.className ).toBe( 'foo bar baz' );
	} );

	it( 'should assign as undefined if there are no classes', () => {
		const attributes = fixCustomClassname(
			{},
			blockSettings,
			'<div class=""></div>'
		);

		expect( attributes.className ).toBeUndefined();
	} );

	it( 'should add a custom class name to an element without a class', () => {
		const attributes = fixCustomClassname(
			{},
			blockSettings,
			'<div class="default foo"></div>'
		);

		expect( attributes.className ).toBe( 'foo' );
	} );

	it( 'should remove the custom class and retain default class', () => {
		const attributes = fixCustomClassname(
			{ className: 'custom1 custom2' },
			blockSettings,
			'<div class="default custom1"></div>'
		);

		expect( attributes.className ).toBe( 'custom1' );
	} );

	it( 'should remove the custom class from an element originally without a class', () => {
		const attributes = fixCustomClassname(
			{ className: 'foo' },
			blockSettings,
			'<div></div>'
		);

		expect( attributes.className ).toBeUndefined();
	} );

	it( 'should remove the custom classes and retain default and other custom class', () => {
		const attributes = fixCustomClassname(
			{ className: 'custom1 custom2 custom3' },
			blockSettings,
			'<div class="default custom1 custom3"></div>'
		);

		expect( attributes.className ).toBe( 'custom1 custom3' );
	} );

	it( 'should not remove the custom classes for dynamic blocks', () => {
		const attributes = fixCustomClassname(
			{ className: 'custom1' },
			dynamicBlockSettings,
			null
		);

		expect( attributes.className ).toBe( 'custom1' );
	} );
} );

describe( 'getHTMLRootElementClasses', () => {
	it( 'should return an empty array if there are no classes', () => {
		const classes = getHTMLRootElementClasses( '<div></div>' );

		expect( classes ).toEqual( [] );
	} );

	it( 'return an array of parsed classes from inner HTML', () => {
		const classes = getHTMLRootElementClasses(
			'<div class="  foo  bar "></div>'
		);

		expect( classes ).toEqual( [ 'foo', 'bar' ] );
	} );
} );
