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

	test( 'adds empty block markers when no inner blocks exist', () => [
		'HTML soup',
		'<!-- wp:voidBlock /-->',
		'<!-- wp:block --><!-- /wp:block -->',
		'<!-- wp:block -->with content<!-- /wp:block -->',
	].forEach( ( document ) => expect( parse( document )[ 0 ] ).toHaveProperty( 'blockMarkers', [] ) ) );

	test( 'adds block markers for inner blocks', () => [
		[ '<!-- wp:block --><!-- wp:voidInnerBlock /--><!-- /wp:block -->', [ 0 ] ],
		[ '<!-- wp:block -->aa<!-- wp:voidInnerBlock /-->bb<!-- /wp:block -->', [ 2 ] ],
		[ '<!-- wp:block -->aa<!-- wp:innerBlock -->bb<!-- /wp:innerBlock -->cc<!-- /wp:block -->', [ 2 ] ],
		[ '<!-- wp:block --><!-- wp:start /-->aa<!-- wp:innerBlock -->bb<!-- /wp:innerBlock -->cc<!-- wp:end /--><!-- /wp:block -->', [ 0, 2, 4 ] ],
	].forEach( ( [ document, markers ] ) => expect( parse( document )[ 0 ] ).toHaveProperty( 'blockMarkers', markers ) ) );

	test( 'block markers report UCS2 length', () => [
		[ '<!-- wp:block -->a<!-- wp:voidInnerBlock /--><!-- /wp:block -->', [ 1 ] ],
		[ '<!-- wp:block -->𐀀<!-- wp:voidInnerBlock /--><!-- /wp:block -->', [ 2 ] ], // \ud800 \udc00
		[ '<!-- wp:block -->𠀀<!-- wp:voidInnerBlock /--><!-- /wp:block -->', [ 2 ] ], // \ud840 \udc00
		[ '<!-- wp:block -->葛<!-- wp:voidInnerBlock /--><!-- /wp:block -->', [ 1 ] ], // \u845B
		[ '<!-- wp:block -->葛<!-- wp:voidInnerBlock /--><!-- /wp:block -->', [ 2 ] ], // \u845B \ue0100
		[ '<!-- wp:block -->❤️<!-- wp:voidInnerBlock /--><!-- /wp:block -->', [ 2 ] ], // \u2764 \ufe0f
	].forEach( ( [ document, markers ] ) => expect( parse( document )[ 0 ] ).toHaveProperty( 'blockMarkers', markers ) ) );
} );
