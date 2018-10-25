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

	test( 'adds empty block markers when no inner blocks exist', () => {
		[
			'HTML soup',
			'<!-- wp:voidBlock /-->',
			'<!-- wp:block --><!-- /wp:block -->',
			'<!-- wp:block -->with content<!-- /wp:block -->',
		].forEach( ( document ) => expect( parse( document ) ).toHaveProperty( 'blockMarkers', [] ) );
	} );
} );
