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
				innerHTML: '<p>Break me</p>',
			} ),
		] ) ) );

		test( 'should grab HTML soup after blocks', () => [
			'<!-- wp:block /--><p>Break me</p>',
			'<!-- wp:block --><!-- /wp:block --><p>Break me</p>',
		].forEach( ( input ) => expect( parse( input ) ).toEqual( [
			expect.objectContaining( { blockName: 'core/block', innerHTML: '' } ),
			expect.objectContaining( { innerHTML: '<p>Break me</p>' } ),
		] ) ) );

		test( 'non-blocks get no block markers', () => (
			expect( parse( 'HTML soup' )[ 0 ] ).not.toHaveProperty( 'blockMarkers' )
		) );
	} );

	describe( 'blockMarkers', () => {
		test( 'adds empty block markers when no inner blocks exist', () => [
			'<!-- wp:void /-->',
			'<!-- wp:block --><!-- /wp:block -->',
			'<!-- wp:block -->with content<!-- /wp:block -->',
		].forEach( ( document ) => expect( parse( document )[ 0 ] ).toHaveProperty( 'blockMarkers', [] ) ) );

		test( 'adds block markers for inner blocks', () => [
			[ '<!-- wp:block --><!-- wp:void /--><!-- /wp:block -->', [ 0 ] ],
			[ '<!-- wp:block -->aa<!-- wp:void /-->bb<!-- /wp:block -->', [ 2 ] ],
			[ '<!-- wp:block -->aa<!-- wp:inner -->bb<!-- /wp:inner -->cc<!-- /wp:block -->', [ 2 ] ],
			[ '<!-- wp:block --><!-- wp:start /-->aa<!-- wp:inner -->bb<!-- /wp:inner -->cc<!-- wp:end /--><!-- /wp:block -->', [ 0, 2, 4 ] ],
		].forEach( ( [ document, markers ] ) => expect( parse( document )[ 0 ] ).toHaveProperty( 'blockMarkers', markers ) ) );

		test( 'block markers report UCS2 length', () => [
			[ '<!-- wp:block -->a<!-- wp:void /--><!-- /wp:block -->', [ 1 ] ],
			[ '<!-- wp:block -->𐀀<!-- wp:void /--><!-- /wp:block -->', [ 2 ] ], // \ud800 \udc00 - multi-lingual plane
			[ '<!-- wp:block -->𠀀<!-- wp:void /--><!-- /wp:block -->', [ 2 ] ], // \ud840 \udc00 - ideographic plane
			[ '<!-- wp:block -->葛<!-- wp:void /--><!-- /wp:block -->', [ 1 ] ], // \u845B - plain character
			[ '<!-- wp:block -->葛��<!-- wp:void /--><!-- /wp:block -->', [ 3 ] ], // \u845B \ue0100 - ^^^ plus special-purpose plane variant
			[ '<!-- wp:block -->❤️<!-- wp:void /--><!-- /wp:block -->', [ 2 ] ], // \u2764 \ufe0f - emoji
		].forEach( ( [ document, markers ] ) => expect( parse( document )[ 0 ] ).toHaveProperty( 'blockMarkers', markers ) ) );
	} );
};
