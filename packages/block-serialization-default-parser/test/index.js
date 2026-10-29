import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import {
	jsTester,
	phpTester,
} from '@wordpress/block-serialization-spec-parser/shared-tests';
import { parse } from '../src';

const testRunner = { describe, expect, test };

describe( 'block-serialization-default-parser-js', () => {
	jsTester( parse, testRunner )();

	// The spec parser doesn't accept these, so they aren't shared tests.
	describe( 'closers that are void or have attributes', () => {
		test( 'parses a void closer as a void block', () => {
			expect( parse( '<!-- /wp:image /-->' ) ).toEqual(
				parse( '<!-- wp:image /-->' )
			);
		} );

		test( 'keeps the attributes of a void closer', () => {
			expect( parse( '<!-- /wp:image {"id":1} /-->' ) ).toEqual(
				parse( '<!-- wp:image {"id":1} /-->' )
			);
		} );

		test( 'ignores the attributes of a closer', () => {
			expect(
				parse( '<!-- wp:image --><!-- /wp:image {"id":1} -->' )
			).toEqual( parse( '<!-- wp:image --><!-- /wp:image -->' ) );
		} );
	} );
} );

phpTester(
	'block-serialization-default-parser-php',
	fileURLToPath( new URL( './test-parser.php', import.meta.url ) ),
	testRunner
);
