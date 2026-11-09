import { describe, expect, it } from 'vitest';
import { applyFilters } from '@wordpress/hooks';
import type { BlockType } from '@wordpress/blocks';
import direction from '../direction';

describe( 'direction', () => {
	const blockSettings = {
		save: () => null,
		category: 'text',
		title: 'block title',
	};
	const blockType = {
		...blockSettings,
		name: 'core/test-block',
		icon: { src: 'block-default' },
		attributes: {},
		supports: { typography: { direction: true } },
	};

	describe( 'addAttribute()', () => {
		// Filters return `unknown`; this one returns the block settings.
		const registerBlockType = applyFilters.bind(
			null,
			'blocks.registerBlockType'
		) as ( ...args: unknown[] ) => BlockType;

		it( 'should do nothing without direction support', () => {
			const settings = registerBlockType( blockSettings );

			expect( settings.attributes ).toBe( undefined );
		} );

		it( 'should assign a direction attribute', () => {
			const settings = registerBlockType( {
				...blockSettings,
				supports: { typography: { direction: true } },
			} );

			expect( settings.attributes.direction ).toEqual( {
				type: 'string',
				enum: [ 'ltr', 'rtl', 'auto' ],
			} );
		} );

		it( 'should not override a direction attribute defined by the block', () => {
			const ownAttribute = { type: 'string', enum: [ 'ltr', 'rtl' ] };
			const settings = registerBlockType( {
				...blockSettings,
				supports: { typography: { direction: true } },
				attributes: { direction: ownAttribute },
			} );

			expect( settings.attributes.direction ).toBe( ownAttribute );
		} );
	} );

	describe( 'addSaveProps()', () => {
		it( 'should do nothing without direction support', () => {
			const props = direction.addSaveProps(
				{},
				{ ...blockType, supports: {} },
				{ direction: 'rtl' }
			);

			expect( props ).not.toHaveProperty( 'dir' );
		} );

		it.each( [ 'ltr', 'rtl', 'auto' ] )( 'should add dir="%s"', ( dir ) => {
			const props = direction.addSaveProps( {}, blockType, {
				direction: dir,
			} );

			expect( props.dir ).toBe( dir );
		} );

		it( 'should not add dir when the block skips its serialization', () => {
			const props = direction.addSaveProps(
				{},
				{
					...blockType,
					supports: {
						typography: {
							direction: true,
							__experimentalSkipSerialization: [ 'direction' ],
						},
					},
				},
				{ direction: 'rtl' }
			);

			expect( props ).not.toHaveProperty( 'dir' );
		} );

		it( 'should not add dir when inheriting or given an unknown value', () => {
			expect(
				direction.addSaveProps( {}, blockType, {} )
			).not.toHaveProperty( 'dir' );
			expect(
				direction.addSaveProps( {}, blockType, {
					direction: 'up',
				} )
			).not.toHaveProperty( 'dir' );
		} );
	} );
} );
