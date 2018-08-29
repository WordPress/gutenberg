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
} );
