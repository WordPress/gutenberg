export const testParser = ( parse ) => () => {
	describe( 'basic parsing', () => {
		test( 'parse() works properly', () => {
			expect( parse( '<!-- wp:core/more --><!--more--><!-- /wp:core/more -->' ) ).toMatchSnapshot();
		} );
	} );

	describe( 'generic tests', () => {
		test( 'parse() accepts inputs with multiple Reusable blocks', () => {
			expect( parse( '<!-- wp:block {"ref":313} /--><!-- wp:block {"ref":482} /-->' ) ).toEqual( [
				expect.objectContaining( {
					blockName: 'core/block',
					attrs: { ref: 313 },
				} ),
				expect.objectContaining( {
					blockName: 'core/block',
					attrs: { ref: 482 },
				} ),
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

		test( 'should grab HTML soup before inner block openers', () => [
			'<!-- wp:outer --><p>Break me</p><!-- wp:block /--><!-- /wp:outer -->',
			'<!-- wp:outer --><p>Break me</p><!-- wp:block --><!-- /wp:block --><!-- /wp:outer -->',
		].forEach( ( input ) => expect( parse( input ) ).toEqual( [
			expect.objectContaining( {
				innerBlocks: [ expect.objectContaining( { blockName: 'core/block', innerHTML: '' } ) ],
				innerHTML: '<p>Break me</p><!-- {0} -->',
			} ),
		] ) ) );

		test( 'should grab HTML soup after blocks', () => [
			'<!-- wp:block /--><p>Break me</p>',
			'<!-- wp:block --><!-- /wp:block --><p>Break me</p>',
		].forEach( ( input ) => expect( parse( input ) ).toEqual( [
			expect.objectContaining( { blockName: 'core/block', innerHTML: '' } ),
			expect.objectContaining( { innerHTML: '<p>Break me</p>' } ),
		] ) ) );
	} );

	describe( 'innerBlock tokenization', () => {
		test( 'adds token to empty innerHTML', () => {
			expect( parse( '<!-- wp:block --><!-- wp:void /--><!-- /wp:block -->' )[ 0 ] ).toHaveProperty( 'innerHTML', '<!-- {0} -->' );
		} );

		test( 'adds token before HTML soup', () => {
			expect( parse( '<!-- wp:block --><!-- wp:void /-->after<!-- /wp:block -->' )[ 0 ] ).toHaveProperty( 'innerHTML', '<!-- {0} -->after' );
		} );

		test( 'adds token after HTML soup', () => {
			expect( parse( '<!-- wp:block -->before<!-- wp:void /-->after<!-- /wp:block -->' )[ 0 ] ).toHaveProperty( 'innerHTML', 'before<!-- {0} -->after' );
		} );

		test( 'nests tokens with their respective blocks', () => {
			const block = parse( '<!-- wp:outer -->before<!-- wp:inner -->deep before<!-- wp:deep -->inside<!-- /wp:deep -->deep after<!-- /wp:inner -->after<!-- /wp:outer -->' )[ 0 ];

			expect( block ).toHaveProperty( 'innerHTML', 'before<!-- {0} -->after' );
			expect( block.innerBlocks[ 0 ] ).toHaveProperty( 'innerHTML', 'deep before<!-- {0} -->deep after' );
		} );
	} );
};
