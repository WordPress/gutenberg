/**
 * External dependencies
 */
import path from 'path';
import { spawnSync } from 'child_process';

/**
 * Internal dependencies
 */
import { testParser } from '../shared-tests';
import { parse } from '../';

describe( 'block-serialization-spec-parser', testParser( parse ) );

describe( 'block-serialization-spec-parser-php', testParser( ( document ) => JSON.parse(
	spawnSync(
		'php',
		[ '-f', path.join( __dirname, 'test-parser.php' ) ],
		{
			input: document,
			encoding: 'utf8',
			timeout: 30 * 1000, // abort after 30 seconds, that's too long anyway
		}
	).stdout
) ) );
