/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getHTMLRootElementClasses } from '../custom-class-name';

describe( 'custom className', () => {
	const blockSettings = {
		save: () => <div className="default" />,
		category: 'common',
		title: 'block title',
	};

	const dynamicBlockSettings = {
		save: () => null,
		category: 'common',
		title: 'block title',
	};

	describe( 'addAttribute()', () => {
		const addAttribute = applyFilters.bind(
			null,
			'blocks.registerBlockType'
		);

		it( 'should do nothing if the block settings disable custom className support', () => {
			const settings = addAttribute( {
				...blockSettings,
				supports: {
					customClassName: false,
				},
			} );

			expect( settings.attributes ).toBe( undefined );
		} );

		it( 'should assign a new custom className attribute', () => {
			const settings = addAttribute( blockSettings );

			expect( settings.attributes ).toHaveProperty( 'className' );
		} );
	} );

	describe( 'addSaveProps', () => {
		const addSaveProps = applyFilters.bind(
			null,
			'blocks.getSaveContent.extraProps'
		);

		it( 'should do nothing if the block settings do not define custom className support', () => {
			const attributes = { className: 'foo' };
			const extraProps = addSaveProps(
				{},
				{
					...blockSettings,
					supports: {
						customClassName: false,
					},
				},
				attributes
			);

			expect( extraProps ).not.toHaveProperty( 'className' );
		} );

		it( 'should inject the custom className', () => {
			const attributes = { className: 'bar' };
			const extraProps = addSaveProps(
				{ className: 'foo' },
				blockSettings,
				attributes
			);

			expect( extraProps.className ).toBe( 'foo bar' );
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

	describe( 'addParsedDifference', () => {
		const addParsedDifference = applyFilters.bind(
			null,
			'blocks.getBlockAttributes'
		);

		it( 'should do nothing if the block settings do not define custom className support', () => {
			const attributes = addParsedDifference(
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
			const attributes = addParsedDifference(
				{ className: 'foo' },
				blockSettings,
				'<div class="default foo bar baz"></div>'
			);

			expect( attributes.className ).toBe( 'foo bar baz' );
		} );

		it( 'should assign as undefined if there are no classes', () => {
			const attributes = addParsedDifference(
				{},
				blockSettings,
				'<div class=""></div>'
			);

			expect( attributes.className ).toBeUndefined();
		} );

		it( 'should add a custom class name to an element without a class', () => {
			const attributes = addParsedDifference(
				{},
				blockSettings,
				'<div class="default foo"></div>'
			);

			expect( attributes.className ).toBe( 'foo' );
		} );

		it( 'should remove the custom class and retain default class', () => {
			const attributes = addParsedDifference(
				{ className: 'custom1 custom2' },
				blockSettings,
				'<div class="default custom1"></div>'
			);

			expect( attributes.className ).toBe( 'custom1' );
		} );

		it( 'should remove the custom class from an element originally without a class', () => {
			const attributes = addParsedDifference(
				{ className: 'foo' },
				blockSettings,
				'<div></div>'
			);

			expect( attributes.className ).toBeUndefined();
		} );

		it( 'should remove the custom classes and retain default and other custom class', () => {
			const attributes = addParsedDifference(
				{ className: 'custom1 custom2 custom3' },
				blockSettings,
				'<div class="default custom1 custom3"></div>'
			);

			expect( attributes.className ).toBe( 'custom1 custom3' );
		} );

		it( 'should not remove the custom classes for dynamic blocks', () => {
			const attributes = addParsedDifference(
				{ className: 'custom1' },
				dynamicBlockSettings,
				null
			);

			expect( attributes.className ).toBe( 'custom1' );
		} );
	} );
} );
