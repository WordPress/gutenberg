/**
 * Internal dependencies
 */
import { parse } from '../';

describe( 'block-serialization-spec-parser', () => {
	test( 'parse() accepts inputs with multiple Reusable blocks', () => {
		const result = parse(
			'<!-- wp:block {"ref":313} /--><!-- wp:block {"ref":482} /-->'
		);

		expect( result ).toEqual( [
			{
				blockName: 'core/block',
				attrs: { ref: 313 },
				innerBlocks: [],
				innerHTML: '',
			},
			{
				blockName: 'core/block',
				attrs: { ref: 482 },
				innerBlocks: [],
				innerHTML: '',
			},
		] );
	} );

	test( 'treats void blocks and empty blocks identically', () => {
		expect( parse(
			'<!-- wp:block /-->'
		) ).toEqual( parse(
			'<!-- wp:block --><!-- /wp:block -->'
		) );

		expect( parse(
			'<!-- wp:my/bus { "is": "fast" } /-->'
		) ).toEqual( parse(
			'<!-- wp:my/bus { "is": "fast" } --><!-- /wp:my/bus -->'
		) );
	} );

	test( 'should grab HTML soup before block openers', () => {
		[
			'<p>Break me</p><!-- wp:block /-->',
			'<p>Break me</p><!-- wp:block --><!-- /wp:block -->',
		].forEach( ( input ) => expect( parse( input ) ).toEqual( [
			expect.objectContaining( { innerHTML: '<p>Break me</p>' } ),
			expect.objectContaining( { blockName: 'core/block', innerHTML: '' } ),
		] ) );
	} );

	test( 'should grab HTML soup before inner block openers', () => {
		[
			'<!-- wp:outer --><p>Break me</p><!-- wp:block /--><!-- /wp:outer -->',
			'<!-- wp:outer --><p>Break me</p><!-- wp:block --><!-- /wp:block --><!-- /wp:outer -->',
		].forEach( ( input ) => expect( parse( input ) ).toEqual( [
			expect.objectContaining( {
				innerBlocks: [ expect.objectContaining( { blockName: 'core/block', innerHTML: '' } ) ],
				innerHTML: '<p>Break me</p>',
			} ),
		] ) );
	} );

	test( 'should grab HTML soup after blocks', () => {
		[
			'<!-- wp:block /--><p>Break me</p>',
			'<!-- wp:block --><!-- /wp:block --><p>Break me</p>',
		].forEach( ( input ) => expect( parse( input ) ).toEqual( [
			expect.objectContaining( { blockName: 'core/block', innerHTML: '' } ),
			expect.objectContaining( { innerHTML: '<p>Break me</p>' } ),
		] ) );
	} );
} );
