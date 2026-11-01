import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import blockCompleter from '../block';

describe( 'block autocompleter', () => {
	beforeAll( () => {
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
	} );

	afterAll( () => {
		unregisterBlockType( 'core/html' );
		unregisterBlockType( 'core/paragraph' );
	} );

	describe( 'getOptionCompletion', () => {
		it( "carries a variation's innerContent onto the inserted block", () => {
			// @ts-expect-error The stub provides only what the completion needs.
			const { action, value } = blockCompleter.getOptionCompletion( {
				name: 'core/html',
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
	} );
} );
