/**
 * External dependencies
 */
import path from 'path';

/**
 * WordPress dependencies
 */
import { jsTester, phpTester } from '@wordpress/block-serialization-spec-parser';

/**
 * Internal dependencies
 */
import { parse } from '../';

describe( 'block-serialization-default-parser-js', jsTester( parse ) );

phpTester( 'block-serialization-default-parser-php', path.join( __dirname, 'test-parser.php' ) );
