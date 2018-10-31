/**
 * External dependencies
 */
import path from 'path';

/**
 * Internal dependencies
 */
import { jsTester, phpTester, parse } from '../';

describe( 'block-serialization-spec-parser-js', jsTester( parse ) );

phpTester( 'block-serialization-spec-parser-php', path.join( __dirname, 'test-parser.php' ) );
