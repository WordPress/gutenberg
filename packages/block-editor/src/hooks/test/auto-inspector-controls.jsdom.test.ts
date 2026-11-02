import { afterEach, describe, expect, it } from 'vitest';
import {
	registerBlockType,
	unregisterBlockType,
	getBlockType,
} from '@wordpress/blocks';
import AutoRegisterControls from '../auto-inspector-controls';
import type { AutoGenerateAttribute } from '../types';

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
			const attributes: Record< string, AutoGenerateAttribute > = {
				title: {
					type: 'string',
					autoGenerateControl: true,
				},
				count: {
					type: 'integer',
					autoGenerateControl: true,
				},
			};
			registerBlockType( blockName, {
				apiVersion: 3,
				title: 'Test Block',
				category: 'text',
				attributes,
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
				attributes: {},
				edit: () => null,
				save: () => null,
			} );

			expect( AutoRegisterControls.hasSupport( blockName ) ).toBe(
				false
			);
		} );

		it( 'should return true when at least one attribute has autoGenerateControl', () => {
			const attributes: Record< string, AutoGenerateAttribute > = {
				// This one has the marker
				title: {
					type: 'string',
					autoGenerateControl: true,
				},
				// This one doesn't (e.g., added by block supports)
				className: {
					type: 'string',
				},
			};
			registerBlockType( blockName, {
				apiVersion: 3,
				title: 'Test Block',
				category: 'text',
				attributes,
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
