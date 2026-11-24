import { describe, expect, it } from 'vitest';
import { applyFilters } from '@wordpress/hooks';
import type { BlockType } from '@wordpress/blocks';
import anchor from '../anchor';

const noop = () => {};

describe( 'anchor', () => {
	const blockSettings = {
		save: noop,
		category: 'text',
		title: 'block title',
	};
	const blockType = {
		...blockSettings,
		save: () => null,
		name: 'core/test-block',
		icon: { src: 'block-default' },
		attributes: {},
	};

	describe( 'addAttribute()', () => {
		// Filters return `unknown`; this one returns the block settings.
		const registerBlockType = applyFilters.bind(
			null,
			'blocks.registerBlockType'
		) as ( ...args: unknown[] ) => BlockType;

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
			const extraProps = anchor.addSaveProps( {}, blockType, attributes );

			expect( extraProps ).not.toHaveProperty( 'id' );
		} );

		it( 'should inject anchor attribute ID', () => {
			const attributes = { anchor: 'foo' };
			const extraProps = anchor.addSaveProps(
				{},
				{
					...blockType,
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
					...blockType,
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
