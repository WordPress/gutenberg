/**
 * External dependencies
 */
import path from 'path';
import { spawnSync } from 'child_process';

/**
 * Internal dependencies
 */
import { testParser } from '../../block-serialization-spec-parser/shared-tests';
import { parse } from '../';

describe( 'block-serialization-default-parser-js', testParser( parse ) );

describe( 'block-serialization-default-parser-php', testParser( ( document ) => JSON.parse(
	spawnSync(
		'php',
		[ '-f', path.join( __dirname, 'test-parser.php' ) ],
		{
			input: document,
			encoding: 'utf8',
		}
	).stdout
) ) );
