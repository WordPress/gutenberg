/**
 * External dependencies
 */
import path from 'path';

/**
 * WordPress dependencies
 */
// eslint-disable-next-line no-restricted-syntax
import {
	jsTester,
	phpTester,
} from '@wordpress/block-serialization-spec-parser/shared-tests';

/**
 * Internal dependencies
 */
import { parse } from '../src';

describe( 'block-serialization-default-parser-js', jsTester( parse ) ); // eslint-disable-line jest/valid-describe

phpTester(
	'block-serialization-default-parser-php',
	path.join( __dirname, 'test-parser.php' )
);
