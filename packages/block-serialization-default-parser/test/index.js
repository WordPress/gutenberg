import path from 'path';
import {
	jsTester,
	phpTester,
} from '@wordpress/block-serialization-spec-parser/shared-tests';
import { parse } from '../src';

describe( 'block-serialization-default-parser-js', jsTester( parse ) ); // eslint-disable-line jest/valid-describe-callback

phpTester(
	'block-serialization-default-parser-php',
	path.join( __dirname, 'test-parser.php' )
);
