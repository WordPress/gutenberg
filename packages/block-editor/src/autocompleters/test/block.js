/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import blockCompleter from '../block';

describe( 'block autocompleter', () => {
	beforeAll( () => {
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
	} );
} );
