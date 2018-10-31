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

const hasPHP = () => {
	const process = spawnSync( 'php', [ '-r', 'echo 1;' ], { encoding: 'utf8' } );

	return process.status === 0 && process.stdout === '1';
};

// skipping if `php` isn't available to us, such as in local dev without it
// skipping preserves snapshots while commenting out or simply
// not injecting the tests prompts `jest` to remove "obsolete snapshots"
// eslint-disable-next-line jest/no-disabled-tests
const makeTest = hasPHP() ? ( ...args ) => describe( ...args ) : ( ...args ) => describe.skip( ...args );

makeTest( 'block-serialization-default-parser-php', testParser( ( document ) => JSON.parse(
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
