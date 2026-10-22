import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	InnerBlocks,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	createBlock,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { createRegistry } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import { convertSyncedPatternToStatic } from '../actions';

const PATTERN_OVERRIDES_BINDING = { source: 'core/pattern-overrides' };

const getContents = ( blocks: Block[] ) =>
	blocks.map( ( block ) => block.attributes.content );

/**
 * Detaches a synced pattern holding a named block, and an area whose inner
 * blocks can be overridden, and returns the blocks that replace the pattern.
 *
 * @param content The overrides of the pattern instance.
 *
 * @return The blocks of the editor after detaching.
 */
function detachPatternWithArea( content: Record< string, unknown > ) {
	const pattern = createBlock( 'core/block', { ref: 1, content }, [
		createBlock(
			'test/area',
			{
				metadata: {
					name: 'Area',
					bindings: { innerBlocks: PATTERN_OVERRIDES_BINDING },
				},
			},
			[ createBlock( 'test/text', { content: 'Default' } ) ]
		),
		createBlock( 'test/text', {
			content: 'Default',
			metadata: {
				name: 'Title',
				bindings: { __default: PATTERN_OVERRIDES_BINDING },
			},
		} ),
	] );
	const registry = createRegistry();
	registry.register( blockEditorStore );
	registry.dispatch( blockEditorStore ).resetBlocks( [ pattern ] );

	convertSyncedPatternToStatic( pattern.clientId )( { registry } );

	return registry.select( blockEditorStore ).getBlocks();
}

describe( 'convertSyncedPatternToStatic', () => {
	beforeAll( () => {
		registerBlockType( 'core/block', {
			apiVersion: 3,
			title: 'Pattern',
			category: 'reusable',
			attributes: {
				ref: { type: 'number' },
				content: { type: 'object' },
			},
			save: () => null,
		} );
		registerBlockType( 'test/text', {
			apiVersion: 3,
			title: 'Text',
			category: 'text',
			attributes: {
				content: { type: 'string' },
				metadata: { type: 'object' },
			},
			save: () => null,
		} );
		registerBlockType( 'test/area', {
			apiVersion: 3,
			title: 'Area',
			category: 'design',
			attributes: {
				metadata: { type: 'object' },
			},
			save: () => createElement( InnerBlocks.Content ),
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/block' );
		unregisterBlockType( 'test/text' );
		unregisterBlockType( 'test/area' );
	} );

	it( 'keeps the overridden inner blocks of a block', () => {
		const [ area ] = detachPatternWithArea( {
			Area: {
				innerBlocks: serialize( [
					createBlock( 'test/text', { content: 'First' } ),
					createBlock( 'test/text', { content: 'Second' } ),
				] ),
			},
		} );

		expect( area.attributes.metadata ).toEqual( { name: 'Area' } );
		expect( getContents( area.innerBlocks ) ).toEqual( [
			'First',
			'Second',
		] );
	} );

	it( 'keeps the inner blocks of a block emptied in the pattern instance', () => {
		const [ area ] = detachPatternWithArea( {
			Area: { innerBlocks: '' },
		} );

		expect( area.innerBlocks ).toEqual( [] );
	} );

	it( 'keeps the inner blocks of the pattern when they are not overridden', () => {
		const [ area, title ] = detachPatternWithArea( {
			Title: { content: 'Overridden' },
		} );

		expect( getContents( area.innerBlocks ) ).toEqual( [ 'Default' ] );
		expect( title.attributes ).toMatchObject( {
			content: 'Overridden',
			metadata: { name: 'Title' },
		} );
	} );

	it( 'does not apply the other overrides of the instance to the overridden inner blocks', () => {
		const [ area ] = detachPatternWithArea( {
			Area: {
				innerBlocks: serialize( [
					createBlock( 'test/text', {
						content: 'Stored',
						metadata: {
							name: 'Title',
							bindings: { __default: PATTERN_OVERRIDES_BINDING },
						},
					} ),
				] ),
			},
			Title: { content: 'Overridden' },
		} );

		expect( area.innerBlocks[ 0 ].attributes.content ).toBe( 'Stored' );
		expect( area.innerBlocks[ 0 ].attributes.metadata ).toEqual( {
			name: 'Title',
		} );
	} );
} );
