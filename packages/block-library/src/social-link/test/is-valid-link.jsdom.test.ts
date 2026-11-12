import { describe, expect, test } from 'vitest';
import isValidLink from '../is-valid-link';

describe( 'isValidLink', () => {
	test.each( [
		[ '' ],
		[ undefined ],
		[ 'https://wordpress.org/' ],
		[ 'wordpress.org' ],
		[ 'www.wordpress.org' ],
		[ 'wordpress.org/news' ],
		[ 'me@example.com' ],
		[ 'mailto:me@example.com' ],
		[ 'tel:+15555550123' ],
	] )( 'accepts %s', ( url ) => {
		expect( isValidLink( url ) ).toBe( true );
	} );

	test.each( [ [ 'df' ], [ 'dfdf adf adaf' ], [ 'https://' ] ] )(
		'rejects %s',
		( url ) => {
			expect( isValidLink( url ) ).toBe( false );
		}
	);
} );
