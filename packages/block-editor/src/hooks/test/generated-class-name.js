/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import '../generated-class-name';

const noop = () => {};

describe( 'generated className', () => {
	const blockSettings = {
		name: 'produce/fruit',
		save: noop,
		category: 'text',
		title: 'block title',
		attributes: {
			fruit: {
				type: 'string',
				default: 'apple',
			},
		},
	};

	const variations = [
		{
			name: 'apple',
			attributes: {
				fruit: 'apple',
			},
			isActive: [ 'fruit' ],
			isDefault: true,
		},
		{
			name: 'banana',
			attributes: {
				fruit: 'banana',
			},
			isActive: [ 'fruit' ],
		},
	];

	beforeAll( () => {
		registerBlockType( 'produce/fruit', {
			...blockSettings,
			variations,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'produce/fruit' );
	} );

	describe( 'addSaveProps', () => {
		const addSaveProps = applyFilters.bind(
			null,
			'blocks.getSaveContent.extraProps'
		);

		it( 'should do nothing if the block settings do not define generated className support', () => {
			const attributes = { className: 'foo' };
			const extraProps = addSaveProps(
				{},
				{
					...blockSettings,
					supports: {
						className: false,
					},
				},
				attributes
			);

			expect( extraProps ).not.toHaveProperty( 'className' );
		} );

		it( 'should inject the generated className', () => {
			const attributes = { className: 'bar' };
			const extraProps = addSaveProps(
				{ className: 'foo' },
				blockSettings,
				attributes
			);

			expect( extraProps.className ).toBe( 'wp-block-produce-fruit foo' );
		} );

		it( 'should not inject duplicates into className', () => {
			const attributes = { className: 'bar' };
			const extraProps = addSaveProps(
				{ className: 'foo wp-block-produce-fruit' },
				blockSettings,
				attributes
			);

			expect( extraProps.className ).toBe( 'wp-block-produce-fruit foo' );
		} );

		it( "should not inject the generated variation className if support isn't enabled", () => {
			const attributes = { className: 'foo', fruit: 'banana' };
			const extraProps = addSaveProps(
				{},
				{
					...blockSettings,
					variations,
					supports: {
						className: false,
					},
				},
				attributes
			);

			expect( extraProps ).not.toHaveProperty( 'className' );
		} );

		it( 'should inject the generated variation className', () => {
			const attributes = { className: 'bar', fruit: 'banana' };
			const extraProps = addSaveProps(
				{ className: 'foo' },
				{
					...blockSettings,
					variations,
					supports: {
						className: {
							variation: true,
						},
					},
				},
				attributes
			);

			expect( extraProps.className ).toBe(
				'wp-block-produce-fruit-banana foo'
			);
		} );

		it( 'should inject generated classNames for both block and variation', () => {
			const attributes = { className: 'bar', fruit: 'banana' };
			const extraProps = addSaveProps(
				{ className: 'foo' },
				{
					...blockSettings,
					variations,
					supports: {
						className: {
							block: true,
							variation: true,
						},
					},
				},
				attributes
			);

			expect( extraProps.className ).toBe(
				'wp-block-produce-fruit wp-block-produce-fruit-banana foo'
			);
		} );
	} );
} );
