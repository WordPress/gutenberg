/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import anchor from '../anchor';

const noop = () => {};

describe( 'anchor', () => {
	const blockSettings = {
		save: noop,
		category: 'text',
		title: 'block title',
	};

	describe( 'addAttribute()', () => {
		const registerBlockType = applyFilters.bind(
			null,
			'blocks.registerBlockType'
		);

		it( 'should do nothing if the block settings do not define anchor support', () => {
			const settings = registerBlockType( blockSettings );

			expect( settings.attributes ).toBe( undefined );
		} );

		it( 'should assign a new anchor attribute', () => {
			const settings = registerBlockType( {
				...blockSettings,
				supports: {
					anchor: true,
				},
			} );

			expect( settings.attributes ).toHaveProperty( 'anchor' );
		} );

		it( 'should not override attributes defined in settings', () => {
			const settings = registerBlockType( {
				...blockSettings,
				supports: {
					anchor: true,
				},
				attributes: {
					anchor: {
						type: 'string',
						default: 'testAnchor',
					},
				},
			} );

			expect( settings.attributes.anchor ).toEqual( {
				type: 'string',
				default: 'testAnchor',
			} );
		} );
	} );

	describe( 'addSaveProps', () => {
		it( 'should do nothing if the block settings do not define anchor support', () => {
			const attributes = { anchor: 'foo' };
			const extraProps = anchor.addSaveProps(
				{},
				blockSettings,
				attributes
			);

			expect( extraProps ).not.toHaveProperty( 'id' );
		} );

		it( 'should inject anchor attribute ID', () => {
			const attributes = { anchor: 'foo' };
			const extraProps = anchor.addSaveProps(
				{},
				{
					...blockSettings,
					supports: {
						anchor: true,
					},
				},
				attributes
			);

			expect( extraProps.id ).toBe( 'foo' );
		} );

		it( 'should remove an anchor attribute ID when field is cleared', () => {
			const attributes = { anchor: '' };
			const extraProps = anchor.addSaveProps(
				{},
				{
					...blockSettings,
					supports: {
						anchor: true,
					},
				},
				attributes
			);

			expect( extraProps.id ).toBe( null );
		} );
	} );
} );
