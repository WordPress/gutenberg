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
import autoInspectorControls from '../auto-inspector-controls';

describe( 'auto-inspector-controls', () => {
	const blockName = 'test/auto-inspector-controls-block';

	afterEach( () => {
		if ( getBlockType( blockName ) ) {
			unregisterBlockType( blockName );
		}
	} );

	describe( 'hasSupport()', () => {
		it( 'should return false for blocks without __experimentalAutoInspectorControl markers', () => {
			registerBlockType( blockName, {
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

			expect( autoInspectorControls.hasSupport( blockName ) ).toBe(
				false
			);
		} );

		it( 'should return true for blocks with __experimentalAutoInspectorControl markers', () => {
			registerBlockType( blockName, {
				title: 'Test Block',
				category: 'text',
				attributes: {
					title: {
						type: 'string',
						__experimentalAutoInspectorControl: true,
					},
					count: {
						type: 'integer',
						__experimentalAutoInspectorControl: true,
					},
				},
				edit: () => null,
				save: () => null,
			} );

			expect( autoInspectorControls.hasSupport( blockName ) ).toBe(
				true
			);
		} );

		it( 'should return false for unregistered blocks', () => {
			expect(
				autoInspectorControls.hasSupport( 'non/existent-block' )
			).toBe( false );
		} );

		it( 'should return false for blocks with no attributes', () => {
			registerBlockType( blockName, {
				title: 'Test Block',
				category: 'text',
				edit: () => null,
				save: () => null,
			} );

			expect( autoInspectorControls.hasSupport( blockName ) ).toBe(
				false
			);
		} );

		it( 'should return true when at least one attribute has __experimentalAutoInspectorControl', () => {
			registerBlockType( blockName, {
				title: 'Test Block',
				category: 'text',
				attributes: {
					// This one has the marker
					title: {
						type: 'string',
						__experimentalAutoInspectorControl: true,
					},
					// This one doesn't (e.g., added by block supports)
					className: {
						type: 'string',
					},
				},
				edit: () => null,
				save: () => null,
			} );

			expect( autoInspectorControls.hasSupport( blockName ) ).toBe(
				true
			);
		} );
	} );

	describe( 'attributeKeys', () => {
		it( 'should be an empty array', () => {
			expect( autoInspectorControls.attributeKeys ).toEqual( [] );
		} );
	} );
} );
