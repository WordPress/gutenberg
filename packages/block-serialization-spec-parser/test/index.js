/**
 * Internal dependencies
 */
import { parse } from '../';

describe( 'block-serialization-spec-parser', () => {
	test( 'parse() works properly', () => {
		const result = parse(
			'<!-- wp:core/more --><!--more--><!-- /wp:core/more -->'
		);

		expect( result ).toMatchSnapshot();
	} );

	test( 'non-blocks get no block markers', () => (
		expect( parse( 'HTML soup' )[ 0 ] ).not.toHaveProperty( 'blockMarkers' )
	) );

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
