import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import type { InserterItem } from '../../store/types';
import blockCompleter from '../block';

// This completer always replaces blocks and does not use a query.
const getOptionCompletion = blockCompleter.getOptionCompletion as (
	item: InserterItem
) => { action: 'replace'; value: Block | Block[] };

describe( 'block autocompleter', () => {
	beforeAll( () => {
		registerBlockType( 'core/block', {
			apiVersion: 3,
			save: () => null,
			category: 'reusable',
			title: 'Pattern',
			attributes: {
				ref: {
					type: 'number',
				},
			},
		} );
		registerBlockType( 'core/html', {
			apiVersion: 3,
			save: () => null,
			category: 'text',
			title: 'Custom HTML',
			attributes: {},
		} );
		registerBlockType( 'core/paragraph', {
			apiVersion: 3,
			// The content attribute is a string.
			save: ( { attributes } ) =>
				( attributes.content as string ) || null,
			category: 'text',
			title: 'Paragraph',
			attributes: { content: { type: 'string', source: 'html' } },
		} );
		registerBlockType( 'core/buttons', {
			apiVersion: 3,
			save: () => null,
			category: 'design',
			title: 'Buttons',
			attributes: {},
		} );
		registerBlockType( 'core/button', {
			apiVersion: 3,
			save: () => null,
			category: 'design',
			title: 'Button',
			parent: [ 'core/buttons' ],
			attributes: {
				text: { type: 'string' },
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/block' );
		unregisterBlockType( 'core/html' );
		unregisterBlockType( 'core/paragraph' );
		unregisterBlockType( 'core/button' );
		unregisterBlockType( 'core/buttons' );
	} );

	describe( 'getOptionCompletion', () => {
		it( "carries a variation's innerContent onto the inserted block", () => {
			const { action, value } = getOptionCompletion( {
				id: 'core/html',
				name: 'core/html',
				isDisabled: false,
				frecency: 0,
				initialAttributes: {},
				innerBlocks: [ [ 'core/paragraph', { content: 'Editable' } ] ],
				innerContent: [ '<div class="card">', null, '</div>' ],
			} );

			// An item that is not a pattern completes to a single block.
			const block = value as Block;
			expect( action ).toBe( 'replace' );
			expect( block.name ).toBe( 'core/html' );
			expect( block.innerContent ).toEqual( [
				'<div class="card">',
				null,
				'</div>',
			] );
			expect( block.innerBlocks ).toHaveLength( 1 );
			expect( block.innerBlocks[ 0 ].name ).toBe( 'core/paragraph' );
		} );

		it( 'falls back when an unsynced pattern has no parsed blocks', () => {
			const { action, value } = getOptionCompletion( {
				id: 'core/block/9',
				name: 'core/block',
				isDisabled: false,
				frecency: 0,
				initialAttributes: { ref: 9 },
				innerBlocks: [ [ 'core/paragraph', { content: 'Fallback' } ] ],
				innerContent: [ '<div>', null, '</div>' ],
				syncStatus: 'unsynced',
				blocks: [],
			} );

			expect( action ).toBe( 'replace' );
			const block = value as Block;
			expect( block.name ).toBe( 'core/block' );
			expect( block.attributes ).toEqual( { ref: 9 } );
			expect( block.innerBlocks ).toEqual( [] );
		} );

		it( 'keeps cloned blocks when an unsynced pattern has parsed blocks', () => {
			const sourceBlock = {
				name: 'core/paragraph',
				attributes: { content: 'From pattern' },
				innerBlocks: [],
				clientId: 'source-client-id',
				isValid: true,
			};

			const { value } = getOptionCompletion( {
				id: 'core/html',
				name: 'core/html',
				isDisabled: false,
				frecency: 0,
				syncStatus: 'unsynced',
				blocks: [ sourceBlock ],
			} );

			expect( Array.isArray( value ) ).toBe( true );
			expect( value ).toHaveLength( 1 );
			const blocks = value as Block[];
			expect( blocks[ 0 ] ).not.toBe( sourceBlock );
			expect( blocks[ 0 ].name ).toBe( 'core/paragraph' );
			expect( blocks[ 0 ].attributes ).toEqual( {
				content: 'From pattern',
			} );
		} );

		it( 'keeps unsynced reusable patterns as a pattern block when parsed blocks are child-only', () => {
			const sourceBlock = {
				name: 'core/button',
				attributes: { text: 'Fake Text!' },
				innerBlocks: [],
				clientId: 'child-only-client-id',
				isValid: true,
			};

			const { value } = getOptionCompletion( {
				id: 'core/block/18',
				name: 'core/block',
				isDisabled: false,
				frecency: 0,
				initialAttributes: { ref: 18 },
				syncStatus: 'unsynced',
				blocks: [ sourceBlock ],
			} );

			expect( Array.isArray( value ) ).toBe( false );
			const block = value as Block;
			expect( block.name ).toBe( 'core/block' );
			expect( block.attributes ).toEqual( { ref: 18 } );
		} );
	} );
} );
