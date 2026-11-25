import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
	createBlock,
	registerBlockBindingsSource,
	registerBlockType,
	unregisterBlockBindingsSource,
	unregisterBlockType,
	getBlockType,
} from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import { store as blockEditorStore } from '../../store';
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

	describe( 'edit', () => {
		const sourceName = 'test/auto-inspector-controls-source';

		afterEach( () => {
			unregisterBlockBindingsSource( sourceName );
			dispatch( blockEditorStore ).resetBlocks( [] );
		} );

		it( 'should pass the block clientId to the sources of bound attributes', () => {
			registerBlockType( blockName, {
				apiVersion: 3,
				title: 'Test Block',
				category: 'text',
				attributes: {
					title: {
						type: 'string',
						autoGenerateControl: true,
					},
					metadata: {
						type: 'object',
					},
				} as Record< string, AutoGenerateAttribute >,
				edit: () => null,
				save: () => null,
			} );
			const getValues = vi.fn( () => ( {} ) );
			registerBlockBindingsSource( {
				name: sourceName,
				label: 'Test source',
				getValues,
			} );
			const block = createBlock( blockName, {
				metadata: { bindings: { title: { source: sourceName } } },
			} );
			dispatch( blockEditorStore ).resetBlocks( [ block ] );

			const { unmount } = render(
				createElement( AutoRegisterControls.edit, {
					name: blockName,
					clientId: block.clientId,
					setAttributes: () => {},
				} )
			);

			expect( getValues ).toHaveBeenCalledWith(
				expect.objectContaining( { clientId: block.clientId } )
			);
			unmount();
		} );
	} );

	describe( 'attributeKeys', () => {
		it( 'should be an empty array', () => {
			expect( AutoRegisterControls.attributeKeys ).toEqual( [] );
		} );
	} );
} );
