import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import {
	jsTester,
	phpTester,
} from '@wordpress/block-serialization-spec-parser/shared-tests';
import { parse } from '../src';

const testRunner = { describe, expect, test };

describe(
	'block-serialization-default-parser-js',
	jsTester( parse, testRunner )
);

phpTester(
	'block-serialization-default-parser-php',
	fileURLToPath( new URL( './test-parser.php', import.meta.url ) ),
	testRunner
);
