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
	} );

	afterAll( () => {
		unregisterBlockType( 'core/block' );
		unregisterBlockType( 'core/html' );
		unregisterBlockType( 'core/paragraph' );
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
	} );
} );
