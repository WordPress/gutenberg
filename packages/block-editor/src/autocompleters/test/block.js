import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import blockCompleter from '../block';

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
		} );
		registerBlockType( 'core/paragraph', {
			apiVersion: 3,
			save: ( { attributes } ) => attributes.content || null,
			category: 'text',
			title: 'Paragraph',
			attributes: { content: { type: 'string', source: 'html' } },
		} );
		registerBlockType( 'core/buttons', {
			apiVersion: 3,
			save: () => null,
			category: 'design',
			title: 'Buttons',
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
			const { action, value } = blockCompleter.getOptionCompletion( {
				name: 'core/html',
				initialAttributes: {},
				innerBlocks: [ [ 'core/paragraph', { content: 'Editable' } ] ],
				innerContent: [ '<div class="card">', null, '</div>' ],
			} );

			expect( action ).toBe( 'replace' );
			expect( value.name ).toBe( 'core/html' );
			expect( value.innerContent ).toEqual( [
				'<div class="card">',
				null,
				'</div>',
			] );
			expect( value.innerBlocks ).toHaveLength( 1 );
			expect( value.innerBlocks[ 0 ].name ).toBe( 'core/paragraph' );
		} );

		it( 'falls back when an unsynced pattern has no parsed blocks', () => {
			const { action, value } = blockCompleter.getOptionCompletion( {
				name: 'core/block',
				initialAttributes: { ref: 9 },
				innerBlocks: [ [ 'core/paragraph', { content: 'Fallback' } ] ],
				innerContent: [ '<div>', null, '</div>' ],
				syncStatus: 'unsynced',
				blocks: [],
			} );

			expect( action ).toBe( 'replace' );
			expect( value.name ).toBe( 'core/block' );
			expect( value.attributes ).toEqual( { ref: 9 } );
			expect( value.innerBlocks ).toEqual( [] );
		} );

		it( 'keeps cloned blocks when an unsynced pattern has parsed blocks', () => {
			const sourceBlock = {
				name: 'core/paragraph',
				attributes: { content: 'From pattern' },
				innerBlocks: [],
				clientId: 'source-client-id',
			};

			const { value } = blockCompleter.getOptionCompletion( {
				name: 'core/html',
				syncStatus: 'unsynced',
				blocks: [ sourceBlock ],
			} );

			expect( Array.isArray( value ) ).toBe( true );
			expect( value ).toHaveLength( 1 );
			expect( value[ 0 ] ).not.toBe( sourceBlock );
			expect( value[ 0 ].name ).toBe( 'core/paragraph' );
			expect( value[ 0 ].attributes ).toEqual( {
				content: 'From pattern',
			} );
		} );

		it( 'keeps unsynced reusable patterns as a pattern block when parsed blocks are child-only', () => {
			const sourceBlock = {
				name: 'core/button',
				attributes: { text: 'Fake Text!' },
				innerBlocks: [],
				clientId: 'child-only-client-id',
			};

			const { value } = blockCompleter.getOptionCompletion( {
				name: 'core/block',
				initialAttributes: { ref: 18 },
				syncStatus: 'unsynced',
				blocks: [ sourceBlock ],
			} );

			expect( Array.isArray( value ) ).toBe( false );
			expect( value.name ).toBe( 'core/block' );
			expect( value.attributes ).toEqual( { ref: 18 } );
		} );
	} );
} );
