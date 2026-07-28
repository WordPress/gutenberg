/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	getBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import AutoRegisterControls from '../auto-inspector-controls';

describe( 'auto-inspector-controls', () => {
	const blockName = 'test/auto-inspector-controls-block';

	afterEach( () => {
		if ( getBlockType( blockName ) ) {
			unregisterBlockType( blockName );
		}
	} );

	describe( 'hasSupport()', () => {
		it( 'should return false for blocks without autoGenerateControl markers', () => {
			registerBlockType( blockName, {
				apiVersion: 3,
				title: 'Test Block',
				category: 'text',
				attributes: {
					content: {
						type: 'string',
					},
				},
				edit: () => null,
				save: () => null,
			} );

			expect( AutoRegisterControls.hasSupport( blockName ) ).toBe(
				false
			);
		} );

		it( 'should return true for blocks with autoGenerateControl markers', () => {
			registerBlockType( blockName, {
				apiVersion: 3,
				title: 'Test Block',
				category: 'text',
				attributes: {
					title: {
						type: 'string',
						autoGenerateControl: true,
					},
					count: {
						type: 'integer',
						autoGenerateControl: true,
					},
				},
				edit: () => null,
				save: () => null,
			} );

			expect( AutoRegisterControls.hasSupport( blockName ) ).toBe( true );
		} );

		it( 'should return false for unregistered blocks', () => {
			expect(
				AutoRegisterControls.hasSupport( 'non/existent-block' )
			).toBe( false );
		} );

		it( 'should return false for blocks with no attributes', () => {
			registerBlockType( blockName, {
				apiVersion: 3,
				title: 'Test Block',
				category: 'text',
				edit: () => null,
				save: () => null,
			} );

			expect( AutoRegisterControls.hasSupport( blockName ) ).toBe(
				false
			);
		} );

		it( 'should return true when at least one attribute has autoGenerateControl', () => {
			registerBlockType( blockName, {
				apiVersion: 3,
				title: 'Test Block',
				category: 'text',
				attributes: {
					// This one has the marker
					title: {
						type: 'string',
						autoGenerateControl: true,
					},
					// This one doesn't (e.g., added by block supports)
					className: {
						type: 'string',
					},
				},
				edit: () => null,
				save: () => null,
			} );

			expect( AutoRegisterControls.hasSupport( blockName ) ).toBe( true );
		} );
	} );

	describe( 'attributeKeys', () => {
		it( 'should be an empty array', () => {
			expect( AutoRegisterControls.attributeKeys ).toEqual( [] );
		} );
	} );
} );
