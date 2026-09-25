import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { jsTester, phpTester } from '../shared-tests';
const require = createRequire( import.meta.url );
const { parse } = require( '../parser.js' );
const testRunner = { describe, expect, test };

describe( 'block-serialization-spec-parser-js', jsTester( parse, testRunner ) );

phpTester(
	'block-serialization-spec-parser-php',
	fileURLToPath( new URL( './test-parser.php', import.meta.url ) ),
	testRunner
);
